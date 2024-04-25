import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-analytics.js";
import {
  getAuth,
  signInAnonymously,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
import { getDatabase, ref, push, set, onChildAdded } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-database.js";

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

const app = initializeApp(firebaseConfig);
getAnalytics(app);
const auth = getAuth(app);
const database = getDatabase(app);

onAuthStateChanged(auth, (user) => {
  const authSection = document.getElementById('authentication');
  const chatSection = document.getElementById('chat');
  if (user) {
    authSection.style.display = 'none';
    chatSection.style.display = 'block';
  } else {
    authSection.style.display = 'block';
    chatSection.style.display = 'none';
  }
});

function displayMessage(message, user, timestamp) {
  const messagesDiv = document.getElementById('messages');
  const messageElement = document.createElement('div');
  const userElement = document.createElement('strong');
  userElement.innerText = user + ': ';
  messageElement.appendChild(userElement);
  const messageText = document.createElement('span');
  messageText.innerText = message + ' ';
  messageElement.appendChild(messageText);
  const timestampElement = document.createElement('span');
  timestampElement.style.fontSize = '0.7em';
  timestampElement.style.marginLeft = '10px';
  timestampElement.innerText = new Date(timestamp).toLocaleTimeString();
  messageElement.appendChild(timestampElement);
  messagesDiv.appendChild(messageElement);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function sendMessage() {
  const messageInput = document.getElementById('message-input');
  const messageData = {
    text: messageInput.value,
    user: auth.currentUser.uid,
    timestamp: Date.now()
  };
  if (messageInput.value.trim() !== '') {
    const newMessageRef = push(ref(database, 'messages'));
    set(newMessageRef, messageData).then(() => {
      messageInput.value = '';
    }).catch((error) => {
      console.error("Error writing message to Firebase Database", error);
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('send-button').addEventListener('click', sendMessage);
  document.getElementById('login-anon').addEventListener('click', () => {
    signInAnonymously(auth).catch((error) => {
      console.error("Error with anonymous authentication", error);
    });
  });
  document.getElementById('login-email-btn').addEventListener('click', () => {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    signInWithEmailAndPassword(auth, email, password).catch((error) => {
      console.error("Error with email authentication", error);
    });
  });
  document.getElementById('signup-email-btn').addEventListener('click', () => {
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    createUserWithEmailAndPassword(auth, email, password).catch((error) => {
      console.error("Error with email sign up", error);
    });

  });
  document.getElementById('logout-button').addEventListener('click', () => {
    signOut(auth);
  });
});

onChildAdded(ref(database, 'messages'), (snapshot) => {
  const data = snapshot.val();
  displayMessage(data.text, data.user, data.timestamp);
});