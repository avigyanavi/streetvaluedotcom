// Importing auth from the centralized Firebase config module
import { auth } from './firebase-config.js';
import {
  signInAnonymously,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";

// Listen for authentication state changes
onAuthStateChanged(auth, user => {
  if (user) {
    // User is signed in.
    if (location.pathname === '/index.html' || location.pathname === '/') {
      location.href = 'dashboard.html'; // Redirect to dashboard after login
    }
  } else {
    // User is signed out.
    if (location.pathname !== '/index.html') {
      location.href = 'index.html'; // Redirect to login page if not logged in
    }
  }
});

// Function to handle anonymous login
export function loginAnonymously() {
  signInAnonymously(auth)
    .catch(error => {
      console.error("Error during anonymous sign-in:", error);
      alert("Anonymous login failed: " + error.message);
    });
}

// Function to handle email and password login
export function loginWithEmail(email, password) {
  signInWithEmailAndPassword(auth, email, password)
    .catch(error => {
      console.error("Error during email sign-in:", error);
      alert("Login failed: " + error.message);
    });
}

// Function to handle email and password registration
export function signUpWithEmail(email, password) {
  createUserWithEmailAndPassword(auth, email, password)
    .then(() => {
      // Navigate to signup page to complete profile setup
      location.href = 'profile.html';
    })
    .catch(error => {
      console.error("Error during email sign-up:", error);
      alert("Signup failed: " + error.message);
    });
}

// Function to sign out the user
export function signOutUser() {
  signOut(auth)
    .then(() => {
      console.log("User signed out successfully");
      location.href = 'index.html';
    })
    .catch(error => {
      console.error("Error signing out:", error);
      alert("Sign out failed: " + error.message);
    });
}

// Add event listeners for the buttons on the HTML page
document.addEventListener('DOMContentLoaded', () => {
  const loginAnonButton = document.getElementById('login-anon');
  const loginEmailButton = document.getElementById('login-email-btn');
  const signupButton = document.getElementById('signup-email-btn');

  if (loginAnonButton) loginAnonButton.addEventListener('click', loginAnonymously);
  if (loginEmailButton) loginEmailButton.addEventListener('click', () => {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    loginWithEmail(email, password);
  });
  if (signupButton) signupButton.addEventListener('click', () => {
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    signUpWithEmail(email, password);
  });
});
