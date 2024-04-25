import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { auth, firestore } from '../firebase-config';
import { doc, onSnapshot, updateDoc, arrayUnion, deleteDoc, getDoc, writeBatch } from "firebase/firestore";

const ChattingPage = () => {
  const { chattingId } = useParams();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
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

    const chatRef = doc(firestore, 'chats', chattingId);
    const unsubscribe = onSnapshot(chatRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        setMessages(data.messages.sort((a, b) => a.timestamp - b.timestamp));
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
      navigate('/dashboard');
      await deleteDoc(chatRef);
    }
  };

  return (
    <div>
      <div>
        {messages.map((msg, index) => (
          <p key={index}>{msg.senderId === auth.currentUser.uid ? "You: " : "Them: "}{msg.text}</p>
        ))}
      </div>
      <input value={newMessage} onChange={e => setNewMessage(e.target.value)} />
      <button onClick={sendMessage}>Send</button>
      <button onClick={endChat}>End Chat</button>
    </div>
  );
};

export default ChattingPage;
