import { auth, database, storage } from './firebase-config.js';
import { ref, update, onValue, runTransaction } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-database.js";
import { ref as storageRef, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-storage.js";
import { signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";

onAuthStateChanged(auth, user => {
    if (user) {
        loadUserProfile();
    }
});

document.getElementById('logout-button').addEventListener('click', signOutUser);

function loadUserProfile() {
    const userProfileRef = ref(database, 'users/' + auth.currentUser.uid);
    onValue(userProfileRef, snapshot => {
        const data = snapshot.val() || {};
        document.getElementById('display-profile-name').value = data.name || '';
        document.getElementById('display-profile-bio').value = data.bio || '';
        document.getElementById('display-profile-age').value = data.age || '';
        document.getElementById('display-profile-gender').value = data.gender || '';
        const interestsContainer = document.getElementById('interest-tags-container');
        interestsContainer.innerHTML = '';
        (data.interests || []).forEach(interest => {
            const tag = document.createElement('span');
            tag.className = 'interest-tag';
            tag.textContent = interest + ' ×';
            tag.addEventListener('click', () => {
                removeInterestFromProfile(interest);
            });
            interestsContainer.appendChild(tag);
        });
        if (data.pictureUrl) {
            document.getElementById('profile-picture').src = data.pictureUrl;
        }
    });
}

document.getElementById('update-profile').addEventListener('click', () => {
    const userProfileRef = ref(database, 'users/' + auth.currentUser.uid);
    onValue(userProfileRef, (snapshot) => {
        const currentData = snapshot.val() || {};
        const newData = {};
        const nameInput = document.getElementById('edit-profile-name').value;
        const bioInput = document.getElementById('edit-profile-bio').value;
        const ageInput = document.getElementById('edit-profile-age').value;
        const genderSelect = document.getElementById('edit-profile-gender');

        newData.name = nameInput || currentData.name;
        newData.bio = bioInput || currentData.bio;
        newData.age = !isNaN(parseInt(ageInput, 10)) ? parseInt(ageInput, 10) : currentData.age;
        newData.gender = genderSelect.value || currentData.gender;

        // Make sure to exclude undefined values
        Object.keys(newData).forEach(key => {
            if (newData[key] === undefined) {
                delete newData[key];
            }
        });

        const tags = document.querySelectorAll('#interest-tags-container .interest-tag');
        newData.interests = Array.from(tags).map(tag => tag.textContent.replace(' ×', ''));

        update(userProfileRef, newData).then(() => {
            alert('Profile updated successfully.');
            window.location.reload();
        }).catch(error => {
            alert('Failed to update profile: ' + error.message);
        });
    }, { onlyOnce: true });
});

document.getElementById('add-interest').addEventListener('click', () => {
    const inputElement = document.getElementById('interest-input');
    const interest = inputElement.value.trim();
    if (interest) {
        addInterestToProfile(interest);
        inputElement.value = '';
    }
});

function addInterestToProfile(interest) {
    const userProfileRef = ref(database, 'users/' + auth.currentUser.uid);
    runTransaction(userProfileRef, currentData => {
        if (!currentData || typeof currentData !== 'object') {
            currentData = { interests: [] };
        }
        const interests = Array.isArray(currentData.interests) ? currentData.interests : [];
        if (!interests.includes(interest)) {
            interests.push(interest);
        }
        return { ...currentData, interests };
    }).then(() => {
        loadUserProfile();
    }).catch(error => {
        console.error('Failed to add interest:', error);
        alert('Failed to add interest.');
    });
}

function removeInterestFromProfile(interest) {
    const userProfileRef = ref(database, 'users/' + auth.currentUser.uid);
    runTransaction(userProfileRef, currentData => {
        if (currentData && Array.isArray(currentData.interests)) {
            const index = currentData.interests.indexOf(interest);
            if (index > -1) {
                currentData.interests.splice(index, 1);
            }
        }
        return currentData;
    }).then(() => {
        loadUserProfile();
    }).catch(error => {
        console.error('Failed to remove interest:', error);
        alert('Failed to remove interest.');
    });
}

document.getElementById('profile-picture-upload').addEventListener('change', event => {
    uploadProfilePicture(event.target.files[0]);
});

function uploadProfilePicture(file) {
    if (!file.type.match('image.*')) {
        alert('Please select an image file.');
        return;
    }
    const storagePath = storageRef(storage, 'profile_pictures/' + auth.currentUser.uid);
    uploadBytes(storagePath, file).then(snapshot => {
        return getDownloadURL(snapshot.ref);
    }).then(downloadURL => {
        return update(ref(database, 'users/' + auth.currentUser.uid), { pictureUrl: downloadURL });
    }).then(() => {
        alert('Profile picture uploaded successfully.');
        loadUserProfile();
    }).catch(error => {
        console.error('Failed to upload profile picture:', error);
        alert('Failed to upload profile picture.');
    });
}

function signOutUser() {
    signOut(auth).then(() => {
        alert('User signed out successfully.');
        window.location.href = 'index.html';
    }).catch(error => {
        console.error("Error signing out:", error);
        alert("Sign out failed: " + error.message);
    });
}
