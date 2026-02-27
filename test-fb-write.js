const { initializeApp } = require("firebase/app");
const { getDatabase, ref, set, get } = require("firebase/database");
const { XMLHttpRequest } = require("xmlhttprequest");

global.XMLHttpRequest = XMLHttpRequest;

const firebaseConfig = {
    apiKey: "AIzaSyCQadMN2ijjmaOLgKIS0BUWeibeb3ec2iA",
    authDomain: "hs4all-38145.firebaseapp.com",
    databaseURL: "https://hs4all-38145-default-rtdb.firebaseio.com",
    projectId: "hs4all-38145",
    storageBucket: "hs4all-38145.firebasestorage.app",
    messagingSenderId: "168276417016",
    appId: "1:168276417016:web:68e141427b216aa0f79e0d",
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

(async () => {
    try {
        console.log("Testing write...");
        await set(ref(db, 'data/test_ping'), { ping: Date.now() });
        console.log("Write success!");

        console.log("Testing read...");
        const snap = await get(ref(db, 'data/test_ping'));
        console.log("Read success! Value:", snap.val());
    } catch (e) {
        console.error("Firebase Error:", e.message, e.code);
    }
    process.exit(0);
})();
