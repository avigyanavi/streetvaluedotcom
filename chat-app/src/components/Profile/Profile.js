import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, firestore, storage } from '../firebase-config';
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { signOut } from "firebase/auth";
import './Profile.css';


const Profile = () => {
  const [profile, setProfile] = useState({
    name: '',
    bio: '',
    age: '',
    gender: '',
    interests: [],
    pictureUrl: ''
  });
  const [newInterest, setNewInterest] = useState('');
  const [editing, setEditing] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!auth.currentUser) {
      navigate('/login');
      return;
    }
    const userProfileRef = doc(firestore, 'users', auth.currentUser.uid);
    getDoc(userProfileRef).then(docSnap => {
      if (docSnap.exists()) {
        setProfile(docSnap.data() || {});
      }
    }).catch(error => {
      console.error("Error fetching user profile:", error);
    });
  }, [navigate]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleBackToDashboard = () => {
    navigate('/dashboard'); // Navigate to Dashboard component
  };

  const handleAddInterest = () => {
    if (newInterest && !profile.interests.includes(newInterest)) {
      setProfile(prev => ({
        ...prev,
        interests: [...prev.interests, newInterest.trim()]
      }));
      setNewInterest('');
    }
  };

  const handleRemoveInterest = interest => {
    setProfile(prev => ({
      ...prev,
      interests: prev.interests.filter(i => i !== interest)
    }));
  };

  const handleNewInterestChange = (e) => {
    setNewInterest(e.target.value);
  };
  
  const saveProfile = async () => {
    let photoURL = profile.pictureUrl;
    if (imageFile) {
      const fileRef = storageRef(storage, `profile_pictures/${auth.currentUser.uid}`);
      const fileSnapshot = await uploadBytes(fileRef, imageFile);
      photoURL = await getDownloadURL(fileSnapshot.ref);
    }
    
    await updateDoc(doc(firestore, 'users', auth.currentUser.uid), {
      ...profile,
      pictureUrl: photoURL
    });
    setProfile(prev => ({ ...prev, pictureUrl: photoURL }));
    setEditing(false);
  };

  return (
    <div className="profile-page">
      <div className="profile-container">
        <h1>Profile</h1>
        {editing ? (
          <>
            <input type="text" name="name" placeholder="Name" value={profile.name} onChange={handleInputChange} />
            <input type="text" name="bio" placeholder="Bio" value={profile.bio} onChange={handleInputChange} />
            <input type="number" name="age" placeholder="Age" value={profile.age} onChange={handleInputChange} />
            <select name="gender" value={profile.gender} onChange={handleInputChange}>
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
            <div>
              <label className='interest-heading'>Interests:</label>
              {profile.interests.map((interest, index) => (
                <div key={index} className="interest-item">
                  <span className="edit-profile-interest-text" type="text">{interest}</span>
                  <span className= "remove-interest-btn" type="button" onClick={() => handleRemoveInterest(interest)}>Remove</span>
                </div>
              ))}
              <input
                type="text"
                value={newInterest}
                onChange={handleNewInterestChange}
                placeholder="Add new interest"
              />
              <button type="button" onClick={handleAddInterest}>Add Interest</button>
            </div>
            <input type="file" onChange={handleImageChange} />
            <button onClick={saveProfile}>Save</button>
            <button onClick={() => setEditing(false)}>Cancel</button>
          </>
        ) : (
          <>
            <p>Name: {profile.name}</p>
            <p>Bio: {profile.bio}</p>
            <p>Age: {profile.age}</p>
            <p>Gender: {profile.gender}</p>
            <p>Interests: {profile.interests.join(', ')}</p>
            <img src={profile.pictureUrl || 'default-profile.png'} alt="Profile" className="profile-image" />
            <button onClick={() => setEditing(true)}>Edit</button>
          </>
        )}
        <button onClick={handleBackToDashboard}>Back to Dashboard</button>
        <button onClick={handleLogout}>Logout</button>
      </div>
    </div>
  );
};

export default Profile;
