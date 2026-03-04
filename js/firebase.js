// Firebase configuration and initialization
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyAj1Rf9v2X5iV-BFCTy5d8td5ygzQhHwFs",
  authDomain: "hs4all-6801b.firebaseapp.com",
  projectId: "hs4all-6801b",
  storageBucket: "hs4all-6801b.firebasestorage.app",
  messagingSenderId: "485406380101",
  appId: "1:485406380101:web:d1cd6778f4c6c0995e932c",
  measurementId: "G-3BQTL6581K"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export { app, analytics };