import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { auth, firestore } from '../firebase-config';
import { doc, updateDoc, collection, query, where, onSnapshot, writeBatch } from "firebase/firestore";

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
      if (userData.currentChatId) {
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
          // Find common interests for the first match (this can be adapted for multiple matches)
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
    setCommonInterests([]);
    navigate('/waiting');
  };

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

  const matchFoundText = commonInterests.length > 0
    ? `Match found! Common interest${commonInterests.length > 1 ? 's' : ''}: ${commonInterests.join(', ')}`
    : "Match found!";

  return (
    <div className="waiting-page">
      <h1>{potentialMatches.length > 0 ? matchFoundText : "Looking for a match..."}</h1>
      <div className="match-cards">
        {potentialMatches.map(user => (
          <div key={user.uid} className="match-card">
            <img src={user.pictureUrl || "/default-profile.png"} alt={"No DP"} />
            <p>{user.name}</p>
            <button onClick={() => handleAcceptMatch(user)}>Start Chat</button>
            <button onClick={handleContinueSearching}>Continue Searching</button>
          </div>
        ))}
      </div>
      <button onClick={cancelSearch} className="cancel-button">Cancel</button>
    </div>
  );
};

export default WaitingPage;
