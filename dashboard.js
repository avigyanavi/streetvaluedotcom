import React from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase-config';
import { signOut } from "firebase/auth";
import './Dashboard.css'; // Ensure you have a CSS module at this path

const Dashboard = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <div className="container">
      <h1>Welcome to Your Dashboard</h1>
      <button className="link-button" onClick={() => navigate('/profile')}>View/Edit Profile</button>
      <button className="link-button" onClick={() => navigate('/chat')}>Chat Room</button>
      <button className="link-button" onClick={() => navigate('/search')}>Search Users</button>
      <button id="logout-button" onClick={handleLogout}>Logout</button>
    </div>
  );
};

export default Dashboard;
