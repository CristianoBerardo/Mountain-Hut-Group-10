// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
// EXCLUDED: storageBucket, messagingSenderId
const firebaseConfig = {
  apiKey: "AIzaSyCrdOmyB4GRCZt4FEYbmFuu3pFzDbGY25k",
  authDomain: "mountain-hut-group-10.firebaseapp.com",
  projectId: "mountain-hut-group-10",
  storageBucket: "mountain-hut-group-10.firebasestorage.app",
  messagingSenderId: "338550708358",
  appId: "1:338550708358:web:b4c1c74a52e76ad34c9907",
  measurementId: "G-9F9KHNM2FM"
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app); // Export the Firebase app instance for authentication
