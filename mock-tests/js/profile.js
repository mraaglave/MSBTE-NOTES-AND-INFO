import { initializeApp } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut, updateProfile } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js";
import { getDatabase, ref, onValue, get, update } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-database.js";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-storage.js";

const firebaseConfig = {
    apiKey: "AIzaSyBCA3de0oBHEmAAwguGcmD8hy679caG64I",
    authDomain: "msbte-notes-info.firebaseapp.com",
    projectId: "msbte-notes-info",
    storageBucket: "msbte-notes-info.firebasestorage.app",
    messagingSenderId: "497397765847",
    appId: "1:497397765847:web:5ff2d9910dfe14c22a8292",
    measurementId: "G-QJXDTZXDZ2"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);
const storage = getStorage(app);

let profileImageFile = null;

onAuthStateChanged(auth, (user) => {
    if (user) {
        document.getElementById('logoutBtn').classList.remove('hidden');
        document.getElementById('userEmailDisplay').textContent = user.email;
        document.getElementById('userEmailDisplay').classList.remove('hidden');
        
        // Mobile
        const mEmail = document.getElementById('userEmailDisplayMobile');
        if (mEmail) { mEmail.textContent = user.email; mEmail.classList.remove('hidden'); }
        const mLogout = document.getElementById('logoutBtnMobile');
        if (mLogout) mLogout.classList.remove('hidden');
        
        // Populate profile edit fields
        if(user.displayName) document.getElementById('displayNameInput').value = user.displayName;
        if(user.photoURL) {
            document.getElementById('profileImageDisplay').src = user.photoURL;
            document.getElementById('profileImageDisplay').classList.remove('hidden');
            document.getElementById('profileImagePlaceholder').classList.add('hidden');
        }

        const userRef = ref(db, `mock_users/${user.uid}`);
        onValue(userRef, (snapshot) => {
            if(snapshot.exists() && snapshot.val().username) {
                document.getElementById('usernameInput').value = snapshot.val().username;
            }
        });

        loadProfileData(user.uid);
    } else {
        window.location.href = 'index.html';
    }
});

document.getElementById('logoutBtn').addEventListener('click', () => signOut(auth));
const mLogoutBtnP = document.getElementById('logoutBtnMobile');
if (mLogoutBtnP) mLogoutBtnP.addEventListener('click', () => signOut(auth));

function loadProfileData(uid) {
    const resultsRef = ref(db, `mock_results/${uid}`);
    onValue(resultsRef, (snapshot) => {
        const data = snapshot.val();
        document.getElementById('loadingView').classList.add('hidden');
        document.getElementById('profileView').classList.remove('hidden');

        if (!data) {
            renderEmptyState();
            return;
        }

        let totalAttempts = 0;
        let totalPercentageSum = 0;
        let rowsHtml = '';
        
        // Convert object to array for sorting
        const attemptsArr = Object.keys(data).map(key => data[key]);
        attemptsArr.sort((a,b) => b.date - a.date); // newest first
        
        attemptsArr.forEach(res => {
            totalAttempts++;
            const percent = res.total > 0 ? (res.score / res.total) * 100 : 0;
            totalPercentageSum += percent;
            
            const dateObj = new Date(res.date);
            const dateStr = dateObj.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
            const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            
            let badgeColor = 'bg-yellow-100 text-yellow-800';
            let statusText = 'Average';
            
            if (percent >= 80) { badgeColor = 'bg-green-100 text-green-800'; statusText = 'Excellent'; }
            else if (percent >= 60) { badgeColor = 'bg-blue-100 text-blue-800'; statusText = 'Good'; }
            else if (percent < 40) { badgeColor = 'bg-red-100 text-red-800'; statusText = 'Needs Work'; }

            rowsHtml += `
                <tr class="hover:bg-blue-50/30 transition-colors">
                    <td class="px-6 py-4">
                        <div class="text-sm font-bold text-gray-900 mb-1">${res.testTitle}</div>
                        <div class="text-xs text-gray-500">${dateStr} at ${timeStr}</div>
                    </td>
                    <td class="px-6 py-4 text-right">
                        <div class="text-base font-black text-gray-900">${res.score}<span class="text-gray-400 text-sm font-medium">/${res.total}</span></div>
                        <div class="text-xs text-gray-500 mt-1">${percent.toFixed(1)}%</div>
                    </td>
                    <td class="px-6 py-4 text-right whitespace-nowrap">
                        <span class="px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full ${badgeColor}">
                            ${statusText}
                        </span>
                    </td>
                </tr>
            `;
        });

        document.getElementById('statAttempts').textContent = totalAttempts;
        let avg = totalAttempts > 0 ? (totalPercentageSum / totalAttempts) : 0;
        document.getElementById('statAverage').textContent = avg.toFixed(1);
        
        document.getElementById('resultsTableBody').innerHTML = rowsHtml;
    });
}

function renderEmptyState() {
    document.getElementById('statAttempts').textContent = "0";
    document.getElementById('statAverage').textContent = "0";
    document.getElementById('resultsTableBody').innerHTML = `
        <tr><td colspan="3" class="px-6 py-12 text-center text-gray-500">
            <div class="mx-auto w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 border border-gray-100 shadow-sm">
                <svg class="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
            </div>
            <p class="font-bold text-gray-900 mb-1">No exam history</p>
            <p class="text-sm text-gray-400 max-w-sm mx-auto">You haven't taken any mock tests or practice exams yet. Go to the dashboard to start practicing!</p>
            <a href="index.html" class="mt-4 inline-block bg-blue-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-700 transition">View Tests</a>
        </td></tr>
    `;
}

window.handleImageSelect = (e) => {
    const file = e.target.files[0];
    if(file) {
        profileImageFile = file;
        const reader = new FileReader();
        reader.onload = (e) => {
            document.getElementById('profileImageDisplay').src = e.target.result;
            document.getElementById('profileImageDisplay').classList.remove('hidden');
            document.getElementById('profileImagePlaceholder').classList.add('hidden');
        };
        reader.readAsDataURL(file);
    }
};

window.saveProfileInfo = async () => {
    const user = auth.currentUser;
    if(!user) return;

    const saveBtn = document.getElementById('saveProfileBtn');
    const originalText = saveBtn.innerHTML;
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<svg class="animate-spin w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8a8 8 0 01-8-8z"></path></svg> Saving...';

    try {
        let photoURL = user.photoURL;
        const displayName = document.getElementById('displayNameInput').value.trim();
        let desiredUsername = document.getElementById('usernameInput').value.trim().toLowerCase();
        desiredUsername = desiredUsername.replace(/[^a-z0-9_.]/g, ''); // strip invalid chars (allow alphanumeric, underscore, dot)

        if (desiredUsername) {
            // Get old username
            const userRef = ref(db, `mock_users/${user.uid}`);
            const userSnap = await get(userRef);
            const oldUsername = userSnap.exists() ? userSnap.val().username : null;

            if (desiredUsername !== oldUsername) {
                // Check availability
                const usernameRef = ref(db, `usernames/${desiredUsername}`);
                const unameSnap = await get(usernameRef);
                if (unameSnap.exists() && unameSnap.val() !== user.uid) {
                    throw new Error("Username is already taken. Please choose another one.");
                }

                // Prepare updates for DB
                const updates = {};
                updates[`usernames/${desiredUsername}`] = user.uid;
                if (oldUsername) {
                    updates[`usernames/${oldUsername}`] = null;
                }
                updates[`mock_users/${user.uid}/username`] = desiredUsername;
                await update(ref(db), updates);
            }
        }

        // If a new image was selected, upload it to Firebase Storage
        if (profileImageFile) {
            const ext = profileImageFile.name.split('.').pop();
            const imageRef = storageRef(storage, `profile_images/${user.uid}_${Date.now()}.${ext}`);
            await uploadBytes(imageRef, profileImageFile);
            photoURL = await getDownloadURL(imageRef);
        }

        // Update Firebase Auth Profile
        await updateProfile(user, {
            displayName: displayName || null,
            photoURL: photoURL
        });

        alert("Profile updated successfully!");
        
    } catch (error) {
        console.error("Error updating profile: ", error);
        alert("Failed to update profile: " + error.message);
    } finally {
        saveBtn.disabled = false;
        saveBtn.innerHTML = originalText;
    }
};
