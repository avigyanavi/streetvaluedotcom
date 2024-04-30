import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase-config'; // Adjust the path based on your project structure
import { signInWithEmailAndPassword } from "firebase/auth";
import './LoginWithEmail.css'; // Ensure you have the appropriate CSS file

const LoginWithEmail = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/dashboard'); // Redirect to the dashboard page after login
    } catch (error) {
      alert("Failed to log in: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = () => {
    // Navigate to a reset password page or handle reset logic
    navigate('/resetPassword');
  };

  return (
    <div className="login-with-email-container">
      {loading ? (
        <div>Loading...</div>
      ) : (
        <form onSubmit={handleLogin} className="login-with-email-form">
          <h1>Login</h1>
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" className="submit-button">Log In</button>
          <button type="button" onClick={handleResetPassword} className="reset-password-button">Reset Password</button>
        </form>
      )}
    </div>
  );
};

export default LoginWithEmail;
