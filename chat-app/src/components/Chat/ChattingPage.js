import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { auth, firestore } from '../firebase-config';
import { doc, onSnapshot, updateDoc, arrayUnion, deleteDoc, getDoc, writeBatch } from "firebase/firestore";
import './ChattingPage.css';

const ChattingPage = () => {
  const { chattingId } = useParams();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [userProfiles, setUserProfiles] = useState({});
  const [showProfile, setShowProfile] = useState(false);
  const [selectedUserProfile, setSelectedUserProfile] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!auth.currentUser) {
      navigate('/login');
      return;
    }
    if (!chattingId) {
      navigate('/dashboard');
      return;
    }

    const fetchUserProfiles = async (chatData) => {
      const profiles = {};
      for (const userId of chatData.users) {
        const userRef = doc(firestore, 'users', userId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          profiles[userId] = userSnap.data();
        }
      }
      setUserProfiles(profiles);
    };

    const chatRef = doc(firestore, 'chats', chattingId);
    const unsubscribe = onSnapshot(chatRef, async (docSnapshot) => {
      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        setMessages(data.messages.sort((a, b) => a.timestamp - b.timestamp));
        fetchUserProfiles(data);
      } else {
        navigate('/dashboard');
      }
    });

    return () => unsubscribe();
  }, [chattingId, navigate]);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    if (!chattingId) return;
    const chatRef = doc(firestore, 'chats', chattingId);
    await updateDoc(chatRef, {
      messages: arrayUnion({
        text: newMessage,
        senderId: auth.currentUser.uid,
        timestamp: new Date().getTime()
      })
    });
    setNewMessage('');
  };

  const endChat = async () => {
    if (!chattingId) return;
    const chatRef = doc(firestore, 'chats', chattingId);
    const chatData = (await getDoc(chatRef)).data();
    if (chatData) {
      const batch = writeBatch(firestore);
      chatData.users.forEach(userId => {
        const userRef = doc(firestore, 'users', userId);
        batch.update(userRef, {
          currentChatId: '',
          lookingForChat: false
        });
      });
      await batch.commit();
      navigate('/chat');
      await deleteDoc(chatRef);
    }
  };

  const showUserProfile = (userId) => {
    setSelectedUserProfile(userProfiles[userId]);
    setShowProfile(true);
  };

  return (
    <div className="chatting-container">
      <div className="video-section">
        <div className="video-window" id="local-video"></div>
        <div className="video-window" id="remote-video"></div>
      </div>
      <div className="chat-section">
        <div className="message-list">
          {messages.map((msg, index) => (
            <p key={index} onClick={() => showUserProfile(msg.senderId)}
              className={`message ${msg.senderId === auth.currentUser.uid ? "current-user" : "other-user"}`}>
              <span className={msg.senderId === auth.currentUser.uid ? "" : "clickable-username"}>
                {userProfiles[msg.senderId] ? userProfiles[msg.senderId].name : (msg.senderId === auth.currentUser.uid ? "You" : "Them")}
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
        {showProfile && selectedUserProfile && (
          <div className="profile-card">
            <img src={selectedUserProfile.pictureUrl} alt={selectedUserProfile.name} />
            <h3>{selectedUserProfile.name}</h3>
            <p>Age: {selectedUserProfile.age}</p>
            <p>Bio: {selectedUserProfile.bio}</p>
            <p>Gender: {selectedUserProfile.gender}</p>
            <p>Interests: {selectedUserProfile.interests.join(', ')}</p>
            <button onClick={() => setShowProfile(false)} className="close-profile-btn">Close Profile</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChattingPage;
