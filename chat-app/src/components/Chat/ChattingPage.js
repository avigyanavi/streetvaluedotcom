import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { auth, firestore, database } from '../firebase-config';
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { ref, set, onValue, push, remove, serverTimestamp } from "firebase/database";
import './ChattingPage.css';

const ChattingPage = () => {
  const { chattingId } = useParams();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [userProfiles, setUserProfiles] = useState({});
  const [selectedUserProfile, setSelectedUserProfile] = useState(null);
  const navigate = useNavigate();
  const endChatFlagRef = ref(database, `chatSessions/${chattingId}/endChatFlag`);
  const messagesRef = ref(database, `chatSessions/${chattingId}/messages`);

  useEffect(() => {
    if (!auth.currentUser) {
      navigate('/login');
      return;
    }
    if (!chattingId) {
      navigate('/dashboard');
      return;
    }

    // Fetch user profiles from Firestore
    const chatRef = doc(firestore, 'chats', chattingId);
    getDoc(chatRef).then(docSnapshot => {
      if (docSnapshot.exists()) {
        const chatData = docSnapshot.data();
        const profiles = {};
        chatData.users.forEach(async userId => {
          const userRef = doc(firestore, 'users', userId);
          const userSnapshot = await getDoc(userRef);
          if (userSnapshot.exists()) {
            profiles[userId] = userSnapshot.data();
          }
          setUserProfiles(profiles);
        });
      }
    });

    // Listen for incoming messages
    onValue(messagesRef, (snapshot) => {
      const loadedMessages = [];
      snapshot.forEach(childSnapshot => {
        loadedMessages.push({ id: childSnapshot.key, ...childSnapshot.val() });
      });
      setMessages(loadedMessages.sort((a, b) => a.timestamp - b.timestamp));
    });

    // Listen for the end chat signal
    onValue(endChatFlagRef, (snapshot) => {
      if (snapshot.val() === true) {
        cleanupAndRedirect();
      }
    });

    return () => {
      remove(messagesRef); // Clean up the messages
      remove(endChatFlagRef); // Clean up the end chat flag
    };
  }, [chattingId, navigate]);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    const newMessageRef = push(messagesRef);
    await set(newMessageRef, {
      text: newMessage,
      senderId: auth.currentUser.uid,
      timestamp: serverTimestamp()
    });
    setNewMessage('');
  };

  const endChat = async () => {
    await set(endChatFlagRef, true); // Signal other user that chat has ended
    cleanupAndRedirect();
  };

  const cleanupAndRedirect = async () => {
    // Clear currentChatId in Firestore
    const userRef = doc(firestore, 'users', auth.currentUser.uid);
    await updateDoc(userRef, { currentChatId: '' });

    // Navigate to chat page after a delay
    setTimeout(() => {
      navigate('/chat');
    }, 2000);
  };

  const showUserProfile = (userId) => {
    setSelectedUserProfile(userProfiles[userId]);
  };

  return (
    <div className="chatting-container">
      <div className="message-list">
        {messages.map((msg) => (
          <p key={msg.id} className={`message ${msg.senderId === auth.currentUser.uid ? "current-user" : "other-user"}`}>
            <span onClick={() => showUserProfile(msg.senderId)} className={msg.senderId === auth.currentUser.uid ? "" : "clickable-username"}>
              {msg.senderId === auth.currentUser.uid ? "You" : "Them"}
            </span>
            : {msg.text}
          </p>
        ))}
      </div>
      <div className="chat-inputs">
        <input type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)} />
        <button onClick={sendMessage}>Send</button>
        <button onClick={endChat}>End Chat</button>
      </div>
      {selectedUserProfile && (
        <div className="profile-card">
          <img src={selectedUserProfile.pictureUrl || "/default-profile.png"} alt={selectedUserProfile.name || "Profile"} />
          <h3>{selectedUserProfile.name}</h3>
          <p>Age: {selectedUserProfile.age}</p>
          <p>Bio: {selectedUserProfile.bio}</p>
          <p>Gender: {selectedUserProfile.gender}</p>
          <p>Interests: {selectedUserProfile.interests.join(', ')}</p>
          <button onClick={() => setSelectedUserProfile(null)} className="close-profile-btn">Close Profile</button>
        </div>
      )}
    </div>
  );
};

export default ChattingPage;
