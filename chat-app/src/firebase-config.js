// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBDMy77cD4Rer7f8r0vys9s3uah5oCLUZw",
  authDomain: "omegldotin.firebaseapp.com",
  databaseURL: "https://omegldotin-default-rtdb.firebaseio.com",
  projectId: "omegldotin",
  storageBucket: "omegldotin.appspot.com",
  messagingSenderId: "728107123402",
  appId: "1:728107123402:web:0b2d4ac0a3b0c352d86a33",
  measurementId: "G-EN28SE5XHC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const firestore = getFirestore(app);
export const database = getDatabase(app);
