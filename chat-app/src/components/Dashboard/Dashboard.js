import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, database } from '../firebase-config';
import './Dashboard.css';
import { signOut } from "firebase/auth";
import { ref, set, onDisconnect } from "firebase/database";

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (auth.currentUser) {
      setUser({
        uid: auth.currentUser.uid, // Store UID for later use during logout
        name: auth.currentUser.displayName || auth.currentUser.email || auth.currentUser.uid
      });

      // Set user online status
      const statusRef = ref(database, `status/${auth.currentUser.uid}`);
      set(statusRef, { isOnline: true });

      // Set the user's status to offline on disconnect
      onDisconnect(statusRef).set({ isOnline: false });
    } else {
      navigate('/login');
    }
  }, [navigate]);

  const handleLogout = async () => {
    if (user) {
      // Use stored UID from user state
      const statusRef = ref(database, `status/${user.uid}`);
      await set(statusRef, { isOnline: false });
    }
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error logging out:', error);
    }
    navigate('/login');
  };

  const createAnimatedTitle = (text) => {
    return text.split('').map((char, index) => (
      <span key={index} style={{ 
        opacity: 0,
        animation: `fadeIn 0.5s forwards ${index / 10 + 1}s`,
        display: 'inline-block'
      }}>
        {char}
      </span>
    ));
  };

  return (
    <div className="dashboard-page">
      <h1>Welcome {user ? createAnimatedTitle(user.name) : 'Loading...'} to your Dashboard</h1>
      <button className="link-button" onClick={() => navigate('/profile')}>Profile</button>
      <button className="link-button" onClick={() => navigate('/chat')}>Chat</button>
      <button className="link-button" onClick={handleLogout}>Logout</button>
      <footer className="footer-text">
        We don't sell or release data to anyone.
      </footer>
    </div>
  );
};

export default Dashboard;
