import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { auth, firestore, database, storage } from '../firebase-config';
import { doc, updateDoc, getDoc, writeBatch } from "firebase/firestore";
import { ref, set, onValue, push, serverTimestamp, remove, onDisconnect } from "firebase/database";
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject, listAll } from "firebase/storage";
import './ChattingPage.css';

const ChattingPage = () => {
  const { chattingId } = useParams();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedUserProfile, setSelectedUserProfile] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const messagesRef = ref(database, `chatSessions/${chattingId}/messages`);
  const fileInputRef = useRef(null); // Reference to reset file input

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
      snapshot.forEach((childSnapshot) => {
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

    // Setting the disconnection timer to 120 seconds
    const disconnectTimeout = 120000; // 120,000 milliseconds = 120 seconds
    setTimeout(() => {
      onDisconnect(endChatFlagRef).set(true);
    }, disconnectTimeout);

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

  const handleFileUpload = async (event) => {
    if (event.target.files.length > 0) {
      setIsLoading(true);
      const file = event.target.files[0];
      const fileType = file.type.startsWith('video') ? 'video' : 'image';
      const fileRef = storageRef(storage, `chat_${fileType}s/${chattingId}/${file.name}`);
      try {
        const snapshot = await uploadBytes(fileRef, file);
        const fileUrl = await getDownloadURL(snapshot.ref);

        const newMessageRef = push(messagesRef);
        await set(newMessageRef, {
          [`${fileType}Url`]: fileUrl,
          senderId: auth.currentUser.uid,
          timestamp: serverTimestamp(),
          type: fileType
        });

        // Reset file input after the upload completes
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } catch (error) {
        console.error("File upload failed:", error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const endChatCleanup = async () => {
    const userIds = chattingId.split('_');
    const batch = writeBatch(firestore);
    userIds.forEach((userId) => {
      const userRef = doc(firestore, 'users', userId);
      batch.update(userRef, { currentChatId: '' });
    });

    try {
      await batch.commit();
    } catch (error) {
      console.error("Failed to clear currentChatId for users:", error);
      return;
    }

    const chatSessionRef = ref(database, `chatSessions/${chattingId}`);
    try {
      await remove(chatSessionRef);
    } catch (error) {
      console.error("Failed to remove chat session:", error);
    }

    const cleanupMedia = async (folderName) => {
      const mediaRef = storageRef(storage, `${folderName}/${chattingId}`);
      try {
        const listFiles = await listAll(mediaRef);
        const deletePromises = listFiles.items.map(async (itemRef) => {
          try {
            await deleteObject(itemRef);
          } catch (err) {
            console.error(`Failed to delete file: ${itemRef.fullPath}`, err);
          }
        });
        await Promise.all(deletePromises);
      } catch (error) {
        console.error(`Error listing files in ${folderName} for deletion:`, error);
      }
    };

    await cleanupMedia('chat_images');
    await cleanupMedia('chat_videos');

    navigate('/chat');
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
          <div key={msg.id} className={`message ${msg.senderId === auth.currentUser.uid ? "current-user" : "other-user"}`}>
            {msg.type === 'image' ? (
              <img src={msg.imageUrl} alt="Sent image" className="sent-image" />
            ) : msg.type === 'video' ? (
              <video controls src={msg.videoUrl} className="sent-video" />
            ) : (
              <>
                {msg.senderId === auth.currentUser.uid ? "You" : (
                  <span
                    className="clickable-username"
                    onClick={() => showUserProfile(msg.senderId)}
                  >
                    {selectedUserProfile ? selectedUserProfile.name : "Them"}
                  </span>
                )}: {msg.text}
              </>
            )}
          </div>
        ))}
      </div>
      <div className="chat-inputs">
        <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} />
        <button onClick={sendMessage}>Send</button>
        <input
          type="file"
          accept="image/*,video/*"
          onChange={handleFileUpload}
          ref={fileInputRef}
        />
        <button onClick={() => set(ref(database, `chatSessions/${chattingId}/endChatFlag`), true)}>End Chat</button>
      </div>
      {isLoading && <div className="loading-icon">Uploading...</div>}
      {showProfile && selectedUserProfile && (
        <div className="profile-card">
          <img src={selectedUserProfile.pictureUrl || "https://firebasestorage.googleapis.com/v0/b/omegldotin.appspot.com/o/default-profile.png?alt=media&token=7056aaef-d1c6-4bcf-b499-0c8764f8464a"} alt={selectedUserProfile.name || "No DP set"} />
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
