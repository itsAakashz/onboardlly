// lib/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCtyblUJCxJo9t29DXzduxl2CMNB2zbpwg",
  authDomain: "onboardly-36c1e.firebaseapp.com",
  projectId: "onboardly-36c1e",
  storageBucket: "onboardly-36c1e.firebasestorage.app",
  messagingSenderId: "912082369990",
  appId: "1:912082369990:web:04715acfc1091c2d2cc6c7",
  measurementId: "G-M4KS1Q297P"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };