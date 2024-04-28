import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase-config'; // Adjust this import based on your project structure
import './Dashboard.css';
import { signOut } from "firebase/auth";

const Dashboard = () => {
    const [user, setUser] = useState(null);
    const navigate = useNavigate();
  
    useEffect(() => {
      // Check if the user is logged in and update the state
      if (auth.currentUser) {
        setUser({
          name: auth.currentUser.displayName || auth.currentUser.uid
        });
      } else {
        // Redirect to login if no user is found
        navigate('/login');
      }
    }, [navigate]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
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
        {/* <button className="link-button" onClick={() => navigate('/search')}>Search</button>
        <button className="link-button" onClick={() => navigate('/saved-people')}>Friends</button> */}
        <button className="link-button" onClick={handleLogout}>Logout</button>


        <footer className="footer-text">
      We don't sell or release data to anyone
    </footer>
      </div>
  );
};

export default Dashboard;