// ============================================
// Shared Storage wrapper for Hs4all
// PRIMARY: Firebase Realtime Database (shared across ALL users/browsers)
// CACHE:   IndexedDB (local cache to avoid repeated Firebase reads)
// FALLBACK: localStorage (legacy / small data)
//
// WHY FIREBASE IS PRIMARY:
//   IndexedDB and localStorage are local to each browser.
//   Data saved by the admin on browser A is invisible to visitors on browser B.
//   Firebase Realtime Database is the only truly shared store.
//
// CHUNKING:
//   Firebase Realtime Database has a ~10MB total write limit per request
//   and a ~256KB per leaf node recommendation. Base64 images/sounds can be
//   several MB, so large values are split into 200KB chunks before writing
//   to Firebase, and reassembled on read.
// ============================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getDatabase, ref, get, set, remove } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";

// ============================================
// IndexedDB wrapper — no size limit, used as LOCAL CACHE only
// ============================================
const IDBStore = {
    _db: null,
    DB_NAME: 'hs4all_idb',
    STORE_NAME: 'kv',

    async _open() {
        if (this._db) return this._db;
        return new Promise((resolve, reject) => {
            const req = indexedDB.open(this.DB_NAME, 1);
            req.onupgradeneeded = (e) => {
                e.target.result.createObjectStore(this.STORE_NAME);
            };
            req.onsuccess = (e) => { this._db = e.target.result; resolve(this._db); };
            req.onerror = () => reject(req.error);
        });
    },

    async set(key, val) {
        try {
            const db = await this._open();
            return new Promise((resolve, reject) => {
                const tx = db.transaction(this.STORE_NAME, 'readwrite');
                tx.objectStore(this.STORE_NAME).put(val, key);
                tx.oncomplete = () => resolve(true);
                tx.onerror = () => reject(tx.error);
            });
        } catch (e) {
            console.warn('IDBStore.set failed:', e);
            return false;
        }
    },

    async get(key) {
        try {
            const db = await this._open();
            return new Promise((resolve, reject) => {
                const tx = db.transaction(this.STORE_NAME, 'readonly');
                const req = tx.objectStore(this.STORE_NAME).get(key);
                req.onsuccess = () => resolve(req.result !== undefined ? req.result : null);
                req.onerror = () => reject(req.error);
            });
        } catch (e) {
            console.warn('IDBStore.get failed:', e);
            return null;
        }
    }
};

const firebaseConfig = {
    apiKey: "AIzaSyAj1Rf9v2X5iV-BFCTy5d8td5ygzQhHwFs",
    authDomain: "hs4all-6801b.firebaseapp.com",
    databaseURL: "https://hs4all-6801b-default-rtdb.europe-west1.firebasedatabase.app/",
    projectId: "hs4all-6801b",
    storageBucket: "hs4all-6801b.firebasestorage.app",
    messagingSenderId: "485406380101",
    appId: "1:485406380101:web:d1cd6778f4c6c0995e932c",
    measurementId: "G-3BQTL6581K"
};

const app = initializeApp(firebaseConfig);
const firebaseDB = getDatabase(app);

// ============================================
// Chunking helpers
// Firebase Realtime DB leaf nodes should stay under 256KB.
// We split large JSON strings into 200KB chunks.
// ============================================
const CHUNK_SIZE = 200 * 1024; // 200KB per chunk (safe margin under 256KB limit)

function _chunkString(str) {
    const chunks = [];
    for (let i = 0; i < str.length; i += CHUNK_SIZE) {
        chunks.push(str.slice(i, i + CHUNK_SIZE));
    }
    return chunks;
}

// ============================================
// Sanitize / restore Firebase keys (Firebase doesn't allow . in keys)
// ============================================
function _sanitize(obj) {
    if (!obj || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(_sanitize);
    const newObj = {};
    for (const k in obj) {
        const cleanKey = k.replace(/\./g, '__dot__');
        newObj[cleanKey] = _sanitize(obj[k]);
    }
    return newObj;
}

function _restore(obj) {
    if (!obj || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(_restore);
    const newObj = {};
    for (const k in obj) {
        const originalKey = k.replace(/__dot__/g, '.');
        newObj[originalKey] = _restore(obj[k]);
    }
    return newObj;
}

// ============================================
// Write a value to Firebase, using chunking for large values
// ============================================
async function _firebaseSet(key, val) {
    const jsonStr = JSON.stringify(_sanitize(val));

    if (jsonStr.length <= CHUNK_SIZE) {
        // Small enough — write directly
        await set(ref(firebaseDB, 'data/' + key), { _v: 1, _single: jsonStr });
    } else {
        // Large — split into chunks
        const chunks = _chunkString(jsonStr);
        const payload = { _v: 1, _chunked: true, _count: chunks.length };
        chunks.forEach((c, i) => { payload['_c' + i] = c; });
        await set(ref(firebaseDB, 'data/' + key), payload);
        console.log(`[StorageDB] Wrote ${chunks.length} chunks for key "${key}" (${(jsonStr.length / 1024).toFixed(1)} KB)`);
    }
}

// ============================================
// Read a value from Firebase, reassembling chunks if needed
// ============================================
async function _firebaseGet(key) {
    const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 15000)
    );
    const snapshot = await Promise.race([
        get(ref(firebaseDB, 'data/' + key)),
        timeoutPromise
    ]);

    if (!snapshot.exists()) return null;

    const raw = snapshot.val();

    if (!raw || !raw._v) {
        // Legacy format (written before chunking was added) — restore directly
        return _restore(raw);
    }

    let jsonStr;
    if (raw._chunked) {
        // Reassemble chunks
        const parts = [];
        for (let i = 0; i < raw._count; i++) {
            parts.push(raw['_c' + i]);
        }
        jsonStr = parts.join('');
    } else {
        jsonStr = raw._single;
    }

    try {
        return _restore(JSON.parse(jsonStr));
    } catch (e) {
        console.error('[StorageDB] JSON parse error for key', key, e);
        return null;
    }
}

// ============================================
// StorageDB — Firebase-first with local IndexedDB cache
// ============================================
const StorageDB = {
    // In-memory version timestamps to detect stale cache
    _versions: {},

    _getLocalVersion(key) {
        if (this._versions[key]) return this._versions[key];
        try {
            const v = localStorage.getItem('__fbver_' + key);
            return v ? Number(v) : null;
        } catch (e) { return null; }
    },

    _setLocalVersion(key, ts) {
        this._versions[key] = ts;
        try { localStorage.setItem('__fbver_' + key, String(ts)); } catch (e) { }
    },

    async set(key, val) {
        const ts = Date.now();

        // PRIMARY: Write to Firebase FIRST (awaited — shared across all browsers)
        let firebaseOk = false;
        try {
            await _firebaseSet(key, val);
            // Write version timestamp to Firebase so all clients can detect stale cache
            await set(ref(firebaseDB, 'data/__versions/' + key), ts);
            firebaseOk = true;
            this._setLocalVersion(key, ts);
            console.log('[StorageDB] ✅ Firebase write OK for', key);
        } catch (e) {
            console.error('[StorageDB] ❌ Firebase write FAILED for', key, ':', e.code || e.message);
            // Still save locally so admin sees their own changes in this session
        }

        // CACHE: Write to IndexedDB (local cache, no size limit)
        await IDBStore.set(key, val);

        // CACHE: Also write to localStorage (best-effort, may fail for large data)
        try {
            localStorage.setItem(key, JSON.stringify(val));
        } catch (e) {
            console.warn('[StorageDB] localStorage quota exceeded for key:', key, '— IndexedDB cache used.');
        }

        return firebaseOk;
    },

    async get(key) {
        // Step 1: Get Firebase version (tiny payload — just a number)
        let firebaseVer = null;
        try {
            const vSnap = await Promise.race([
                get(ref(firebaseDB, 'data/__versions/' + key)),
                new Promise((_, reject) => setTimeout(() => reject(new Error('ver-timeout')), 5000))
            ]);
            firebaseVer = vSnap.exists() ? vSnap.val() : null;
        } catch (e) {
            console.warn('[StorageDB] Could not get version for', key, '— assuming stale cache');
        }

        const localVer = this._getLocalVersion(key);

        // Step 2: Use cache if versions match (Firebase version matches what we wrote last)
        if (firebaseVer !== null && localVer !== null && localVer === firebaseVer) {
            const idbVal = await IDBStore.get(key);
            if (idbVal !== null && idbVal !== undefined) {
                console.log('[StorageDB] ⚡ Cache HIT for', key);
                return idbVal;
            }
        }

        // Step 3: Cache is stale or missing — fetch full data from Firebase
        try {
            const val = await _firebaseGet(key);
            if (val !== null) {
                console.log('[StorageDB] 🔥 Firebase READ for', key);

                // Update local cache
                await IDBStore.set(key, val);
                try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) { }

                // Sync version
                if (firebaseVer !== null) {
                    this._setLocalVersion(key, firebaseVer);
                }

                return val;
            }
        } catch (e) {
            console.warn('[StorageDB] Firebase fetch failed for ' + key + ':', e.message || e);
        }

        // Step 4: Last resort — use stale local cache (Firebase unreachable)
        const idbFallback = await IDBStore.get(key);
        if (idbFallback !== null && idbFallback !== undefined) {
            console.warn('[StorageDB] ⚠️ Using stale cache for', key, '(Firebase unreachable)');
            return idbFallback;
        }

        // Step 5: Try legacy localStorage data
        try {
            const stored = localStorage.getItem(key);
            if (stored) {
                const localVal = JSON.parse(stored);
                if (localVal !== null) {
                    IDBStore.set(key, localVal).catch(() => { });
                    return localVal;
                }
            }
        } catch (e) { /* corrupt */ }

        return null;
    }
};

window.StorageDB = StorageDB;
window.dispatchEvent(new Event('StorageDBReady'));
