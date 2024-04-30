import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/Login/Login';
import Profile from './components/Profile/Profile';
import Dashboard from './components/Dashboard/Dashboard';
import Search from './components/Search/Search';
import Chat from './components/Chat/Chat';
import './App.css';
import Signup from './components/Signup/Signup';
import VerifyEmail from './components/Signup/VerifyEmail';
import WaitingPage from './components/Chat/WaitingPage';
import ChattingPage from './components/Chat/ChattingPage';
import SavedPeople from './components/Search/SavedPeople';
import LoginWithEmail from './components/Login/LoginWthEmail';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/loginWithEmail" element={<LoginWithEmail />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/search" element={<Search />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/waiting" element={<WaitingPage />} />
        <Route path="/chatting/:chattingId" element={<ChattingPage />} /> {/* Add this line */}
        <Route path="/saved-people" element={<SavedPeople />} /> 
        {/* Redirect user to Login page if route does not exist and user is not logged in */}
        <Route path="*" element={<Login />} />
      </Routes>
    </Router>
  );
}

export default App;
