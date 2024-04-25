// Importing the necessary Firebase configurations and modules
import { auth, database } from './firebase-config.js';
import { ref, query, orderByChild, startAt, endAt, onValue, equalTo } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-database.js";

// Event listener for the search button
document.getElementById('search-button').addEventListener('click', function() {
    const interest = document.getElementById('search-interest').value.trim();
    const gender = document.getElementById('search-gender').value;
    const ageMin = parseInt(document.getElementById('search-age-min').value, 10) || 0;
    const ageMax = parseInt(document.getElementById('search-age-max').value, 10) || 99;

    // Build the query based on the input fields
    let queryRef = ref(database, 'users');

    if (interest) {
        queryRef = query(queryRef, orderByChild('interests/' + interest), startAt(true));
    }

    if (gender) {
        queryRef = query(queryRef, orderByChild('gender'), equalTo(gender));
    }

    // Execute the query and listen for changes
    onValue(queryRef, snapshot => {
        const results = snapshot.val();
        const resultsContainer = document.getElementById('search-results');
        resultsContainer.innerHTML = ''; // Clear previous results

        if (results) {
            Object.keys(results).forEach(key => {
                const user = results[key];
                if (user.age >= ageMin && user.age <= ageMax) {
                    const userDiv = document.createElement('div');
                    userDiv.textContent = `Name: ${user.name}, Age: ${user.age}, Gender: ${user.gender}, Interests: ${Object.keys(user.interests).join(', ')}`;
                    resultsContainer.appendChild(userDiv);
                }
            });
        } else {
            const noResults = document.createElement('p');
            noResults.textContent = 'No matches found.';
            resultsContainer.appendChild(noResults);
        }
    }, {
        onlyOnce: true
    });
});

// Function to dynamically add search criteria to the Firebase query
function addCriteria(queryRef, child, value, condition = 'equalTo') {
    switch (condition) {
        case 'equalTo':
            return query(queryRef, orderByChild(child), equalTo(value));
        case 'range':
            const [min, max] = value;
            return query(queryRef, orderByChild(child), startAt(min), endAt(max));
        default:
            return queryRef;
    }
}
