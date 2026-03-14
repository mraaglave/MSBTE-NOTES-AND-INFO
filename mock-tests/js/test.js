import { initializeApp } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js";
import { getDatabase, ref, get, set, push } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-database.js";

// ── Firebase Configuration ──
const firebaseConfig = {
    apiKey: "AIzaSyBCA3de0oBHEmAAwguGcmD8hy679caG64I",
    authDomain: "msbte-notes-info.firebaseapp.com",
    projectId: "msbte-notes-info",
    storageBucket: "msbte-notes-info.firebasestorage.app",
    messagingSenderId: "497397765847",
    appId: "1:497397765847:web:5ff2d9910dfe14c22a8292"
};

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getDatabase(firebaseApp);

/**
 * ExamManager: Centralized controller for the Mock Test System
 */
const ExamManager = {
    // ── State ──
    testId: new URLSearchParams(window.location.search).get('id'),
    currentTest: null,
    currentUser: null,
    currentIndex: 0,
    answers: [],
    questionStates: [], // 0: Not Visited, 1: Answered, 2: Not Answered, 3: Marked, 4: Answered & Marked
    timerInterval: null,
    timeRemaining: 0,
    testStartTime: 0,
    testSubmitted: false,
    reviewIndex: 0,
    gradeResults: [],
    calcValue: '0',

    // ── Initialization ──
    async init() {
        console.log("ExamManager initializing...");
        if (!this.testId) {
            window.location.href = 'index.html';
            return;
        }

        onAuthStateChanged(auth, (user) => {
            if (user) {
                this.currentUser = user;
                this.loadTestData();
            } else {
                window.location.href = 'index.html';
            }
        });

        this.bindGlobalEvents();
    },

    bindGlobalEvents() {
        // Fullscreen toggle if needed
        window.addEventListener('beforeunload', (e) => {
            if (!this.testSubmitted && this.currentTest) {
                e.preventDefault();
                e.returnValue = '';
            }
        });

        // Exit logo link safety
        const exitLogo = document.getElementById('exitLogoLink');
        if (exitLogo) {
            exitLogo.onclick = (e) => {
                if (!this.testSubmitted) {
                    e.preventDefault();
                    this.showExitModal();
                }
            };
        }
    },

    // ── Data Loading ──
    async loadTestData() {
        console.log("Loading test data for ID:", this.testId);
        try {
            const snap = await get(ref(db, `mock_tests/${this.testId}`));
            if (!snap.exists()) {
                this.renderError("Test Not Found", "This test may have been removed or is no longer available.");
                return;
            }

            this.currentTest = snap.val();
            this.preprocessQuestions();
            this.answers = new Array(this.currentTest.questions.length).fill(null);
            this.questionStates = new Array(this.currentTest.questions.length).fill(0);

            this.setupInitialUI();
        } catch (err) {
            console.error("Data load error:", err);
            this.renderError("Load Error", "Unable to fetch test data. Please check your connection.");
        }
    },

    preprocessQuestions() {
        if (this.currentTest.questions?.length) {
            // Shuffle
            for (let i = this.currentTest.questions.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [this.currentTest.questions[i], this.currentTest.questions[j]] = [this.currentTest.questions[j], this.currentTest.questions[i]];
            }
            // Limit
            const limit = this.currentTest.type === 'mock' ? 100 : 20;
            this.currentTest.questions = this.currentTest.questions.slice(0, limit);
        }
    },

    setupInitialUI() {
        const loadingEl = document.getElementById('loading');
        if (loadingEl) loadingEl.classList.add('hidden');

        const instrTitle = document.getElementById('instrTitle');
        const instrDuration = document.getElementById('instrDuration');
        if (instrTitle) instrTitle.textContent = `Instructions - ${this.currentTest.title}`;
        if (instrDuration) instrDuration.textContent = this.currentTest.type === 'mock' ? 120 : 30;

        this.bindInstructionsEvents();
    },

    bindInstructionsEvents() {
        const agreeCheck = document.getElementById('agreeCheck');
        const startBtn = document.getElementById('startTestBtn');

        if (agreeCheck && startBtn) {
            const syncBtn = () => {
                startBtn.disabled = !agreeCheck.checked;
                console.log("Start button enabled:", agreeCheck.checked);
            };
            agreeCheck.onchange = syncBtn;
            agreeCheck.onclick = syncBtn; // Extra safety for some mobile browsers
            syncBtn();

            startBtn.onclick = () => this.startExam();
        }
    },

    // ── Exam Flow ──
    startExam() {
        console.log("Exam starting...");
        const overlay = document.getElementById('instructionsOverlay');
        const container = document.getElementById('testContainer');
        
        if (overlay) overlay.classList.add('hidden');
        if (container) container.classList.remove('hidden');

        // Setup Top Nav
        document.getElementById('navTestTitle').textContent = this.currentTest.title;
        document.getElementById('userName').textContent = this.currentUser.displayName || this.currentUser.email.split('@')[0];
        document.getElementById('userInitial').textContent = (this.currentUser.displayName || this.currentUser.email)[0].toUpperCase();

        this.bindExamControls();
        this.startTimer();
        this.showQuestion(0);
    },

    bindExamControls() {
        window.markForReview = () => this.markForReview();
        window.clearResponse = () => this.clearResponse();
        window.goToPrev = () => this.goToPrev();
        window.goToNext = () => this.goToNext();
        window.jumpToQuestion = (i) => this.jumpToQuestion(i);
        window.toggleSidebar = () => this.toggleSidebar();
        window.toggleCalculator = () => this.toggleCalculator();
        window.showSubmitModal = () => this.showSubmitModal();
        window.hideSubmitModal = () => this.hideSubmitModal();
        window.executeSubmit = () => this.executeSubmit();
        window.showExitModal = () => this.showExitModal();
        window.hideExitModal = () => this.hideExitModal();
        window.confirmExit = () => this.confirmExit();
        
        // Results/Review controls
        window.jumpReview = (i) => this.showReviewQuestion(i);
        window.reviewPrev = () => this.reviewPrev();
        window.reviewNext = () => this.reviewNext();

        // Calc
        window.calcNum = (n) => this.calcNum(n);
        window.calcOp = (op) => this.calcOp(op);
        window.calcClear = () => this.calcClear();
        window.calcEqual = () => this.calcEqual();
    },

    // ── UI Rendering ──
    showQuestion(idx) {
        if (!this.currentTest.questions[idx]) return;
        this.currentIndex = idx;
        const q = this.currentTest.questions[idx];
        const total = this.currentTest.questions.length;
        
        // Handle Question State
        if (this.questionStates[idx] === 0) this.questionStates[idx] = 2; // Visited but not answered

        const card = document.getElementById('questionCard');
        const selected = this.answers[idx];

        card.innerHTML = `
            <div class="q-card bg-white/95 backdrop-blur-md rounded-3xl border border-white shadow-premium flex flex-col flex-grow overflow-hidden transition-all duration-300">
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
                <div class="px-5 sm:px-7 pt-5 sm:pt-7 pb-3 sm:pb-4">
                    <h2 class="text-base sm:text-xl font-bold text-slate-800 leading-relaxed font-display tracking-tight">${this.esc(q.text)}</h2>
                </div>
                <div class="px-5 sm:px-7 pb-5 sm:pb-7 space-y-2.5 sm:space-y-3 flex-grow">
                    ${q.options.map((opt, oi) => `
                        <div class="relative group">
                            <input type="radio" name="answer" id="opt_${oi}" value="${oi}" class="hidden opt-radio peer" ${selected === oi ? 'checked' : ''} onchange="ExamManager.selectAnswer(${oi})">
                            <label for="opt_${oi}" class="opt-label flex items-center w-full p-3.5 sm:p-4 border-2 border-slate-100 rounded-2xl font-medium text-slate-700 transition-all text-sm sm:text-base cursor-pointer peer-checked:border-blue-500 peer-checked:bg-blue-50/50 hover:border-slate-300 active:scale-[0.99] shadow-sm hover:shadow-md bg-white">
                                <span class="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-bold mr-3 sm:mr-4 border border-slate-200 peer-checked:bg-blue-600 peer-checked:text-white transition-colors group-hover:bg-slate-200 uppercase">${String.fromCharCode(65 + oi)}</span>
                                <span class="leading-snug">${this.esc(opt)}</span>
                            </label>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        this.updateNavButtons();
        this.renderDots();
    },

    selectAnswer(idx) {
        this.answers[this.currentIndex] = idx;
        this.questionStates[this.currentIndex] = 1; // Answered
        this.renderDots();
    },

    updateNavButtons() {
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        const isLast = this.currentIndex === this.currentTest.questions.length - 1;

        if (prevBtn) prevBtn.disabled = this.currentIndex === 0;
        if (nextBtn) {
            nextBtn.textContent = isLast ? 'Save & Submit' : 'Save & Next';
            nextBtn.onclick = () => isLast ? this.showSubmitModal() : this.goToNext();
        }
    },

    renderDots() {
        const nav = document.getElementById('dotsNav');
        if (!nav) return;
        nav.innerHTML = this.currentTest.questions.map((_, i) => {
            let stateClass = 'not-visited';
            const state = this.questionStates[i];
            if (state === 1) stateClass = 'answered';
            else if (state === 2) stateClass = 'not-answered';
            else if (state === 3) stateClass = 'marked';
            else if (state === 4) stateClass = 'marked-answered';
            
            const activeClass = (i === this.currentIndex) ? 'ring-2 ring-blue-500 ring-offset-2' : '';
            return `<button onclick="jumpToQuestion(${i})" class="q-dot w-8 h-8 rounded flex items-center justify-center text-xs font-bold transition-all shadow-sm ${stateClass} ${activeClass}">${i + 1}</button>`;
        }).join('');
    },

    // ── Navigation Logic ──
    goToNext() { if (this.currentIndex < this.currentTest.questions.length - 1) this.showQuestion(this.currentIndex + 1); },
    goToPrev() { if (this.currentIndex > 0) this.showQuestion(this.currentIndex - 1); },
    jumpToQuestion(i) {
        this.showQuestion(i);
        if (window.innerWidth < 1024) this.toggleSidebar(false);
    },
    markForReview() {
        const isAnswered = this.answers[this.currentIndex] !== null;
        this.questionStates[this.currentIndex] = isAnswered ? 4 : 3;
        if (this.currentIndex < this.currentTest.questions.length - 1) this.goToNext();
        else this.renderDots();
    },
    clearResponse() {
        this.answers[this.currentIndex] = null;
        this.questionStates[this.currentIndex] = 2; // Visited
        this.showQuestion(this.currentIndex);
    },

    // ── Timer Logic ──
    startTimer() {
        const mins = this.currentTest.type === 'mock' ? 120 : 30;
        this.timeRemaining = mins * 60;
        this.testStartTime = Date.now();
        this.updateTimerUI();
        this.timerInterval = setInterval(() => {
            this.timeRemaining--;
            if (this.timeRemaining <= 0) {
                this.timeRemaining = 0;
                clearInterval(this.timerInterval);
                this.autoSubmit();
            } else {
                this.updateTimerUI();
            }
        }, 1000);
    },

    updateTimerUI() {
        const h = Math.floor(this.timeRemaining / 3600);
        const m = Math.floor((this.timeRemaining % 3600) / 60);
        const s = this.timeRemaining % 60;
        const display = h > 0 ? `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}` : `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
        const el = document.getElementById('timerText');
        if (el) el.textContent = display;
        if (this.timeRemaining < 300) el?.classList.add('timer-danger');
    },

    // ── Modals & Sidebar ──
    toggleSidebar(force) {
        const sidebar = document.getElementById('sidebar');
        if (typeof force === 'boolean') {
            force ? sidebar.classList.add('open') : sidebar.classList.remove('open');
        } else {
            sidebar.classList.toggle('open');
        }
    },

    toggleCalculator() {
        document.getElementById('calcModal').classList.toggle('hidden');
    },

    showSubmitModal() {
        const answered = this.answers.filter(a => a !== null).length;
        document.getElementById('submitAnswered').textContent = answered;
        document.getElementById('submitUnanswered').textContent = this.currentTest.questions.length - answered;
        document.getElementById('submitModal').classList.remove('hidden');
    },
    hideSubmitModal() { document.getElementById('submitModal').classList.add('hidden'); },

    showExitModal() {
        document.getElementById('exitUnanswered').textContent = this.answers.filter(a => a === null).length;
        const h = Math.floor(this.timeRemaining / 3600), m = Math.floor((this.timeRemaining % 3600) / 60), s = this.timeRemaining % 60;
        document.getElementById('exitTimeLeft').textContent = h > 0 ? `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}` : `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
        document.getElementById('exitModal').classList.remove('hidden');
    },
    hideExitModal() { document.getElementById('exitModal').classList.add('hidden'); },
    confirmExit() { this.testSubmitted = true; window.location.href = 'index.html'; },

    // ── Submission ──
    autoSubmit() {
        alert("Time's Up! Test submitted automatically.");
        this.executeSubmit();
    },

    async executeSubmit() {
        this.testSubmitted = true;
        this.hideSubmitModal();
        if (this.timerInterval) clearInterval(this.timerInterval);

        let score = 0;
        const total = this.currentTest.questions.length;
        this.gradeResults = this.currentTest.questions.map((q, i) => {
            const userAns = this.answers[i];
            const isCorrect = userAns !== null && userAns === q.correct;
            if (isCorrect) score++;
            return { userAnswer: userAns, correctAnswer: q.correct, isCorrect };
        });

        // Save
        try {
            const timeTakenSec = Math.round((Date.now() - this.testStartTime) / 1000);
            await push(ref(db, `mock_results/${this.currentUser.uid}`), {
                testId: this.testId,
                testTitle: this.currentTest.title,
                userEmail: this.currentUser.email,
                score, total, timeTaken: timeTakenSec, date: Date.now()
            });
        } catch (err) { console.error("Save error:", err); }

        this.renderResults(score, total);
    },

    // ── Results & Review ──
    renderResults(score, total) {
        document.getElementById('testContainer').classList.add('hidden');
        document.getElementById('timerBox').classList.add('hidden');
        document.getElementById('reviewContainer').classList.remove('hidden');

        const pct = Math.round((score / total) * 100);
        const timeTaken = Math.round((Date.now() - this.testStartTime) / 1000);
        const timeDisplay = `${Math.floor(timeTaken/60)}m ${timeTaken%60}s`;

        const grade = pct >= 80 ? { color: 'emerald', bg: 'from-emerald-500 to-green-500', icon: '🏆', text: 'Excellent!' } 
                    : pct >= 50 ? { color: 'blue', bg: 'from-blue-500 to-indigo-500', icon: '🔥', text: 'Good Job!' } 
                    : { color: 'orange', bg: 'from-orange-500 to-red-500', icon: '📚', text: 'Keep It Up!' };

        document.getElementById('scoreSummary').innerHTML = `
            <div class="relative z-10">
                <div class="text-6xl mb-4 transform hover:scale-110 transition-transform">${grade.icon}</div>
                <h2 class="text-3xl font-black font-display text-slate-800 mb-1">${grade.text}</h2>
                <p class="text-slate-500 text-sm mb-8">Results recorded successfully.</p>
                <div class="grid grid-cols-3 gap-4">
                    <div class="bg-gradient-to-br ${grade.bg} rounded-2xl p-5 text-white shadow-lg">
                        <p class="text-3xl font-black font-display">${score}<span class="text-sm opacity-70"> / ${total}</span></p>
                        <p class="text-[10px] font-bold uppercase tracking-widest">Score</p>
                    </div>
                    <div class="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                        <p class="text-3xl font-black text-slate-800 font-display">${pct}%</p>
                        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Accuracy</p>
                    </div>
                    <div class="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                        <p class="text-xl font-black text-slate-800 font-display mt-2">${timeDisplay}</p>
                        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Time</p>
                    </div>
                </div>
            </div>
        `;

        if (this.currentTest.externalLink) {
            document.getElementById('reviewPromoBanner').classList.remove('hidden');
            document.getElementById('reviewPromoLink').href = this.currentTest.externalLink;
            document.getElementById('reviewPromoText').textContent = this.currentTest.externalLinkText || 'Study Material';
        }

        this.renderReviewDots();
        this.showReviewQuestion(0);
    },

    renderReviewDots() {
        const nav = document.getElementById('reviewDotsNav');
        nav.innerHTML = this.gradeResults.map((r, i) => {
            let cls = 'q-dot w-9 h-9 sm:w-10 sm:h-10 rounded-xl border text-xs font-bold flex items-center justify-center cursor-pointer transition-all shadow-sm';
            if (r.isCorrect) cls += ' review-correct border-emerald-200';
            else if (r.userAnswer === null) cls += ' review-skipped border-orange-200';
            else cls += ' review-wrong border-red-200';
            if (i === this.reviewIndex) cls += ' scale-110 shadow-md ring-2 ring-blue-400 ring-offset-1';
            return `<button onclick="jumpReview(${i})" class="${cls}">${i + 1}</button>`;
        }).join('');
    },

    showReviewQuestion(idx) {
        this.reviewIndex = idx;
        const q = this.currentTest.questions[idx];
        const r = this.gradeResults[idx];
        const card = document.getElementById('reviewQuestionCard');

        const badge = r.isCorrect ? '<span class="text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-200">✓ Correct</span>'
                    : r.userAnswer === null ? '<span class="text-xs font-bold text-orange-700 bg-orange-100 px-3 py-1.5 rounded-xl border border-orange-200">⚠ Skipped</span>'
                    : '<span class="text-xs font-bold text-red-700 bg-red-100 px-3 py-1.5 rounded-xl border border-red-200">✗ Incorrect</span>';

        card.innerHTML = `
            <div class="q-card bg-white/95 backdrop-blur-md rounded-3xl border border-white shadow-premium overflow-hidden">
                <div class="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                    <span class="text-xs font-bold text-slate-400 uppercase tracking-widest">Question ${idx + 1}</span>
                    ${badge}
                </div>
                <div class="p-6">
                    <h2 class="text-lg font-bold text-slate-800 leading-relaxed mb-6">${this.esc(q.text)}</h2>
                    <div class="space-y-3">
                        ${q.options.map((opt, oi) => {
                            let cls = 'flex items-center w-full p-4 border-2 rounded-2xl font-medium transition-all ';
                            if (oi === r.correctAnswer && oi === r.userAnswer) cls += 'border-emerald-500 bg-emerald-50';
                            else if (oi === r.correctAnswer) cls += 'border-emerald-400 bg-emerald-50 border-dashed';
                            else if (oi === r.userAnswer) cls += 'border-red-400 bg-red-50';
                            else cls += 'border-slate-50 text-slate-600';
                            
                            return `<div class="${cls}">
                                <span class="font-bold text-slate-400 mr-3">${String.fromCharCode(65 + oi)}.</span>
                                <span>${this.esc(opt)}</span>
                            </div>`;
                        }).join('')}
                    </div>
                </div>
            </div>
        `;

        document.getElementById('reviewPrevBtn').disabled = idx === 0;
        document.getElementById('reviewNextBtn').disabled = idx === this.gradeResults.length - 1;
        this.renderReviewDots();
    },

    reviewNext() { if (this.reviewIndex < this.gradeResults.length - 1) this.showReviewQuestion(this.reviewIndex + 1); },
    reviewPrev() { if (this.reviewIndex > 0) this.showReviewQuestion(this.reviewIndex - 1); },

    // ── Utilities ──
    esc(str) { return str.toString().replace(/</g, '&lt;').replace(/>/g, '&gt;'); },
    renderError(title, msg) {
        document.getElementById('loading').innerHTML = `
            <div class="text-red-500 mb-4 animate-bounce"><svg class="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg></div>
            <h2 class="text-2xl font-black font-display text-slate-800 mb-2">${title}</h2>
            <p class="text-slate-500 mb-8 max-w-xs mx-auto">${msg}</p>
            <a href="index.html" class="bg-blue-600 text-white font-bold px-8 py-3 rounded-xl shadow-lg hover:bg-blue-700 transition-all">Go Home</a>
        `;
    },

    // ── Calculator ──
    calcNum(n) { this.calcValue = this.calcValue === '0' && n !== '.' ? String(n) : this.calcValue + String(n); this.upCalc(); },
    calcOp(op) { const last = this.calcValue.slice(-1); if (['+','-','*','/'].includes(last)) this.calcValue = this.calcValue.slice(0, -1) + op; else this.calcValue += op; this.upCalc(); },
    calcClear() { this.calcValue = '0'; this.upCalc(); },
    calcEqual() { try { this.calcValue = String(eval(this.calcValue.replace(/[^-+/*0-9.]/g, ''))); if (['undefined','NaN','Infinity'].includes(this.calcValue)) this.calcValue = 'Error'; } catch { this.calcValue = 'Error'; } this.upCalc(); },
    upCalc() { document.getElementById('calcDisplay').textContent = this.calcValue; }
};

// Start the portal
ExamManager.init();

// Export for internal use if needed
window.ExamManager = ExamManager;
