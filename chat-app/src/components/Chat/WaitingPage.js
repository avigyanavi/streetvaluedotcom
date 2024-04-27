import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, firestore } from '../firebase-config';
import { doc, updateDoc, collection, query, where, onSnapshot, writeBatch, getDoc } from "firebase/firestore";
import './WaitingPage.css';

const WaitingPage = () => {
  const navigate = useNavigate();
  const [potentialMatches, setPotentialMatches] = useState([]);
  const [matchedUserData, setMatchedUserData] = useState(null);
  const [timeoutId, setTimeoutId] = useState(null);

  useEffect(() => {
    if (!auth.currentUser) {
      navigate('/login');
      return;
    }

    const currentUserRef = doc(firestore, 'users', auth.currentUser.uid);
    updateDoc(currentUserRef, { lookingForChat: true });

    const unsubCurrentUser = onSnapshot(currentUserRef, (doc) => {
      const userData = doc.data();
      if (userData.currentChatId) {
        navigate(`/chatting/${userData.currentChatId}`);
      }
    });

    const q = query(collection(firestore, 'users'), where('lookingForChat', '==', true));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const users = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() })).filter(user => user.uid !== auth.currentUser.uid && user.lookingForChat);
      console.log("Fetched users: ", users);
      setPotentialMatches(users);
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
  }, [navigate]);

  const handleAcceptMatch = async (matchedUser) => {
    clearTimeout(timeoutId);
    const chatId = [auth.currentUser.uid, matchedUser.uid].sort().join('_');
    const chatRef = doc(firestore, 'chats', chatId);
    const batch = writeBatch(firestore);

    batch.set(chatRef, { users: [auth.currentUser.uid, matchedUser.uid], messages: [] });
    batch.update(doc(firestore, 'users', auth.currentUser.uid), { currentChatId: chatId, lookingForChat: false });
    batch.update(doc(firestore, 'users', matchedUser.uid), { currentChatId: chatId, lookingForChat: false });

    await batch.commit();
    navigate(`/chatting/${chatId}`);
  };

  const handleContinueSearching = () => {
    setPotentialMatches([]);
    navigate('/waiting');
  };
  
  console.log("Potential Matches: ", potentialMatches);

  const cancelSearch = () => {
    clearTimeout(timeoutId);
    updateDoc(doc(firestore, 'users', auth.currentUser.uid), { lookingForChat: false })
      .then(() => {
        navigate('/chat');
      })
      .catch(err => {
        console.error("Failed to cancel match search: ", err);
      });
  };

  return (
    <div className="waiting-page">
      <h1>{potentialMatches.length > 0 ? "Match found!" : "Looking for a match..."}</h1>
      {matchedUserData ? (
        <div className="match-card">
          <img src={matchedUserData.pictureURL} alt={matchedUserData.displayName} />
          <p>{matchedUserData.name}</p>
          <button onClick={() => navigate(`/chatting/${matchedUserData.currentChatId}`)}>Start Chat</button>
        </div>
      ) : (
        potentialMatches.length > 0 ? (
          <div className="match-cards">
            {potentialMatches.map(user => (
              console.log("User object:", user),
              <div key={user.uid} className="match-card">
                <img src={user.pictureUrl} alt="No Pic Uploaded" />
                <p>{user.name}</p>
                <button onClick={() => handleAcceptMatch(user)}>Start Chat</button>
                <button onClick={handleContinueSearching}>Continue Searching</button>
              </div>
            ))}
          </div>
        ) : (
          <p>Please wait while we find someone you can chat with.</p>
        )
      )}
      <button onClick={cancelSearch} className="cancel-button">Cancel</button>
    </div>
  );
};

export default WaitingPage;
