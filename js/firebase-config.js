// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, updateDoc, doc, onSnapshot, deleteDoc, query, orderBy } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyB-mn7a_sMiiQnu1iKy5tAtrjiw-p1IL2U",
    authDomain: "phase4-whoscored.firebaseapp.com",
    projectId: "phase4-whoscored",
    storageBucket: "phase4-whoscored.firebasestorage.app",
    messagingSenderId: "769303128883",
    appId: "1:769303128883:web:8a914453b292a8da382c46"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export {
    app,
    db,
    auth,
    collection,
    addDoc,
    getDocs,
    updateDoc,
    doc,
    onSnapshot,
    deleteDoc,
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut,
    query,
    orderBy
};
