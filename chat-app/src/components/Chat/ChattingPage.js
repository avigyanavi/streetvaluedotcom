import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { auth, firestore, database } from '../firebase-config';
import { doc, updateDoc, getDoc, writeBatch } from "firebase/firestore";
import { ref, set, onValue, push, serverTimestamp, remove } from "firebase/database";
import './ChattingPage.css';
import { onDisconnect } from 'firebase/database';

const ChattingPage = () => {
  const { chattingId } = useParams();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedUserProfile, setSelectedUserProfile] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const navigate = useNavigate();
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

    const unsubscribeMessages = onValue(messagesRef, (snapshot) => {
      const loadedMessages = [];
      snapshot.forEach(childSnapshot => {
        loadedMessages.push({ id: childSnapshot.key, ...childSnapshot.val() });
      });
      setMessages(loadedMessages.sort((a, b) => a.timestamp - b.timestamp));
    });

    const endChatFlagRef = ref(database, `chatSessions/${chattingId}/endChatFlag`);
    const unsubscribeEndChat = onValue(endChatFlagRef, (snapshot) => {
      if (snapshot.val() === true) {
        endChatCleanup();
      }
    });

    onDisconnect(endChatFlagRef).set(true).then(() => {
      console.log("onDisconnect set successfully.");
    });

    return () => {
      unsubscribeMessages();
      unsubscribeEndChat();
      onDisconnect(endChatFlagRef).cancel();
      remove(messagesRef);
      remove(endChatFlagRef);
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

  const endChatCleanup = async () => {
    const userIds = chattingId.split('_');
    const batch = writeBatch(firestore);
    userIds.forEach((userId) => {
      const userRef = doc(firestore, 'users', userId);
      batch.update(userRef, { currentChatId: '' });
    });
    const chatSessionRef = ref(database, `chatSessions/${chattingId}`);
    remove(chatSessionRef);
    try {
      await batch.commit();
      navigate('/chat');
    } catch (error) {
      console.error("Failed to clear currentChatId for users:", error);
    }
  };

  const showUserProfile = async (userId) => {
    const userRef = doc(firestore, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      setSelectedUserProfile(userSnap.data());
      setShowProfile(true);
    } else {
      console.error(`No profile found for user ID: ${userId}`);
    }
  };

  return (
    <div className="chatting-container">
      <div className="message-list">
        {messages.map((msg) => (
          <p key={msg.id} onClick={() => msg.senderId !== auth.currentUser.uid && showUserProfile(msg.senderId)}
             className={`message ${msg.senderId === auth.currentUser.uid ? "current-user" : "other-user"}`}>
            {msg.senderId === auth.currentUser.uid ? "You" : 
              <span className="clickable-username">
                {selectedUserProfile ? selectedUserProfile.name : "Them"}
              </span>
            }: {msg.text}
          </p>
        ))}
      </div>
      <div className="chat-inputs">
        <input type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)} />
        <button onClick={sendMessage}>Send</button>
        <button onClick={() => set(ref(database, `chatSessions/${chattingId}/endChatFlag`), true)}>End Chat</button>
      </div>
      {showProfile && selectedUserProfile && (
        <div className="profile-card">
          <img src={selectedUserProfile.pictureUrl || "/default-profile.png"} alt={selectedUserProfile.name || "No DP set"} />
          <h3>{selectedUserProfile.name}</h3>
          <p>Age: {selectedUserProfile.age}</p>
          <p>Bio: {selectedUserProfile.bio}</p>
          <p>Gender: {selectedUserProfile.gender}</p>
          <p>Interests: {selectedUserProfile.interests.join(', ')}</p>
          <button onClick={() => setShowProfile(false)} className="close-profile-btn">Close Profile</button>
        </div>
      )}
    </div>
  );
};

export default ChattingPage;