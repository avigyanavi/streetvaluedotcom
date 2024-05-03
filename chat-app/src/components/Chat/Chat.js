import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, firestore } from '../firebase-config';
import { doc, updateDoc } from "firebase/firestore";
import './Chat.css';

const Chat = () => {
  const [interestBased, setInterestBased] = useState(false);
  const navigate = useNavigate();

  const handleFindMatchClick = async () => {
    if (!auth.currentUser) {
      console.log("No user is logged in");
      return;
    }

    const currentUserRef = doc(firestore, 'users', auth.currentUser.uid);
    try {
      await updateDoc(currentUserRef, {
        lookingForChat: true,
        interestBased: interestBased
      });
      navigate('/waiting', { state: { interestBased: interestBased } });
    } catch (error) {
      console.error("Error setting lookingForChat status: ", error);
    }
  };

  return (
    <div className="chat-page">
      <div className="chat-container">
        <div className="interest-toggle">
          <label>
            <input
              type="checkbox"
              checked={interestBased}
              onChange={(e) => setInterestBased(e.target.checked)}
            />
            <span className='interest-text'>Interest-Based Matching</span>
          </label>
        </div>
        <button onClick={handleFindMatchClick} className="find-match-button">
          Find a Match
        </button>
        <button onClick={() => navigate('/dashboard')} className="dashboard-button">
          Back to Dashboard
        </button>
      </div>
    </div>
  );
};

export default Chat;