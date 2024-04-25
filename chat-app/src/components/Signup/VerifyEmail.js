import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase-config';
import './VerifyEmail.css';

const VerifyEmail = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const interval = setInterval(() => {
      auth.currentUser.reload().then(() => {
        if (auth.currentUser.emailVerified) {
          clearInterval(interval);
          navigate('/profile'); // Redirect to profile page after email is verified
        }
      });
    }, 1000); // Check every second

    return () => clearInterval(interval);
  }, [navigate]);

  return (
    <div className="verify-email-container">
      <h1>Please Verify Your Email Address</h1>
      <p>An email has been sent to your email address. Please click on the verification link to verify your account.</p>
      <button onClick={() => window.location.reload()}>Click to Refresh</button>
    </div>
  );
};

export default VerifyEmail;
