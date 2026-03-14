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
let currentIndex = 0;        
let answers = [];             
let questionStates = [];      // 0: Not Visited, 1: Answered, 2: Not Answered, 3: Marked, 4: Answered & Marked
let timerInterval = null;
let timeRemaining = 0;
let testStartTime = 0;
let testSubmitted = false;
let reviewIndex = 0;
let gradeResults = [];        

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
        questionStates = new Array(currentTest.questions?.length || 0).fill(0); // All not visited
        initInstructions();
    } catch (err) {
        document.getElementById('loading').innerHTML = `<p class="text-red-500 font-medium">Error: ${err.message}</p><a href="index.html" class="mt-4 inline-block bg-blue-600 text-white px-6 py-2 rounded-lg">Go Back</a>`;
    }
}

// ══════════════════════════════
//  INSTRUCTIONS
// ══════════════════════════════
function initInstructions() {
    document.getElementById('loading').classList.add('hidden');
    document.getElementById('instrTitle').textContent = `Instructions - ${currentTest.title}`;
    const mins = currentTest.type === 'mock' ? 120 : 30;
    document.getElementById('instrDuration').textContent = mins;
    
    const agreeCheck = document.getElementById('agreeCheck');
    const startTestBtn = document.getElementById('startTestBtn');
    
    if (agreeCheck && startTestBtn) {
        const updateBtn = () => {
            startTestBtn.disabled = !agreeCheck.checked;
            console.log("Agreement checked:", agreeCheck.checked, "Button disabled:", startTestBtn.disabled);
        };
        
        agreeCheck.addEventListener('change', updateBtn);
        agreeCheck.addEventListener('click', updateBtn);
        
        // Ensure initial state
        updateBtn();
    } else {
        console.error("Instructions elements not found:", { agreeCheck, startTestBtn });
    }
}

window.startTestActual = () => {
    console.log("startTestActual called");
    try {
        const overlay = document.getElementById('instructionsOverlay');
        const container = document.getElementById('testContainer');
        const loading = document.getElementById('loading');
        
        if (overlay) overlay.classList.add('hidden');
        if (container) container.classList.remove('hidden');
        if (loading) loading.classList.add('hidden'); // Extra safety
        
        console.log("Initializing Test UI...");
        initTestUI();
        startTimer();
        window.addEventListener('beforeunload', onBeforeUnload);
    } catch (err) {
        console.error("Error starting test:", err);
        alert("There was an error starting the test. Please refresh the page.");
    }
};

// Also attach via event listener for robustness
document.addEventListener('DOMContentLoaded', () => {
    const startBtn = document.getElementById('startTestBtn');
    if (startBtn) {
        startBtn.addEventListener('click', () => {
            window.startTestActual();
        });
    }
});

// ══════════════════════════════
//  INIT UI
// ══════════════════════════════
function initTestUI() {
    document.getElementById('navTestTitle').textContent = currentTest.title;
    document.getElementById('userName').textContent = currentUser.displayName || currentUser.email.split('@')[0];
    document.getElementById('userInitial').textContent = (currentUser.displayName || currentUser.email)[0].toUpperCase();

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

    // Update State to 'Visited' if it was 'Not Visited'
    if (questionStates[idx] === 0) {
        questionStates[idx] = 2; // Not Answered (but visited)
    }

    const selectedAnswer = answers[idx];

    card.innerHTML = `
        <div class="q-card bg-white/95 backdrop-blur-md rounded-3xl border border-white shadow-premium flex flex-col flex-grow overflow-hidden transition-all duration-300">
            <!-- Question Header -->
            <div class="px-5 sm:px-7 py-4 sm:py-5 bg-gradient-to-b from-slate-50 to-white/50 border-b border-slate-100 flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <span class="bg-blue-600 text-white w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-sm sm:text-base font-black font-display flex-shrink-0 shadow-lg border border-blue-400/30">${idx + 1}</span>
                    <span class="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-2.5 py-1 rounded-lg">Question ${idx + 1} of ${total}</span>
                </div>
                <div class="hidden sm:flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Section</span>
                </div>
            </div>
            <!-- Question Text -->
            <div class="px-5 sm:px-7 pt-5 sm:pt-7 pb-3 sm:pb-4">
                <h2 class="text-base sm:text-xl font-bold text-slate-800 leading-relaxed font-display tracking-tight">${esc(q.text)}</h2>
            </div>
            <!-- Options -->
            <div class="px-5 sm:px-7 pb-5 sm:pb-7 space-y-2.5 sm:space-y-3 flex-grow">
                ${q.options.map((opt, oi) => `
                    <div class="relative group">
                        <input type="radio" name="answer" id="opt_${oi}" value="${oi}" class="hidden opt-radio peer" ${selectedAnswer === oi ? 'checked' : ''} onchange="selectAnswer(${oi})">
                        <label for="opt_${oi}" class="opt-label flex items-center w-full p-3.5 sm:p-4 border-2 border-slate-100 rounded-2xl font-medium text-slate-700 transition-all text-sm sm:text-base cursor-pointer peer-checked:border-blue-500 peer-checked:bg-blue-50/50 hover:border-slate-300 active:scale-[0.99] shadow-sm hover:shadow-md bg-white">
                            <span class="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-bold mr-3 sm:mr-4 border border-slate-200 peer-checked:bg-blue-600 peer-checked:text-white transition-colors group-hover:bg-slate-200 uppercase">${String.fromCharCode(65 + oi)}</span>
                            <span class="leading-snug">${esc(opt)}</span>
                        </label>
                    </div>
                `).join('')}
            </div>
        </div>
    `;

    // Update UI components
    document.getElementById('prevBtn').disabled = idx === 0;
    const isLast = idx === total - 1;
    document.getElementById('nextBtn').textContent = isLast ? 'Save & Submit' : 'Save & Next';
    document.getElementById('nextBtn').onclick = isLast ? showSubmitModal : goToNext;

    renderDots();
}

// ══════════════════════════════
//  ANSWER SELECTION
// ══════════════════════════════
window.selectAnswer = (optIndex) => {
    answers[currentIndex] = optIndex;
    questionStates[currentIndex] = 1; // Answered
    renderDots();
};

// ══════════════════════════════
//  NAVIGATION
// ══════════════════════════════
window.goToNext = () => {
    if (!currentTest || !currentTest.questions) return;
    if (currentIndex < currentTest.questions.length - 1) {
        showQuestion(currentIndex + 1);
    }
};

window.goToPrev = () => {
    if (!currentTest || !currentTest.questions) return;
    if (currentIndex > 0) {
        showQuestion(currentIndex - 1);
    }
};

window.markForReview = () => {
    if (!currentTest || !currentTest.questions) return;
    const isAnswered = answers[currentIndex] !== null;
    questionStates[currentIndex] = isAnswered ? 4 : 3;
    if (currentIndex < currentTest.questions.length - 1) {
        showQuestion(currentIndex + 1);
    } else {
        renderDots();
    }
};

window.clearResponse = () => {
    if (!currentTest || !currentTest.questions) return;
    answers[currentIndex] = null;
    questionStates[currentIndex] = 2; // Not Answered (but visited)
    showQuestion(currentIndex);
};

window.jumpToQuestion = (idx) => {
    if (!currentTest || !currentTest.questions) return;
    if (idx >= 0 && idx < currentTest.questions.length) {
        showQuestion(idx);
        // On mobile, close sidebar after jumping
        if (window.innerWidth < 1024) {
            document.getElementById('sidebar').classList.remove('open');
        }
    }
};

window.toggleSidebar = () => {
    document.getElementById('sidebar').classList.toggle('open');
};

window.toggleCalculator = () => {
    document.getElementById('calcModal').classList.toggle('hidden');
};

// ── Calculator Logic ──
let calcValue = '0';
window.calcNum = (n) => {
    if (calcValue === '0' && n !== '.') calcValue = String(n);
    else calcValue += String(n);
    updateCalc();
};
window.calcOp = (op) => {
    const last = calcValue.slice(-1);
    if (['+','-','*','/'].includes(last)) calcValue = calcValue.slice(0, -1) + op;
    else calcValue += op;
    updateCalc();
};
window.calcClear = () => { calcValue = '0'; updateCalc(); };
window.calcEqual = () => {
    try {
        calcValue = String(eval(calcValue.replace(/[^-+/*0-9.]/g, '')));
        if (calcValue === 'undefined' || calcValue === 'NaN') calcValue = 'Error';
    } catch { calcValue = 'Error'; }
    updateCalc();
};
function updateCalc() {
    document.getElementById('calcDisplay').textContent = calcValue;
}

// ══════════════════════════════
//  DOTS NAVIGATOR
// ══════════════════════════════
function renderDots() {
    const dotsNav = document.getElementById('dotsNav');
    if (!dotsNav || !currentTest?.questions) return;
    let html = '';
    currentTest.questions.forEach((_, i) => {
        let stateClass = 'not-visited';
        const state = questionStates[i];
        if (state === 1) stateClass = 'answered';
        else if (state === 2) stateClass = 'not-answered';
        else if (state === 3) stateClass = 'marked';
        else if (state === 4) stateClass = 'marked-answered';
        
        let borderClass = (i === currentIndex) ? 'ring-2 ring-blue-500 ring-offset-2' : '';
        
        html += `
            <button type="button" onclick="jumpToQuestion(${i})" 
                class="q-dot w-8 h-8 rounded flex items-center justify-center text-xs font-bold transition-all shadow-sm ${stateClass} ${borderClass}">
                ${i + 1}
            </button>`;
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

    const pct = total > 0 ? Math.round((score / total) * 100) : 0;
    const grade = pct >= 80 ? { color: 'emerald', bg: 'from-emerald-500 to-green-500', icon: '🏆', text: 'Excellent Performance!' } 
                : pct >= 50 ? { color: 'blue', bg: 'from-blue-500 to-indigo-500', icon: '🔥', text: 'Good Job!' } 
                : { color: 'orange', bg: 'from-orange-500 to-red-500', icon: '📚', text: 'Keep Practicing!' };

    document.getElementById('scoreSummary').className = "bg-white/95 backdrop-blur-md rounded-3xl border border-white shadow-premium p-6 sm:p-8 mb-5 sm:mb-8 text-center relative overflow-hidden";
    
    document.getElementById('scoreSummary').innerHTML = `
        <div class="absolute -top-10 -left-10 w-32 h-32 bg-${grade.color}-50 rounded-full blur-2xl opacity-60"></div>
        <div class="absolute -bottom-10 -right-10 w-32 h-32 bg-${grade.color}-50 rounded-full blur-2xl opacity-60"></div>
        
        <div class="relative z-10">
            <div class="text-5xl sm:text-6xl mb-3 sm:mb-4 inline-block transform hover:scale-110 transition-transform hover:rotate-6 cursor-default">${grade.icon}</div>
            <h2 class="text-2xl sm:text-3xl font-black font-display text-slate-800 tracking-tight mb-1 sm:mb-2">${grade.text}</h2>
            <p class="text-slate-500 text-xs sm:text-sm mb-6 sm:mb-8 font-medium">Your results have been securely recorded.</p>
            
            <div class="grid grid-cols-3 gap-3 sm:gap-4">
                <div class="bg-gradient-to-br ${grade.bg} rounded-2xl p-4 sm:p-5 shadow-lg transform transition hover:-translate-y-1">
                    <p class="text-2xl sm:text-4xl font-black text-white font-display tracking-tight">${score}<span class="text-sm sm:text-lg text-white/70 font-bold ml-1">/ ${total}</span></p>
                    <p class="text-[9px] sm:text-[10px] font-bold text-white/90 uppercase tracking-widest mt-1">Score</p>
                </div>
                <div class="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-sm transform transition hover:-translate-y-1">
                    <p class="text-2xl sm:text-4xl font-black text-slate-800 font-display tracking-tight">${pct}<span class="text-sm sm:text-lg text-slate-400 font-bold ml-1">%</span></p>
                    <p class="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Percentage</p>
                </div>
                <div class="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-sm transform transition hover:-translate-y-1">
                    <p class="text-xl sm:text-2xl font-black text-slate-800 font-display tracking-tight mt-1 sm:mt-2 mb-1 sm:mb-2">${timeTaken.display}</p>
                    <p class="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest">Time Taken</p>
                </div>
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
        let cls = 'q-dot w-7 h-7 sm:w-10 sm:h-10 rounded-xl border text-[10px] sm:text-sm font-bold flex items-center justify-center cursor-pointer transition-all shadow-sm';
        if (r.isCorrect) cls += ' review-correct border-emerald-200';
        else if (r.userAnswer === null) cls += ' review-skipped border-orange-200';
        else cls += ' review-wrong border-red-200';
        if (i === reviewIndex) cls += ' current scale-110 shadow-md ring-2 ring-white ring-offset-1';
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
        ? '<span class="text-[10px] sm:text-xs font-bold text-emerald-700 bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-xl shadow-sm">✓ Correct</span>'
        : r.userAnswer === null
            ? '<span class="text-[10px] sm:text-xs font-bold text-orange-700 bg-orange-100 border border-orange-200 px-3 py-1.5 rounded-xl shadow-sm">⚠ Skipped</span>'
            : '<span class="text-[10px] sm:text-xs font-bold text-red-700 bg-red-100 border border-red-200 px-3 py-1.5 rounded-xl shadow-sm">✗ Incorrect</span>';

    card.innerHTML = `
        <div class="q-card bg-white/95 backdrop-blur-md rounded-3xl border border-white shadow-premium flex flex-col flex-grow overflow-hidden transition-all duration-300">
            <div class="px-5 sm:px-7 py-4 sm:py-5 bg-gradient-to-b from-slate-50 to-white/50 border-b border-slate-100 flex items-center justify-between">
                <span class="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-2.5 py-1 rounded-lg">Question ${idx + 1} of ${currentTest.questions.length}</span>
                ${statusBadge}
            </div>
            <div class="px-5 sm:px-7 pt-5 sm:pt-7 pb-3 sm:pb-4">
                <h2 class="text-base sm:text-xl font-bold text-slate-800 leading-relaxed font-display tracking-tight">${esc(q.text)}</h2>
            </div>
            <div class="px-5 sm:px-7 pb-5 sm:pb-7 space-y-2.5 sm:space-y-3">
                ${q.options.map((opt, oi) => {
                    let cls = 'flex items-center w-full p-3.5 sm:p-4 border-2 rounded-2xl font-medium text-sm sm:text-base transition-all bg-white';
                    if (oi === r.correctAnswer && oi === r.userAnswer) cls += ' border-emerald-500 bg-emerald-50 shadow-[0_2px_10px_rgba(16,185,129,0.15)]';
                    else if (oi === r.correctAnswer) cls += ' border-emerald-400 bg-emerald-50 border-dashed';
                    else if (oi === r.userAnswer) cls += ' border-red-400 bg-red-50 shadow-[0_2px_8px_rgba(239,68,68,0.1)]';
                    else cls += ' border-slate-100 text-slate-600';

                    let badge = '';
                    if (oi === r.correctAnswer && oi === r.userAnswer) badge = '<span class="ml-auto text-[10px] sm:text-xs font-bold text-emerald-600 bg-emerald-100/50 px-2 py-1 rounded font-display tracking-wide">✓ Correctly Chosen</span>';
                    else if (oi === r.correctAnswer) badge = '<span class="ml-auto text-[10px] sm:text-xs font-bold text-emerald-600 bg-emerald-100/50 px-2 py-1 rounded font-display tracking-wide border border-emerald-200 border-dashed">✓ Correct Answer</span>';
                    else if (oi === r.userAnswer) badge = '<span class="ml-auto text-[10px] sm:text-xs font-bold text-red-500 bg-red-100/50 px-2 py-1 rounded font-display tracking-wide">✗ Your Selection</span>';


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
