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
        <div class="q-card bg-white rounded-[2rem] border border-gray-100 shadow-2xl shadow-blue-900/5 flex flex-col flex-grow overflow-hidden">
            <!-- Question Header -->
            <div class="px-4 sm:px-8 py-4 sm:py-6 bg-gray-50/50 border-b border-gray-100 flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <span class="bg-blue-600 text-white w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-sm sm:text-base font-black shadow-lg shadow-blue-200 flex-shrink-0">${idx + 1}</span>
                    <div class="flex flex-col">
                        <span class="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest">Question</span>
                        <span class="text-xs sm:text-sm font-bold text-gray-700">${idx + 1} of ${total}</span>
                    </div>
                </div>
                ${answers[idx] !== null 
                    ? '<span class="text-[10px] sm:text-xs font-bold text-green-600 bg-green-100/50 border border-green-200 px-3 py-1 rounded-full flex items-center gap-1.5"><svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>Answered</span>' 
                    : '<span class="text-[10px] sm:text-xs font-bold text-gray-400 bg-gray-100 border border-gray-200 px-3 py-1 rounded-full">Waiting...</span>'}
            </div>
            <!-- Question Text -->
            <div class="px-5 sm:px-10 pt-6 sm:pt-10 pb-4 sm:pb-6">
                <h2 class="text-lg sm:text-2xl font-bold text-gray-900 leading-tight tracking-tight">${esc(q.text)}</h2>
            </div>
            <!-- Options -->
            <div class="px-5 sm:px-10 pb-6 sm:pb-10 space-y-3 sm:space-y-4 flex-grow">
                ${q.options.map((opt, oi) => `
                    <div class="relative group">
                        <input type="radio" name="answer" id="opt_${oi}" value="${oi}" class="hidden opt-radio peer" ${selectedAnswer === oi ? 'checked' : ''} onchange="selectAnswer(${oi})">
                        <label for="opt_${oi}" class="opt-label flex items-center w-full p-4 sm:p-5 border-2 border-gray-100 rounded-2xl font-semibold text-gray-700 bg-white cursor-pointer peer-checked:border-blue-600 peer-checked:bg-blue-50/50 hover:bg-gray-50 active:scale-[0.98] premium-shadow">
                            <span class="opt-dot w-6 h-6 border-2 border-gray-200 rounded-lg mr-4 flex items-center justify-center flex-shrink-0 transition-all peer-checked:bg-blue-600 peer-checked:border-blue-600">
                                <svg class="w-3 h-3 fill-current opacity-0 transition-opacity" viewBox="0 0 20 20"><circle cx="10" cy="10" r="5"/></svg>
                            </span>
                            <div class="flex flex-col flex-grow">
                                <span class="text-[10px] font-black text-gray-300 uppercase tracking-tighter mb-0.5">${String.fromCharCode(65 + oi)}</span>
                                <span class="text-sm sm:text-base">${esc(opt)}</span>
                            </div>
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

// ══════════════════════════════
//  GRID NAVIGATOR TOGGLE
// ══════════════════════════════
window.toggleGridNav = () => {
    const panel = document.getElementById('gridNavPanel');
    const icon = document.getElementById('gridToggleIcon');
    const isOpen = panel.classList.toggle('open');
    icon.style.transform = isOpen ? 'rotate(180deg)' : 'rotate(0deg)';
};

window.jumpToQuestion = (idx) => {
    showQuestion(idx);
    document.getElementById('gridNavPanel').classList.remove('open');
    document.getElementById('gridToggleIcon').style.transform = 'rotate(0deg)';
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
    const grade = pct >= 80 ? { color: 'green', icon: '🏆', text: 'Distinction!', bg: 'bg-green-50/50', border: 'border-green-200', textCls: 'text-green-700' } : pct >= 50 ? { color: 'blue', icon: '✨', text: 'Qualified!', bg: 'bg-blue-50/50', border: 'border-blue-200', textCls: 'text-blue-700' } : { color: 'orange', icon: '📖', text: 'Practice More!', bg: 'bg-orange-50/50', border: 'border-orange-200', textCls: 'text-orange-700' };

    document.getElementById('scoreSummary').innerHTML = `
        <div class="relative py-4">
            <div class="absolute inset-0 flex items-center justify-center opacity-10 blur-3xl saturate-200 pointer-events-none -z-10 bg-${grade.color}-400 rounded-full scale-150"></div>
            <p class="text-6xl mb-4 animate-bounce">${grade.icon}</p>
            <h2 class="text-3xl sm:text-4xl font-black font-display text-gray-900 mb-2">${grade.text}</h2>
            <p class="text-gray-500 font-medium mb-8">Performance analysis for <span class="text-blue-600">${currentTest.title}</span></p>
        </div>
        
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div class="${grade.bg} rounded-[1.5rem] p-5 border ${grade.border} premium-shadow">
                <p class="text-3xl font-black ${grade.textCls}">${score}/${total}</p>
                <p class="text-[10px] font-black ${grade.textCls} opacity-60 uppercase tracking-widest mt-1">Final Score</p>
            </div>
            <div class="bg-white rounded-[1.5rem] p-5 border border-gray-100 premium-shadow">
                <p class="text-3xl font-black text-gray-900">${pct}%</p>
                <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Accuracy</p>
            </div>
            <div class="bg-white rounded-[1.5rem] p-5 border border-gray-100 premium-shadow">
                <p class="text-3xl font-black text-gray-900">${timeTaken.display}</p>
                <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Completion Time</p>
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
        <div class="q-card bg-white rounded-[2rem] border border-gray-100 shadow-xl overflow-hidden">
            <div class="px-6 py-4 bg-gray-50/50 border-b border-gray-100 flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <span class="w-8 h-8 rounded-lg bg-gray-200 text-gray-700 flex items-center justify-center text-xs font-black shadow-inner flex-shrink-0">${idx + 1}</span>
                    <span class="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest">Question ${idx + 1}</span>
                </div>
                ${statusBadge}
            </div>
            <div class="px-6 sm:px-10 pt-8 pb-4">
                <h2 class="text-lg sm:text-xl font-bold text-gray-900 leading-tight">${esc(q.text)}</h2>
            </div>
            <div class="px-6 sm:px-10 pb-8 space-y-3">
                ${q.options.map((opt, oi) => {
                    let cls = 'flex items-center w-full p-4 sm:p-5 border-2 rounded-2xl font-semibold text-sm transition-all premium-shadow';
                    if (oi === r.correctAnswer) cls += ' correct-answer';
                    else if (oi === r.userAnswer) cls += ' wrong-answer';
                    else cls += ' border-gray-50 text-gray-500 opacity-60';

                    let indicator = '';
                    if (oi === r.correctAnswer && oi === r.userAnswer) indicator = '<div class="ml-auto flex items-center gap-1.5 text-green-600"><span class="text-[10px] font-black uppercase">Correct</span><svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg></div>';
                    else if (oi === r.correctAnswer) indicator = '<div class="ml-auto text-green-600"><svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg></div>';
                    else if (oi === r.userAnswer) indicator = '<div class="ml-auto text-red-500"><svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path></svg></div>';

                    return `<div class="${cls}">
                        <span class="w-6 h-6 rounded-lg bg-black/5 flex items-center justify-center text-[10px] font-black mr-4">${String.fromCharCode(65 + oi)}</span>
                        <span class="flex-grow">${esc(opt)}</span>
                        ${indicator}
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
