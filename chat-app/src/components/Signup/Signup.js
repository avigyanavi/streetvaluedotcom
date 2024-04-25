import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, firestore } from '../firebase-config';
import { createUserWithEmailAndPassword, sendEmailVerification, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import './Signup.css';

const Signup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [interests, setInterests] = useState('');
  const [gender, setGender] = useState('');
  const navigate = useNavigate();

  const handleSignUp = async (event) => {
    event.preventDefault();
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, {
        displayName: name
      });
      const interestsArray = interests.split(',').map(interest => interest.trim()); // Split string into an array and trim whitespace
      await setDoc(doc(firestore, "users", userCredential.user.uid), {
        name,
        age,
        interests: interestsArray, // Store as an array
        gender,
        bio: "", // Initially blank
        profilePicture: "" // Initially blank
      });
  
      // Send email verification
      await sendEmailVerification(userCredential.user).then(() => {
        navigate('/verify-email'); // Redirect to a page where you ask the user to verify their email
      }).catch((error) => {
        console.error("Email verification error:", error);
        alert("Failed to send email verification.");
      });
      
    } catch (error) {
      alert(error.message);
    }
  };
  
  return (
    <div className="signup-container">
      <form className="signup-form" onSubmit={handleSignUp}>
        <h1>Sign Up</h1>
        <input type="text" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} />
        <input type="number" placeholder="Age" value={age} onChange={(e) => setAge(e.target.value)} />
        <input type="text" placeholder="Interests (comma-separated)" value={interests} onChange={(e) => setInterests(e.target.value)} />
        <select value={gender} onChange={(e) => setGender(e.target.value)}>
          <option value="">Select Gender</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </select>
        <input type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button type="submit" className="signup-button">Sign Up</button>
      </form>
    </div>
  );
};

export default Signup;
