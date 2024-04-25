import { auth, database, firestore } from './firebase-config.js';
import { ref, set, onValue, push, remove } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-database.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
import { collection, addDoc, query, where, getDocs, onSnapshot, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

let currentChatRef = null;
let matchAttempt = null;
let matchListenerUnsubscribe = null;

// UI state management function
function setUIForChatting(isChatting) {
  document.getElementById('new-message').style.display = isChatting ? 'flex' : 'none';
  document.getElementById('send-button').style.display = isChatting ? 'inline' : 'none';
  document.getElementById('end-chat-button').style.display = isChatting ? 'inline' : 'none';
  document.getElementById('random-match-button').style.display = isChatting ? 'none' : 'inline';
  document.getElementById('stop-matching-button').style.display = isChatting ? 'none' : 'inline';
  document.getElementById('loading').style.display = 'none';
}

function sendMessage() {
  const input = document.getElementById('message-input');
  const message = input.value.trim();
  if (message && currentChatRef) {
    const newMessageRef = push(currentChatRef);
    set(newMessageRef, {
      text: message,
      user: auth.currentUser.displayName || auth.currentUser.uid,
      timestamp: Date.now(),
    }).then(() => {
      input.value = '';
    });
  }
}

function receiveMessages(chatRef) {
  onValue(chatRef, snapshot => {
    const messagesContainer = document.getElementById('messages');
    messagesContainer.innerHTML = '';
    snapshot.forEach(childSnapshot => {
      const message = childSnapshot.val();
      const messageDiv = document.createElement('div');
      messageDiv.textContent = `${message.user}: ${message.text}`;
      messagesContainer.appendChild(messageDiv);
    });
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  });
}

function startRandomMatch() {
  document.getElementById('loading').style.display = 'block';
  addDoc(collection(firestore, 'waiting_room'), {
    userId: auth.currentUser.uid,
    timestamp: Date.now(),
  }).then(() => {
    const waitingRoomQuery = query(collection(firestore, 'waiting_room'), where('userId', '!=', auth.currentUser.uid));
    matchListenerUnsubscribe = onSnapshot(waitingRoomQuery, async (snapshot) => {
      const availableUsers = [];
      snapshot.forEach((doc) => {
        if (doc.data().userId !== auth.currentUser.uid) {
          availableUsers.push(doc.data().userId);
        }
      });

      if (availableUsers.length > 0) {
        // Found a match, create a chat session
        const matchedUserUid = availableUsers[0];
        const chatId = [auth.currentUser.uid, matchedUserUid].sort().join('_');
        currentChatRef = ref(database, `chats/${chatId}`);
        receiveMessages(currentChatRef);
        setUIForChatting(true);

        // Cleanup Firestore entries
        await deleteDoc(doc(firestore, 'waiting_room', auth.currentUser.uid));
        await deleteDoc(doc(firestore, 'waiting_room', matchedUserUid));

        if (matchListenerUnsubscribe) {
          matchListenerUnsubscribe();
        }

        alert('Chat has started!');
      } else {
        // If no match found, keep listening
      }
    });
  }).catch((error) => {
    console.error('Error adding user to waiting_room:', error);
    document.getElementById('loading').style.display = 'none';
  });
}

function stopRandomMatch() {
  if (matchListenerUnsubscribe) {
    matchListenerUnsubscribe(); // Unsubscribe from Firestore listener
    matchListenerUnsubscribe = null;
  }

  // Remove user from waiting_room
  deleteDoc(doc(firestore, 'waiting_room', auth.currentUser.uid)).then(() => {
    setUIForChatting(false);
    document.getElementById('loading').style.display = 'none';
  });
}

function endChat() {
  if (currentChatRef) {
    remove(currentChatRef).then(() => {
      alert('Chat ended successfully.');
      currentChatRef = null;
      setUIForChatting(false);
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  onAuthStateChanged(auth, user => {
    if (user) {
      document.getElementById('random-match-button').addEventListener('click', startRandomMatch);
      document.getElementById('send-button').addEventListener('click', sendMessage);
      document.getElementById('end-chat-button').addEventListener('click', endChat);
      document.getElementById('stop-matching-button').addEventListener('click', stopRandomMatch);
      setUIForChatting(false); // Initialize UI for non-chatting state
    } else {
      window.location.href = 'login.html';
    }
  });
});
