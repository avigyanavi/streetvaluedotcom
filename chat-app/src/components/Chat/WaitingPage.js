import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { auth, firestore, database } from '../firebase-config';
import { doc, updateDoc, collection, query, where, onSnapshot, writeBatch } from "firebase/firestore";
import { ref, set, serverTimestamp } from "firebase/database";

const WaitingPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [potentialMatches, setPotentialMatches] = useState([]);
  const [commonInterests, setCommonInterests] = useState([]);
  const [timeoutId, setTimeoutId] = useState(null);
  const interestBased = location.state?.interestBased;

  useEffect(() => {
    if (!auth.currentUser) {
      navigate('/login');
      return;
    }
  
    const currentUserRef = doc(firestore, 'users', auth.currentUser.uid);
    updateDoc(currentUserRef, { lookingForChat: true, interestBased });
  
    const unsubCurrentUser = onSnapshot(currentUserRef, (doc) => {
      const userData = doc.data();
      if (userData && userData.currentChatId) {  // Ensure userData exists and has the property currentChatId
        navigate(`/chatting/${userData.currentChatId}`);
      }
    });
  
    const q = query(collection(firestore, 'users'), where('lookingForChat', '==', true));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const currentUserData = snapshot.docs.find(doc => doc.id === auth.currentUser.uid)?.data();
      const users = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() })).filter(user => user.uid !== auth.currentUser.uid);
      
      if (interestBased && currentUserData?.interests) {
        const potentialInterestsMatches = users.filter(user => user.interests.some(interest => currentUserData.interests.includes(interest)));
        if (potentialInterestsMatches.length) {
          const firstMatchInterests = potentialInterestsMatches[0].interests;
          const common = currentUserData.interests.filter(interest => firstMatchInterests.includes(interest));
          setCommonInterests(common);
          setPotentialMatches(potentialInterestsMatches);
        }
      } else {
        setPotentialMatches(users);
      }
    }, err => {
      console.error("Error fetching potential matches: ", err);
    });
  
    const id = setTimeout(() => {
      updateDoc(currentUserRef, { lookingForChat: false }).then(() => {
        navigate('/chat');
      });
    }, 60000);
    setTimeoutId(id);
  
    return () => {
      clearTimeout(id);
      unsubscribe();
      unsubCurrentUser();
      updateDoc(currentUserRef, { lookingForChat: false });
    };
  }, [navigate, interestBased]);

  const handleAcceptMatch = async (matchedUser) => {
    clearTimeout(timeoutId);
    const chatId = [auth.currentUser.uid, matchedUser.uid].sort().join('_');
    const chatSessionRef = ref(database, `chatSessions/${chatId}`);
    
    // Set initial chat session in Realtime Database
    await set(chatSessionRef, {
      users: [auth.currentUser.uid, matchedUser.uid],
      timestamp: serverTimestamp()
    });

    // Update Firestore user data with currentChatId to manage session
    const batch = writeBatch(firestore);
    batch.update(doc(firestore, 'users', auth.currentUser.uid), { currentChatId: chatId, lookingForChat: false });
    batch.update(doc(firestore, 'users', matchedUser.uid), { currentChatId: chatId, lookingForChat: false });
    await batch.commit();

    navigate(`/chatting/${chatId}`);
  };

  return (
    <div className="waiting-page">
      <h1>{potentialMatches.length > 0 ? `Match found! Common interests: ${commonInterests.join(', ')}` : "Looking for a match..."}</h1>
      <div className="match-cards">
        {potentialMatches.map(user => (
          <div key={user.uid} className="match-card">
            <img src={user.pictureUrl} alt="Profile" />
            <p>{user.name}</p>
            <button onClick={() => handleAcceptMatch(user)}>Start Chat</button>
          </div>
        ))}
      </div>
      <button onClick={() => {
        clearTimeout(timeoutId);
        updateDoc(doc(firestore, 'users', auth.currentUser.uid), { lookingForChat: false });
        navigate('/chat');
      }} className="cancel-button">Cancel</button>
    </div>
  );
};

export default WaitingPage;
