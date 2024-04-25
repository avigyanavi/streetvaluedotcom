// Import necessary Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-database.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-storage.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

// Firebase configuration
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
const auth = getAuth(app);
const database = getDatabase(app);
const storage = getStorage(app); // Initialize the storage service

// Initialize Firestore
const firestore = getFirestore(app);
export { firestore };

export default app;
export { auth, database, storage }; // Export the initialized services
