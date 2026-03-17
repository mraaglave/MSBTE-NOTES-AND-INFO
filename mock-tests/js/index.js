import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
    getAuth,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    GoogleAuthProvider,
    signInWithPopup
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { initializeAppCheck, ReCaptchaV3Provider } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app-check.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

// ── Firebase config ──────────────────────────────────────────────────────────
const firebaseConfig = {
    apiKey: "AIzaSyBCA3de0oBHEmAAwguGcmD8hy679caG64I",
    authDomain: "msbte-notes-info.firebaseapp.com",
    projectId: "msbte-notes-info",
    storageBucket: "msbte-notes-info.firebasestorage.app",
    messagingSenderId: "497397765847",
    appId: "1:497397765847:web:5ff2d9910dfe14c22a8292",
    measurementId: "G-QJXDTZXDZ2",
    databaseURL: "https://msbte-notes-info-default-rtdb.firebaseio.com"
};

const app = initializeApp(firebaseConfig);

// App Check (non-fatal on failure)
try {
    initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider('6LftA34sAAAAAGAYDgjQ4RCsCUeBmE6GQvgauRPm'),
        isTokenAutoRefreshEnabled: true
    });
} catch (e) {
    console.warn('App Check init failed:', e.message);
}

const auth = getAuth(app);
const db   = getDatabase(app);

// ── Helpers ──────────────────────────────────────────────────────────────────
function getGreeting(user) {
    const h = new Date().getHours();
    const period = h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';
    const name = user.displayName
        ? user.displayName.split(' ')[0]
        : user.email
            ? user.email.split('@')[0]
            : 'Student';
    return `Good ${period}, ${name}!`;
}

function el(id) { return document.getElementById(id); }
function show(id) { const e = el(id); if (e) e.style.display = ''; }
function hide(id) { const e = el(id); if (e) e.style.display = 'none'; }
function showFlex(id) { const e = el(id); if (e) e.style.display = 'flex'; }

async function recaptcha(action = 'submit') {
    if (typeof grecaptcha === 'undefined') return null;
    try {
        return await grecaptcha.execute('6LftA34sAAAAAGAYDgjQ4RCsCUeBmE6GQvgauRPm', { action });
    } catch {
        return null;
    }
}

// ── Auth state ───────────────────────────────────────────────────────────────
onAuthStateChanged(auth, (user) => {
    if (user) {
        // ── Logged in ──

        // Desktop
        const greetingEl = el('userGreeting');
        if (greetingEl) {
            el('greetingText').textContent = getGreeting(user);
            greetingEl.classList.add('visible');
        }
        hide('loginModalBtn');
        hide('signupNavBtn');
        showFlex('profileBtn');
        showFlex('logoutBtn');

        // Mobile
        const mGreeting = el('userGreetingMobile');
        if (mGreeting) { mGreeting.textContent = getGreeting(user); mGreeting.style.display = 'block'; }
        hide('loginModalBtnMobile');
        hide('signupBtnMobile');
        showFlex('profileBtnMobile');
        showFlex('logoutBtnMobile');

        // Hero signup btn becomes "Go to Profile"
        const heroSignup = el('heroSignupBtn');
        if (heroSignup) {
            heroSignup.textContent = 'My Profile';
            heroSignup.onclick = () => { window.location.href = 'profile.html'; };
        }

        // Hide CTA banner
        const banner = el('ctaBanner');
        if (banner) banner.classList.add('hidden');

        if (window.hideAuthModal) window.hideAuthModal();

    } else {
        // ── Logged out ──

        // Desktop
        const greetingEl = el('userGreeting');
        if (greetingEl) greetingEl.classList.remove('visible');
        showFlex('loginModalBtn');
        showFlex('signupNavBtn');
        hide('profileBtn');
        hide('logoutBtn');

        // Mobile
        const mGreeting = el('userGreetingMobile');
        if (mGreeting) mGreeting.style.display = 'none';
        showFlex('loginModalBtnMobile');
        showFlex('signupBtnMobile');
        hide('profileBtnMobile');
        hide('logoutBtnMobile');

        // Hero btn back to signup
        const heroSignup = el('heroSignupBtn');
        if (heroSignup) {
            heroSignup.innerHTML = `
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
                </svg>
                Get Started Free`;
            heroSignup.onclick = () => window.showAuthModal('signup');
        }

        // Show CTA banner
        const banner = el('ctaBanner');
        if (banner) banner.classList.remove('hidden');
    }
});

// ── Quiz start handler ────────────────────────────────────────────────────────
window.handleStartQuiz = (e, testId) => {
    e.preventDefault();
    if (auth.currentUser) {
        window.location.href = `test.html?id=${testId}`;
    } else {
        window.showAuthModal('login');
    }
};

// ── Auth actions ──────────────────────────────────────────────────────────────
window.login = async () => {
    const email = el('email').value.trim();
    const pass  = el('password').value;
    if (!email || !pass) return window.showError('Please enter your email and password.');
    await recaptcha('login');
    try {
        await signInWithEmailAndPassword(auth, email, pass);
    } catch (err) {
        window.showError(friendlyError(err.code));
    }
};

window.signup = async () => {
    const email = el('email').value.trim();
    const pass  = el('password').value;
    if (!email || !pass) return window.showError('Please enter your email and password.');
    if (pass.length < 6) return window.showError('Password must be at least 6 characters.');
    await recaptcha('signup');
    try {
        await createUserWithEmailAndPassword(auth, email, pass);
    } catch (err) {
        window.showError(friendlyError(err.code));
    }
};

window.loginWithGoogle = async () => {
    await recaptcha('google_login');
    const provider = new GoogleAuthProvider();
    try {
        await signInWithPopup(auth, provider);
    } catch (err) {
        if (err.code !== 'auth/popup-closed-by-user') {
            window.showError(friendlyError(err.code));
        }
    }
};

// Logout buttons
const logoutHandler = () => signOut(auth);
const logoutBtn = el('logoutBtn');
const logoutBtnMobile = el('logoutBtnMobile');
if (logoutBtn)       logoutBtn.addEventListener('click', logoutHandler);
if (logoutBtnMobile) logoutBtnMobile.addEventListener('click', logoutHandler);

// ── Friendly error messages ───────────────────────────────────────────────────
function friendlyError(code) {
    const map = {
        'auth/user-not-found':       'No account found with this email.',
        'auth/wrong-password':       'Incorrect password. Please try again.',
        'auth/email-already-in-use': 'An account with this email already exists.',
        'auth/invalid-email':        'Please enter a valid email address.',
        'auth/weak-password':        'Password must be at least 6 characters.',
        'auth/too-many-requests':    'Too many attempts. Please wait and try again.',
        'auth/network-request-failed': 'Network error. Please check your connection.',
        'auth/popup-blocked':        'Popup was blocked. Please allow popups for this site.',
        'auth/invalid-credential':   'Invalid credentials. Please check and try again.',
    };
    return map[code] || 'Something went wrong. Please try again.';
}

// ── Load tests from Firebase ──────────────────────────────────────────────────
loadTests();

function loadTests() {
    const testsRef = ref(db, 'mock_tests');
    onValue(testsRef, (snapshot) => {
        const data = snapshot.val();
        const grid = el('testsList');
        const countBadge = el('testCountBadge');

        if (!data) {
            grid.innerHTML = emptyState();
            return;
        }

        const entries = Object.entries(data);
        if (countBadge) {
            countBadge.textContent = `${entries.length} test${entries.length !== 1 ? 's' : ''} available`;
            countBadge.style.display = 'inline-flex';
        }

        grid.innerHTML = entries.map(([id, test]) => buildCard(id, test)).join('');

    }, (error) => {
        console.error('Firebase read error:', error);
        el('testsList').innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">
                    <svg width="28" height="28" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                            d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                </div>
                <h3>Failed to load tests</h3>
                <p>Please refresh the page or check your internet connection.</p>
            </div>`;
    });
}

function buildCard(id, test) {
    const date   = new Date(test.createdAt || Date.now());
    const dateStr = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    const qCount = Array.isArray(test.questions) ? test.questions.length : 0;
    const isMock = test.type === 'mock';
    const typeClass = isMock ? 'type-mock' : 'type-practice';
    const typeLabel = isMock ? 'Mock Exam' : 'Practice';

    const extLink = test.externalLink ? `
        <a href="${escapeHtml(test.externalLink)}" target="_blank" rel="noopener noreferrer"
            class="ext-link" onclick="event.stopPropagation()">
            <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
            </svg>
            ${escapeHtml(test.externalLinkText || 'Study Material')}
        </a>` : '';

    return `
        <div class="test-card">
            <div class="card-top">
                <div class="card-icon">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
                    </svg>
                </div>
                <span class="type-badge ${typeClass}">${typeLabel}</span>
            </div>

            <h3 class="card-title">${escapeHtml(test.title || 'Untitled Test')}</h3>
            <p class="card-desc">${escapeHtml(test.description || 'Interactive test designed to prepare you for your MSBTE exams.')}</p>
            ${extLink}

            <div class="card-meta">
                <div class="card-meta-item">
                    <span class="dot"></span>
                    ${qCount} Question${qCount !== 1 ? 's' : ''}
                </div>
                <div>Added ${dateStr}</div>
            </div>

            <div class="card-footer">
                <button class="btn-start" onclick="handleStartQuiz(event, '${escapeHtml(id)}')">
                    Start Quiz
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
                    </svg>
                </button>
            </div>
        </div>`;
}

function emptyState() {
    return `
        <div class="empty-state">
            <div class="empty-icon">
                <svg width="32" height="32" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
                </svg>
            </div>
            <h3>No Tests Yet</h3>
            <p>The admin hasn't uploaded any mock tests yet. Check back soon!</p>
        </div>`;
}

// XSS prevention
function escapeHtml(str) {
    if (typeof str !== 'string') return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
