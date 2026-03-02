// ============================================
// Shared Storage wrapper for Hs4all
// Uses IndexedDB (primary, no size limit) + localStorage (fallback) + Firebase (sync)
// IndexedDB is essential because base64 audio/image files can be several MB,
// easily exceeding localStorage's ~5MB limit which caused silent data loss.
// ============================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getDatabase, ref, get, set } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";

// ============================================
// IndexedDB wrapper — no size limit, works offline
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
    apiKey: "AIzaSyAq1NlDWiCo-BGTEGhTY4UaSrNSVvj0mjM",
    authDomain: "newappai-6f3c8.firebaseapp.com",
    databaseURL: "https://newappai-6f3c8-default-rtdb.europe-west1.firebasedatabase.app/",
    projectId: "newappai-6f3c8",
    storageBucket: "newappai-6f3c8.firebasestorage.app",
    messagingSenderId: "85735420418",
    appId: "1:85735420418:web:1a40a5efdf969d87ab6d1b",
    measurementId: "G-BGQ0QFXT58"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const StorageDB = {
    // Helper to sanitize keys for Firebase (replaces . with __dot__)
    _sanitize(obj) {
        if (!obj || typeof obj !== 'object') return obj;
        if (Array.isArray(obj)) return obj.map(this._sanitize.bind(this));
        const newObj = {};
        for (const k in obj) {
            const cleanKey = k.replace(/\./g, '__dot__');
            newObj[cleanKey] = this._sanitize(obj[k]);
        }
        return newObj;
    },

    // Helper to restore keys from Firebase (replaces __dot__ with .)
    _restore(obj) {
        if (!obj || typeof obj !== 'object') return obj;
        if (Array.isArray(obj)) return obj.map(this._restore.bind(this));
        const newObj = {};
        for (const k in obj) {
            const originalKey = k.replace(/__dot__/g, '.');
            newObj[originalKey] = this._restore(obj[k]);
        }
        return newObj;
    },

    async set(key, val) {
        // PRIMARY: Write to IndexedDB (no size limit — essential for base64 audio/images)
        await IDBStore.set(key, val);

        // SECONDARY: Also write to localStorage for backward compat (best-effort, may fail for large data)
        try {
            localStorage.setItem(key, JSON.stringify(val));
        } catch (e) {
            // localStorage quota exceeded — OK, we have IndexedDB
            console.warn('localStorage full, using IndexedDB only for key:', key);
        }

        // BACKGROUND: Sync to Firebase (fire-and-forget, don't await)
        try {
            const safeVal = this._sanitize(val);
            set(ref(db, 'data/' + key), safeVal).catch((e) => {
                console.warn('Firebase write skipped (offline or rules expired):', e.code || e.message);
            });
        } catch (e) {
            console.warn('Firebase sync error:', e);
        }
        return true;
    },

    async get(key) {
        // PRIMARY: Read from IndexedDB (instant, large data OK, no quota issues)
        const idbVal = await IDBStore.get(key);
        if (idbVal !== null && idbVal !== undefined) {
            // IndexedDB has data — return it immediately.
            // DO NOT overwrite with Firebase: Firebase may have stale/default data
            // if the Firebase write failed (expired rules, offline, etc.)
            return idbVal;
        }

        // SECONDARY: Try localStorage (small data or legacy from before IndexedDB)
        let localVal = null;
        try {
            const stored = localStorage.getItem(key);
            if (stored) localVal = JSON.parse(stored);
        } catch (e) { /* corrupt */ }

        if (localVal !== null) {
            // Migrate legacy localStorage data to IndexedDB
            IDBStore.set(key, localVal).catch(() => { });
            return localVal;
        }

        // LAST RESORT: Wait for Firebase (only when truly no local data at all)
        try {
            const firebasePromise = get(ref(db, 'data/' + key));
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('timeout')), 15000)
            );
            const snapshot = await Promise.race([firebasePromise, timeoutPromise]);
            if (snapshot.exists()) {
                const val = this._restore(snapshot.val());
                // Save Firebase data locally so we don't hit Firebase on every load
                await IDBStore.set(key, val);
                try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) { }
                return val;
            }
        } catch (e) {
            console.warn('Firebase fetch failed or timed out for ' + key + ':', e.message || e);
        }

        return null;
    }
};

window.StorageDB = StorageDB;
window.dispatchEvent(new Event('StorageDBReady'));
