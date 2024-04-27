import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, firestore } from '../firebase-config'; // Adjust the path based on your project structure
import { signInWithEmailAndPassword, signInAnonymously } from "firebase/auth";
import './Login.css';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/dashboard');
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = () => {
    navigate('/signup'); // Adjust '/signup' to the path you've set for your signup page
  };

  const handleAnonymousLogin = async () => {
    setLoading(true);
    try {
      const { user } = await signInAnonymously(auth);
      const userRef = doc(firestore, 'users', user.uid);
      const userSnap = await getDoc(userRef);
  
      if (!userSnap.exists()) {
        // Create the document with initial fields
        await setDoc(userRef, {
          uid: user.uid,
          name: "Guest" + Math.floor(Math.random() * 1000),
          lookingForChat: false,
          bio: "This is an anonymous user.",
          age: "Not specified",
          gender: "Not specified",
          interests: [],
          interestBased: false,
          // other initial fields...
        });
      }
  
      navigate('/dashboard');
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const titles = [
    'Welcome to Street-Value.com',
    'Chat with Strangers',
    'Chat with Friends',
  ];

  if (loading) {
    return <div className="loading-spinner">Loading...</div>; // Add styling for the loading spinner
  }

  return (
    <div className="login-container">
      {loading ? (
        <div className="loading-spinner">Loading...</div>
      ) : (
        <form className="login-form" onSubmit={handleLogin}>
          <div className="animated-titles">
            {titles.map((title, index) => (
              <h1 key={index} className={`title-animation title-${index}`}>
                {title.split('').map((char, charIndex) => (
                  <span key={charIndex}>{char}</span>
                ))}
              </h1>
            ))}
          </div>
          <h2>Log In</h2>
          <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit" className="login-button">Log In</button>
        <button type="button" className="signup-button" onClick={handleSignUp}>Sign Up</button>
        <button type="button" className="anonymous-button" onClick={handleAnonymousLogin}>Login Anonymously</button>
      </form>
      )}
    </div>
  );
};
export default Login;
