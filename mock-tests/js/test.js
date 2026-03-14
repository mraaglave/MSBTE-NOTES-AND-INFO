import { initializeApp } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js";
import { getDatabase, ref, get, set, push } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyBCA3de0oBHEmAAwguGcmD8hy679caG64I",
    authDomain: "msbte-notes-info.firebaseapp.com",
    projectId: "msbte-notes-info",
    storageBucket: "msbte-notes-info.firebasestorage.app",
    messagingSenderId: "497397765847",
    appId: "1:497397765847:web:5ff2d9910dfe14c22a8292"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// ── State ──
const testId = new URLSearchParams(window.location.search).get('id');
let currentTest = null;
let currentUser = null;
let currentIndex = 0;        // which question is visible
let answers = [];             // user answers: null = unanswered, number = selected option index
let timerInterval = null;
let timeRemaining = 0;
let testStartTime = 0;
let testSubmitted = false;
let reviewIndex = 0;
let gradeResults = [];        // { isCorrect, userAnswer, correctAnswer } per question

if (!testId) window.location.href = 'index.html';

// ── Auth ──
onAuthStateChanged(auth, (user) => {
    if (user) { currentUser = user; loadTest(); }
    else { window.location.href = 'index.html'; }
});

// ── beforeunload ──
function onBeforeUnload(e) { e.preventDefault(); e.returnValue = ''; }

// ── Shuffle ──
function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function esc(str) { return str.replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

// ══════════════════════════════
//  LOAD TEST
// ══════════════════════════════
async function loadTest() {
    try {
        const snap = await get(ref(db, `mock_tests/${testId}`));
        if (!snap.exists()) {
            document.getElementById('loading').innerHTML = `
                <div class="text-red-500 mb-4"><svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg></div>
                <div class="font-bold text-xl text-gray-900 mb-2">Test Not Found</div>
                <p class="text-gray-500 mb-6">This test may have been removed.</p>
                <a href="index.html" class="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium">Go Back</a>`;
            return;
        }
        currentTest = snap.val();
        if (currentTest.questions?.length) {
            currentTest.questions = shuffle(currentTest.questions);
            const limit = currentTest.type === 'mock' ? 100 : 20;
            currentTest.questions = currentTest.questions.slice(0, Math.min(limit, currentTest.questions.length));
        }
        answers = new Array(currentTest.questions?.length || 0).fill(null);
        initTestUI();
        startTimer();
        window.addEventListener('beforeunload', onBeforeUnload);
    } catch (err) {
        document.getElementById('loading').innerHTML = `<p class="text-red-500 font-medium">Error: ${err.message}</p><a href="index.html" class="mt-4 inline-block bg-blue-600 text-white px-6 py-2 rounded-lg">Go Back</a>`;
    }
}

// ══════════════════════════════
//  INIT UI
// ══════════════════════════════
function initTestUI() {
    document.getElementById('loading').classList.add('hidden');
    document.getElementById('testContainer').classList.remove('hidden');
    document.getElementById('navTestTitle').textContent = currentTest.title;
    document.getElementById('navTotal').textContent = currentTest.questions.length;

    // Promo
    if (currentTest.externalLink) {
        document.getElementById('promoBanner').classList.remove('hidden');
        document.getElementById('promoLink').href = currentTest.externalLink;
        document.getElementById('promoText').textContent = currentTest.externalLinkText || 'Study Material Available';
    }

    renderDots();
    showQuestion(0);
}

// ══════════════════════════════
//  RENDER QUESTION
// ══════════════════════════════
function showQuestion(idx) {
    currentIndex = idx;
    const q = currentTest.questions[idx];
    const total = currentTest.questions.length;
    const card = document.getElementById('questionCard');

    document.getElementById('navCurrent').textContent = idx + 1;
    document.getElementById('progressBar').style.width = `${((idx + 1) / total) * 100}%`;

    const selectedAnswer = answers[idx];

    card.innerHTML = `
        <div class="q-card bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col flex-grow">
            <!-- Question Header -->
            <div class="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <div class="flex items-center gap-2">
                    <span class="bg-blue-100 text-blue-700 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">${idx + 1}</span>
                    <span class="text-xs font-bold text-gray-400 uppercase tracking-wide">Question ${idx + 1} of ${total}</span>
                </div>
                ${answers[idx] !== null ? '<span class="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">✓ Answered</span>' : '<span class="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Not answered</span>'}
            </div>
            <!-- Question Text -->
            <div class="px-5 pt-5 pb-3">
                <h2 class="text-base sm:text-lg font-bold text-gray-900 leading-relaxed">${esc(q.text)}</h2>
            </div>
            <!-- Options -->
            <div class="px-5 pb-5 space-y-2.5 flex-grow">
                ${q.options.map((opt, oi) => `
                    <div>
                        <input type="radio" name="answer" id="opt_${oi}" value="${oi}" class="hidden opt-radio peer" ${selectedAnswer === oi ? 'checked' : ''} onchange="selectAnswer(${oi})">
                        <label for="opt_${oi}" class="opt-label flex items-center w-full p-3 sm:p-3.5 border-2 border-gray-200 rounded-xl font-medium text-gray-700 transition text-sm cursor-pointer peer-checked:border-blue-600 peer-checked:bg-blue-50">
                            <span class="opt-dot w-5 h-5 border-2 border-gray-300 rounded-full mr-3 flex items-center justify-center flex-shrink-0 transition">
                                <svg class="w-3 h-3 fill-current opacity-0 transition-opacity" viewBox="0 0 20 20"><circle cx="10" cy="10" r="5"/></svg>
                            </span>
                            <span class="font-bold text-gray-400 mr-2 text-xs">${String.fromCharCode(65 + oi)}.</span>
                            <span>${esc(opt)}</span>
                        </label>
                    </div>
                `).join('')}
            </div>
        </div>
    `;

    // Update button states
    document.getElementById('prevBtn').disabled = idx === 0;
    const isLast = idx === total - 1;
    document.getElementById('nextBtn').style.display = isLast ? 'none' : 'flex';
    document.getElementById('skipBtn').style.display = isLast ? 'none' : 'flex';

    renderDots();
}

// ══════════════════════════════
//  ANSWER SELECTION
// ══════════════════════════════
window.selectAnswer = (optIndex) => {
    answers[currentIndex] = optIndex;
    renderDots();
    // Update the badge in the card
    showQuestion(currentIndex); // re-render to show "Answered" badge
};

// ══════════════════════════════
//  NAVIGATION
// ══════════════════════════════
window.goToNext = () => {
    if (currentIndex < currentTest.questions.length - 1) showQuestion(currentIndex + 1);
};

window.goToPrev = () => {
    if (currentIndex > 0) showQuestion(currentIndex - 1);
};

window.skipQuestion = () => {
    // Move to next without answering
    if (currentIndex < currentTest.questions.length - 1) showQuestion(currentIndex + 1);
};

window.jumpToQuestion = (idx) => {
    showQuestion(idx);
};

// ══════════════════════════════
//  DOTS NAVIGATOR
// ══════════════════════════════
function renderDots() {
    const dotsNav = document.getElementById('dotsNav');
    if (!dotsNav || !currentTest?.questions) return;
    let html = '';
    currentTest.questions.forEach((_, i) => {
        let cls = 'q-dot w-7 h-7 sm:w-8 sm:h-8 rounded-lg border border-gray-200 text-[10px] sm:text-xs font-bold flex items-center justify-center cursor-pointer transition hover:border-blue-300';
        if (i === currentIndex) cls += ' current';
        if (answers[i] !== null) cls += ' answered';
        html += `<button type="button" onclick="jumpToQuestion(${i})" class="${cls}">${i + 1}</button>`;
    });
    dotsNav.innerHTML = html;
}

// ══════════════════════════════
//  TIMER
// ══════════════════════════════
function startTimer() {
    const mins = currentTest.type === 'mock' ? 120 : 30;
    timeRemaining = mins * 60;
    testStartTime = Date.now();
    document.getElementById('timerBox').classList.remove('hidden');
    document.getElementById('timerBox').classList.add('flex');
    updateTimerUI();
    timerInterval = setInterval(() => {
        timeRemaining--;
        if (timeRemaining <= 0) { timeRemaining = 0; clearInterval(timerInterval); autoSubmit(); return; }
        updateTimerUI();
    }, 1000);
}

function updateTimerUI() {
    const h = Math.floor(timeRemaining / 3600);
    const m = Math.floor((timeRemaining % 3600) / 60);
    const s = timeRemaining % 60;
    const txt = h > 0 ? `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}` : `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    const el = document.getElementById('timerText');
    el.textContent = txt;
    if (timeRemaining < 300 && timeRemaining > 0) {
        el.classList.add('timer-danger');
        document.getElementById('timerBox').classList.replace('bg-gray-100', 'bg-red-50');
        document.getElementById('timerBox').classList.replace('border-gray-200', 'border-red-200');
    }
}

function timerString() {
    const h = Math.floor(timeRemaining / 3600), m = Math.floor((timeRemaining % 3600) / 60), s = timeRemaining % 60;
    return h > 0 ? `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}` : `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

function getTimeTaken() {
    const e = Math.round((Date.now() - testStartTime) / 1000);
    return { seconds: e, display: `${Math.floor(e/60)}m ${e%60}s` };
}

// ══════════════════════════════
//  EXIT MODAL
// ══════════════════════════════
window.showExitModal = () => {
    document.getElementById('exitUnanswered').textContent = answers.filter(a => a === null).length;
    document.getElementById('exitTimeLeft').textContent = timerString();
    document.getElementById('exitModal').classList.remove('hidden');
};
window.hideExitModal = () => document.getElementById('exitModal').classList.add('hidden');
window.confirmExit = () => { testSubmitted = true; window.removeEventListener('beforeunload', onBeforeUnload); if (timerInterval) clearInterval(timerInterval); window.location.href = 'index.html'; };

document.getElementById('exitLogoLink')?.addEventListener('click', e => { if (!testSubmitted) { e.preventDefault(); showExitModal(); } });

// ══════════════════════════════
//  SUBMIT MODAL
// ══════════════════════════════
window.showSubmitModal = () => {
    const answered = answers.filter(a => a !== null).length;
    document.getElementById('submitAnswered').textContent = answered;
    document.getElementById('submitUnanswered').textContent = answers.length - answered;
    document.getElementById('submitModal').classList.remove('hidden');
};
window.hideSubmitModal = () => document.getElementById('submitModal').classList.add('hidden');

function autoSubmit() {
    alert("⏰ Time's up! Your test has been auto-submitted.");
    gradeAndSave();
}

window.executeSubmit = () => { hideSubmitModal(); gradeAndSave(); };

// ══════════════════════════════
//  GRADE & SAVE
// ══════════════════════════════
async function gradeAndSave() {
    testSubmitted = true;
    window.removeEventListener('beforeunload', onBeforeUnload);
    if (timerInterval) clearInterval(timerInterval);

    let score = 0;
    const total = currentTest.questions.length;
    const timeTaken = getTimeTaken();
    gradeResults = [];

    currentTest.questions.forEach((q, i) => {
        const userAns = answers[i];
        const correct = q.correct;
        const isCorrect = userAns !== null && userAns === correct;
        if (isCorrect) score++;
        gradeResults.push({ userAnswer: userAns, correctAnswer: correct, isCorrect });
    });

    // Save to Firebase
    try {
        const newRef = push(ref(db, `mock_results/${currentUser.uid}`));
        await set(newRef, {
            testId, testTitle: currentTest.title, userEmail: currentUser.email,
            score, total, timeTaken: timeTaken.seconds, date: Date.now()
        });
    } catch (err) {
        console.error('Save error:', err);
    }

    // Show review
    showReview(score, total, timeTaken);
}

// ══════════════════════════════
//  REVIEW MODE
// ══════════════════════════════
function showReview(score, total, timeTaken) {
    document.getElementById('testContainer').classList.add('hidden');
    document.getElementById('reviewContainer').classList.remove('hidden');
    document.getElementById('timerBox').classList.add('hidden');
    document.getElementById('progressBar').style.width = '100%';

    const pct = total > 0 ? Math.round((score / total) * 100) : 0;
    const grade = pct >= 80 ? { color: 'green', icon: '🎉', text: 'Excellent!' } : pct >= 50 ? { color: 'blue', icon: '👍', text: 'Good Job!' } : { color: 'red', icon: '📚', text: 'Keep Practicing!' };

    document.getElementById('scoreSummary').innerHTML = `
        <p class="text-4xl mb-2">${grade.icon}</p>
        <h2 class="text-2xl font-bold font-display text-gray-900 mb-1">${grade.text}</h2>
        <p class="text-gray-500 text-sm mb-4">Your results have been recorded.</p>
        <div class="grid grid-cols-3 gap-3">
            <div class="bg-${grade.color}-50 rounded-xl p-3 border border-${grade.color}-200">
                <p class="text-2xl font-black text-${grade.color}-700">${score}/${total}</p>
                <p class="text-[10px] font-bold text-${grade.color}-600 uppercase">Score</p>
            </div>
            <div class="bg-gray-50 rounded-xl p-3 border border-gray-200">
                <p class="text-2xl font-black text-gray-900">${pct}%</p>
                <p class="text-[10px] font-bold text-gray-500 uppercase">Percentage</p>
            </div>
            <div class="bg-gray-50 rounded-xl p-3 border border-gray-200">
                <p class="text-2xl font-black text-gray-900">${timeTaken.display}</p>
                <p class="text-[10px] font-bold text-gray-500 uppercase">Time</p>
            </div>
        </div>
    `;

    // Review promo
    if (currentTest.externalLink) {
        document.getElementById('reviewPromoBanner').classList.remove('hidden');
        document.getElementById('reviewPromoLink').href = currentTest.externalLink;
        document.getElementById('reviewPromoText').textContent = currentTest.externalLinkText || 'Study Material';
    }

    renderReviewDots();
    showReviewQuestion(0);
}

function renderReviewDots() {
    const nav = document.getElementById('reviewDotsNav');
    let html = '';
    gradeResults.forEach((r, i) => {
        let cls = 'q-dot w-7 h-7 sm:w-8 sm:h-8 rounded-lg border text-[10px] sm:text-xs font-bold flex items-center justify-center cursor-pointer transition';
        if (r.isCorrect) cls += ' review-correct';
        else if (r.userAnswer === null) cls += ' review-skipped';
        else cls += ' review-wrong';
        if (i === reviewIndex) cls += ' current';
        html += `<button type="button" onclick="jumpReview(${i})" class="${cls}">${i + 1}</button>`;
    });
    nav.innerHTML = html;
}

function showReviewQuestion(idx) {
    reviewIndex = idx;
    const q = currentTest.questions[idx];
    const r = gradeResults[idx];
    const card = document.getElementById('reviewQuestionCard');

    const statusBadge = r.isCorrect
        ? '<span class="text-xs font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">✓ Correct</span>'
        : r.userAnswer === null
            ? '<span class="text-xs font-bold text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full">⚠ Skipped</span>'
            : '<span class="text-xs font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full">✗ Incorrect</span>';

    card.innerHTML = `
        <div class="q-card bg-white rounded-2xl border border-gray-200 shadow-sm">
            <div class="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <span class="text-xs font-bold text-gray-400">Question ${idx + 1} of ${currentTest.questions.length}</span>
                ${statusBadge}
            </div>
            <div class="px-5 pt-5 pb-3">
                <h2 class="text-base sm:text-lg font-bold text-gray-900 leading-relaxed">${esc(q.text)}</h2>
            </div>
            <div class="px-5 pb-5 space-y-2.5">
                ${q.options.map((opt, oi) => {
                    let cls = 'flex items-center w-full p-3 sm:p-3.5 border-2 rounded-xl font-medium text-sm transition';
                    if (oi === r.correctAnswer && oi === r.userAnswer) cls += ' correct-answer';
                    else if (oi === r.correctAnswer) cls += ' correct-answer';
                    else if (oi === r.userAnswer) cls += ' wrong-answer';
                    else cls += ' border-gray-200 text-gray-700';

                    let badge = '';
                    if (oi === r.correctAnswer && oi === r.userAnswer) badge = '<span class="ml-auto text-xs font-bold text-green-600">✓ Your answer (Correct)</span>';
                    else if (oi === r.correctAnswer) badge = '<span class="ml-auto text-xs font-bold text-green-600">✓ Correct answer</span>';
                    else if (oi === r.userAnswer) badge = '<span class="ml-auto text-xs font-bold text-red-500">✗ Your answer</span>';

                    return `<div class="${cls}">
                        <span class="font-bold text-gray-400 mr-2 text-xs">${String.fromCharCode(65 + oi)}.</span>
                        <span class="flex-grow">${esc(opt)}</span>
                        ${badge}
                    </div>`;
                }).join('')}
            </div>
        </div>
    `;

    document.getElementById('reviewPrevBtn').disabled = idx === 0;
    document.getElementById('reviewNextBtn').disabled = idx === currentTest.questions.length - 1;
    renderReviewDots();
}

window.jumpReview = (i) => showReviewQuestion(i);
window.reviewPrev = () => { if (reviewIndex > 0) showReviewQuestion(reviewIndex - 1); };
window.reviewNext = () => { if (reviewIndex < currentTest.questions.length - 1) showReviewQuestion(reviewIndex + 1); };
