// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyB301KStazMdmCg3xqXBxVbDs-xa3QGTMI",
    authDomain: "street-valuedotcom.firebaseapp.com",
    databaseURL: "https://street-valuedotcom-default-rtdb.firebaseio.com",
    projectId: "street-valuedotcom",
    storageBucket: "street-valuedotcom.appspot.com",
    messagingSenderId: "451954536625",
    appId: "1:451954536625:web:c9d60f9d69a5e78eae3290",
    measurementId: "G-124TBVHGY0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const firestore = getFirestore(app);
export const database = getDatabase(app);
