// Firebase configuration and initialization
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyCQadMN2ijjmaOLgKIS0BUWeibeb3ec2iA",
  authDomain: "hs4all-38145.firebaseapp.com",
  projectId: "hs4all-38145",
  storageBucket: "hs4all-38145.appspot.com",
  messagingSenderId: "168276417016",
  appId: "1:168276417016:web:68e141427b216aa0f79e0d",
  measurementId: "G-19L19GFVRP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export { app, analytics };