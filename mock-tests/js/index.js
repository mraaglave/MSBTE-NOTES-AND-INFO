import { initializeApp } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js";
import { initializeAppCheck, ReCaptchaV3Provider } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-app-check.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-database.js";

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

try {
    initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider('6LftA34sAAAAAGAYDgjQ4RCsCUeBmE6GQvgauRPm'),
        isTokenAutoRefreshEnabled: true
    });
} catch (e) {
    console.warn('App Check init failed:', e.message);
}

const auth = getAuth(app);
const db = getDatabase(app);

function getGreeting(email) {
    const hour = new Date().getHours();
    let timeOfDay = 'morning';
    if (hour >= 12 && hour < 17) timeOfDay = 'afternoon';
    else if (hour >= 17) timeOfDay = 'evening';
    
    const name = email ? email.split('@')[0] : 'Student';
    return `Good ${timeOfDay}, ${name}`;
}

onAuthStateChanged(auth, (user) => {
    if (user) {
        document.getElementById('logoutBtn').classList.remove('hidden');
        document.getElementById('profileBtn').classList.remove('hidden');
        document.getElementById('loginModalBtn').classList.add('hidden');
        
        const greetingEl = document.getElementById('userGreeting');
        greetingEl.textContent = getGreeting(user.email);
        greetingEl.classList.remove('hidden');
        
        // Hide modal if it's open
        hideAuthModal();
    } else {
        document.getElementById('logoutBtn').classList.add('hidden');
        document.getElementById('profileBtn').classList.add('hidden');
        document.getElementById('loginModalBtn').classList.remove('hidden');
        document.getElementById('userGreeting').classList.add('hidden');
    }
});

// Load tests regardless of auth status
loadTests();

window.showAuthModal = () => {
    document.getElementById('email').value = '';
    document.getElementById('password').value = '';
    document.getElementById('authError').classList.add('hidden');
    document.getElementById('authModal').classList.remove('hidden');
};

window.hideAuthModal = () => {
    document.getElementById('authModal').classList.add('hidden');
};

window.handleStartQuiz = (e, testId) => {
    e.preventDefault();
    if (auth.currentUser) {
        window.location.href = `test.html?id=${testId}`;
    } else {
        showAuthModal();
    }
};

async function verifyRecaptcha(action = 'login') {
    if (typeof grecaptcha === 'undefined') return true;
    try { return await grecaptcha.execute('6LftA34sAAAAAGAYDgjQ4RCsCUeBmE6GQvgauRPm', { action }); } 
    catch (e) { return true; }
}

window.showError = (msg) => {
    const errEl = document.getElementById('authError');
    errEl.textContent = msg;
    errEl.classList.remove('hidden');
};

window.login = async () => {
    await verifyRecaptcha('login');
    const email = document.getElementById('email').value.trim();
    const pass = document.getElementById('password').value;
    if(!email || !pass) return window.showError("Email and password required.");
    try { await signInWithEmailAndPassword(auth, email, pass); } 
    catch (e) { window.showError(e.message); }
};

window.signup = async () => {
    await verifyRecaptcha('signup');
    const email = document.getElementById('email').value.trim();
    const pass = document.getElementById('password').value;
    if(!email || !pass) return window.showError("Email and password required.");
    try { await createUserWithEmailAndPassword(auth, email, pass); } 
    catch (e) { window.showError(e.message); }
};

window.loginWithGoogle = async () => {
    await verifyRecaptcha('login');
    const provider = new GoogleAuthProvider();
    try { await signInWithPopup(auth, provider); } 
    catch (e) { window.showError(e.message); }
};

document.getElementById('logoutBtn').addEventListener('click', () => signOut(auth));

function loadTests() {
    const testsRef = ref(db, 'mock_tests');
    onValue(testsRef, (snapshot) => {
        const data = snapshot.val();
        let html = '';
        
        if (data) {
            Object.keys(data).forEach(id => {
                const test = data[id];
                const dateObj = new Date(test.createdAt || Date.now());
                const dateStr = dateObj.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
                const qCount = test.questions ? test.questions.length : 0;
                const isMock = test.type === 'mock';
                const typeBadgeColor = isMock ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700';
                const typeBadgeText = isMock ? 'Mock Exam' : 'Practice Exam';
                
                html += `
                    <div class="bg-white p-6 rounded-2xl shadow-sm hover:shadow-xl border border-gray-100 transition-all duration-300 transform hover:-translate-y-1 flex flex-col h-full">
                        <div class="flex-grow">
                            <div class="flex justify-between items-start mb-4">
                                <div class="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path>
                                    </svg>
                                </div>
                                <span class="text-xs font-bold ${typeBadgeColor} px-2.5 py-1 rounded-full uppercase tracking-wide">${typeBadgeText}</span>
                            </div>
                            <h3 class="text-xl font-bold font-display mb-2 text-gray-900">${test.title}</h3>
                            <p class="text-gray-600 text-sm mb-6 line-clamp-3 leading-relaxed">${test.description || 'Interactive test designed to prepare you.'}</p>
                        </div>
                        <div class="border-t border-gray-100 pt-4 mt-auto">
                            <div class="flex justify-between items-center text-[13px] font-medium text-gray-500 mb-4 bg-gray-50 px-3 py-2 rounded-lg">
                                <div class="flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full bg-blue-500"></span>${qCount} Qs</div>
                                <div>Added ${dateStr}</div>
                            </div>
                            <button onclick="handleStartQuiz(event, '${id}')" class="inline-flex w-full items-center justify-center gap-2 bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 shadow-md shadow-blue-200 transition">
                                Start Quiz
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                            </button>
                        </div>
                    </div>
                `;
            });
        }
        
        if(!html) {
            html = `
            <div class="col-span-full border-2 border-dashed border-gray-200 rounded-2xl p-12 text-center bg-white mt-8">
                <div class="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-400">
                    <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                </div>
                <h3 class="text-lg font-bold text-gray-900 mb-1">No Tests Found</h3>
                <p class="text-gray-500 max-w-sm mx-auto">Admin hasn't uploaded any mock tests yet. Check back soon for new quizzes.</p>
            </div>`;
        }
        document.getElementById('testsList').innerHTML = html;
    });
}
