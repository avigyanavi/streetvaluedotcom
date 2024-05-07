import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInAnonymously } from "firebase/auth";
import { auth, firestore } from '../firebase-config'; // Assuming this is the correct path to your config
import { getDatabase, ref, onValue } from "firebase/database"; // Make sure to import from 'firebase/database' and not from your local config if it doesn't export database correctly
import { doc, getDoc, setDoc } from 'firebase/firestore';
import './Login.css';

const Login = () => {
  const [onlineUsersCount, setOnlineUsersCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const db = getDatabase();
    // Listen for online users
    const onlineUsersRef = ref(db, 'status');
    const unsubscribe = onValue(onlineUsersRef, (snapshot) => {
      let count = 0;
      snapshot.forEach((childSnapshot) => {
        if (childSnapshot.val().isOnline) {
          count++;
        }
      });
      setOnlineUsersCount(count);
    });

    return () => unsubscribe();
  }, []);

  const handleSignInWithEmail = () => {
    navigate('/loginWithEmail');
  };

  const handleSignUp = () => {
    navigate('/signup');
  };

  const handleAnonymousLogin = async () => {
    try {
      const { user } = await signInAnonymously(auth);
      const userRef = doc(firestore, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        await setDoc(userRef, {
          uid: user.uid,
          name: "Guest" + Math.floor(Math.random() * 1000),
          lookingForChat: false,
          bio: "This is an anonymous user.",
          age: "Not specified",
          gender: "Not specified",
          interests: [],
          interestBased: false,
        });
      }
      navigate('/dashboard');
    } catch (error) {
      console.error('Error during anonymous login:', error);
      alert(error.message);
    }
  };

  const titles = [
    'The new Omegl.in',
    'Chat with Anyone, Anywhere',
    'Profile based or Anonymous Chatting',
  ];

  return (
    <div className="login-container">
      <div className="animated-titles">
        {titles.map((title, index) => (
          <h1 key={index} className={`title-animation title-${index}`}>
            {title.split('').map((char, charIndex) => (
              <span key={charIndex}>{char}</span>
            ))}
          </h1>
        ))}
      </div>
      <div className="online-users-count">
        Online Users: {onlineUsersCount}
      </div>
      <button onClick={handleSignInWithEmail} className="login-button">Log In</button>
      <button onClick={handleSignUp} className="signup-button">Sign Up</button>
      <button onClick={handleAnonymousLogin} className="anonymous-button">Sign In Anonymously</button>
    </div>
  );
};

export default Login;
