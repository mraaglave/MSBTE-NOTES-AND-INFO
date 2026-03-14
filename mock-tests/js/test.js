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

const urlParams = new URLSearchParams(window.location.search);
const testId = urlParams.get('id');
let currentTest = null;
let currentUser = null;
let questionStates = []; // 'not-visited' | 'visited' | 'answered'
let timerInterval = null;
let timeRemaining = 0; // seconds
let testStartTime = 0;
let testSubmitted = false;
let mobileDrawerOpen = false;

if (!testId) { window.location.href = 'index.html'; }

// ── Auth ──
onAuthStateChanged(auth, async (user) => {
    if (user) { currentUser = user; loadTest(); }
    else { window.location.href = 'index.html'; }
});

// ── beforeunload guard ──
function beforeUnloadHandler(e) {
    e.preventDefault();
    e.returnValue = '';
}

// ── Shuffle ──
function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

// ── Load Test ──
async function loadTest() {
    try {
        const snapshot = await get(ref(db, `mock_tests/${testId}`));
        if (snapshot.exists()) {
            currentTest = snapshot.val();
            if (currentTest.questions && currentTest.questions.length > 0) {
                currentTest.questions = shuffleArray(currentTest.questions);
                const limit = currentTest.type === 'mock' ? 100 : 20;
                currentTest.questions = currentTest.questions.slice(0, Math.min(limit, currentTest.questions.length));
            }
            renderTest();
            startTimer();
            window.addEventListener('beforeunload', beforeUnloadHandler);
        } else {
            document.getElementById('loading').innerHTML = `
                <div class="text-red-500 mb-4"><svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg></div>
                <div class="font-bold text-xl text-gray-900 mb-2">Test Not Found</div>
                <p class="text-gray-500 mb-6">This test may have been removed or the link is invalid.</p>
                <a href="index.html" class="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium">Go Back</a>`;
        }
    } catch (err) {
        document.getElementById('loading').innerHTML = `<p class="text-red-500 font-medium">Error loading test: ${err.message}</p><a href="index.html" class="mt-4 inline-block bg-blue-600 text-white px-6 py-2 rounded-lg">Go Back</a>`;
    }
}

// ── Render Test ──
function renderTest() {
    document.getElementById('loading').classList.add('hidden');
    document.getElementById('testContainer').classList.remove('hidden');
    document.getElementById('mobileNavToggle').classList.remove('hidden');
    document.getElementById('mobileNavToggle').classList.add('flex');

    document.getElementById('navTestTitle').textContent = currentTest.title;
    document.getElementById('testTitle').textContent = currentTest.title;
    document.getElementById('testDescription').textContent = currentTest.description || '';

    // Promo banner
    if (currentTest.externalLink) {
        document.getElementById('promoBanner').classList.remove('hidden');
        document.getElementById('promoLink').href = currentTest.externalLink;
        document.getElementById('promoText').textContent = currentTest.externalLinkText || 'Study Material Available';
    }

    const total = currentTest.questions ? currentTest.questions.length : 0;
    questionStates = new Array(total).fill('not-visited');
    if (total > 0) questionStates[0] = 'visited'; // First question is visited

    // Update counters
    updateCounters();

    const container = document.getElementById('questionsContainer');
    container.innerHTML = '';

    if (currentTest.questions) {
        currentTest.questions.forEach((q, qIndex) => {
            const safeText = q.text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
            const div = document.createElement('div');
            div.className = 'bg-white p-5 md:p-7 rounded-2xl shadow-sm border-2 border-gray-100 question-block transition-all';
            div.id = `question-${qIndex}`;
            div.innerHTML = `
                <h3 class="text-base md:text-lg font-bold font-display text-gray-900 mb-5 flex gap-3">
                    <span class="bg-blue-100 text-blue-700 min-w-[30px] h-[30px] rounded-full flex items-center justify-center text-sm flex-shrink-0">${qIndex + 1}</span>
                    <span class="leading-relaxed">${safeText}</span>
                </h3>
                <div class="space-y-3 ml-0 md:ml-10">
                    ${q.options.map((opt, oIndex) => {
                        const safeOpt = opt.replace(/</g, '&lt;').replace(/>/g, '&gt;');
                        return `<div class="relative">
                            <input type="radio" name="q_${qIndex}" id="q_${qIndex}_o_${oIndex}" value="${oIndex}" class="hidden option-radio peer" onchange="markAnswered(${qIndex})">
                            <label for="q_${qIndex}_o_${oIndex}" class="option-label flex items-center w-full p-3.5 border-2 border-gray-200 rounded-xl hover:bg-gray-50 peer-checked:ring-1 peer-checked:ring-blue-600 font-medium text-gray-700 transition text-sm">
                                <span class="radio-dot w-5 h-5 border-2 border-gray-300 rounded-full mr-3 flex items-center justify-center flex-shrink-0">
                                    <svg class="w-3 h-3 fill-current text-blue-600 opacity-0 transition-opacity" viewBox="0 0 20 20"><circle cx="10" cy="10" r="5"/></svg>
                                </span>
                                <span class="option-letter font-bold text-gray-400 mr-2 text-xs">${String.fromCharCode(65 + oIndex)}.</span>
                                ${safeOpt}
                            </label>
                        </div>`;
                    }).join('')}
                </div>
                <div class="result-indicator hidden mt-5 pt-3 border-t ml-0 md:ml-10 font-bold flex items-center gap-2 text-sm"></div>
            `;
            container.appendChild(div);
        });
    }

    renderNavigator();
    setupScrollObserver();
}

// ── Mark Answered ──
window.markAnswered = (qIndex) => {
    questionStates[qIndex] = 'answered';
    updateCounters();
    renderNavigator();
};

// ── Scroll Observer (mark visited) ──
function setupScrollObserver() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !testSubmitted) {
                const idx = parseInt(entry.target.id.split('-')[1]);
                if (questionStates[idx] === 'not-visited') {
                    questionStates[idx] = 'visited';
                    renderNavigator();
                    updateCounters();
                }
            }
        });
    }, { threshold: 0.3 });

    document.querySelectorAll('.question-block').forEach(el => observer.observe(el));
}

// ── Timer ──
function startTimer() {
    const minutes = currentTest.type === 'mock' ? 120 : 30;
    timeRemaining = minutes * 60;
    testStartTime = Date.now();

    const timerEl = document.getElementById('timerDisplay');
    timerEl.classList.remove('hidden');
    timerEl.classList.add('flex');

    updateTimerDisplay();
    timerInterval = setInterval(() => {
        timeRemaining--;
        if (timeRemaining <= 0) {
            timeRemaining = 0;
            clearInterval(timerInterval);
            autoSubmit();
            return;
        }
        updateTimerDisplay();
    }, 1000);
}

function updateTimerDisplay() {
    const hrs = Math.floor(timeRemaining / 3600);
    const mins = Math.floor((timeRemaining % 3600) / 60);
    const secs = timeRemaining % 60;
    const timerText = document.getElementById('timerText');

    if (hrs > 0) {
        timerText.textContent = `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    } else {
        timerText.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }

    // Danger styling when < 5 min
    if (timeRemaining < 300 && timeRemaining > 0) {
        timerText.classList.add('timer-danger');
        document.getElementById('timerDisplay').classList.remove('bg-gray-100', 'border-gray-200');
        document.getElementById('timerDisplay').classList.add('bg-red-50', 'border-red-200');
    }
}

function getTimerString() {
    const hrs = Math.floor(timeRemaining / 3600);
    const mins = Math.floor((timeRemaining % 3600) / 60);
    const secs = timeRemaining % 60;
    if (hrs > 0) return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function getTimeTaken() {
    const elapsed = Math.round((Date.now() - testStartTime) / 1000);
    const mins = Math.floor(elapsed / 60);
    const secs = elapsed % 60;
    return { seconds: elapsed, display: `${mins}m ${secs}s` };
}

// ── Counters ──
function getAnsweredCount() {
    return questionStates.filter(s => s === 'answered').length;
}

function updateCounters() {
    const answered = getAnsweredCount();
    const total = questionStates.length;
    const els = ['sidebarAnswered', 'drawerAnswered', 'navAnswered'];
    const totals = ['sidebarTotal', 'drawerTotal', 'navTotal'];
    els.forEach(id => { const el = document.getElementById(id); if (el) el.textContent = answered; });
    totals.forEach(id => { const el = document.getElementById(id); if (el) el.textContent = total; });
}

// ── Navigator ──
function renderNavigator() {
    const sidebar = document.getElementById('sidebarGrid');
    const drawer = document.getElementById('drawerGrid');
    if (!sidebar || !drawer) return;

    let html = '';
    questionStates.forEach((state, i) => {
        const cls = state === 'answered' ? 'answered' : state === 'visited' ? 'visited' : '';
        html += `<button type="button" onclick="scrollToQuestion(${i})" class="nav-btn w-full aspect-square rounded-lg border border-gray-200 text-xs font-bold text-gray-600 hover:border-blue-400 transition ${cls}">${i + 1}</button>`;
    });
    sidebar.innerHTML = html;
    drawer.innerHTML = html;
    updateCounters();
}

window.scrollToQuestion = (idx) => {
    const el = document.getElementById(`question-${idx}`);
    if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Brief highlight
        el.classList.add('active-q');
        setTimeout(() => el.classList.remove('active-q'), 1500);
    }
    // Close mobile drawer if open
    if (mobileDrawerOpen) toggleMobileDrawer();
};

// ── Mobile Drawer ──
window.toggleMobileDrawer = () => {
    mobileDrawerOpen = !mobileDrawerOpen;
    const drawer = document.getElementById('mobileDrawer');
    const overlay = document.getElementById('mobileDrawerOverlay');
    if (mobileDrawerOpen) {
        drawer.classList.add('open');
        overlay.classList.remove('hidden');
    } else {
        drawer.classList.remove('open');
        overlay.classList.add('hidden');
    }
};

// ── Exit Modal ──
window.showExitModal = () => {
    const unanswered = questionStates.length - getAnsweredCount();
    document.getElementById('exitUnanswered').textContent = unanswered;
    document.getElementById('exitTimeLeft').textContent = getTimerString();
    document.getElementById('exitModal').classList.remove('hidden');
};

window.hideExitModal = () => {
    document.getElementById('exitModal').classList.add('hidden');
};

window.confirmExit = () => {
    testSubmitted = true;
    window.removeEventListener('beforeunload', beforeUnloadHandler);
    if (timerInterval) clearInterval(timerInterval);
    window.location.href = 'index.html';
};

// Logo exit confirmation
document.getElementById('exitLogoLink')?.addEventListener('click', (e) => {
    if (!testSubmitted) {
        e.preventDefault();
        showExitModal();
    }
});

// ── Submit Modal ──
window.showSubmitModal = () => {
    const answered = getAnsweredCount();
    const unanswered = questionStates.length - answered;
    document.getElementById('submitAnsweredCount').textContent = answered;
    document.getElementById('submitUnansweredCount').textContent = unanswered;
    document.getElementById('submitModal').classList.remove('hidden');
};

window.hideSubmitModal = () => {
    document.getElementById('submitModal').classList.add('hidden');
};

// ── Auto Submit (timer expired) ──
function autoSubmit() {
    alert("⏰ Time's up! Your test has been auto-submitted.");
    gradeAndSave();
}

// ── Execute Submit (user confirmed) ──
window.executeSubmit = () => {
    hideSubmitModal();
    document.getElementById('submitBtn').disabled = true;
    document.getElementById('submitBtn').innerHTML = '<svg class="animate-spin w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8a8 8 0 01-8-8z"></path></svg> Grading...';
    gradeAndSave();
};

// ── Grade & Save ──
async function gradeAndSave() {
    testSubmitted = true;
    window.removeEventListener('beforeunload', beforeUnloadHandler);
    if (timerInterval) clearInterval(timerInterval);

    const blocks = document.querySelectorAll('.question-block');
    let score = 0;
    const total = currentTest.questions.length;
    const timeTaken = getTimeTaken();

    currentTest.questions.forEach((q, qIndex) => {
        const selectedRadio = document.querySelector(`input[name="q_${qIndex}"]:checked`);
        const answered = selectedRadio !== null;
        const answer = answered ? parseInt(selectedRadio.value) : -1;
        const isCorrect = answered && answer === q.correct;
        if (isCorrect) score++;

        // Disable radios
        blocks[qIndex].querySelectorAll('input[type="radio"]').forEach(r => r.disabled = true);

        const selectedLabel = answered ? blocks[qIndex].querySelector(`input[value="${answer}"] + label`) : null;
        const correctLabel = blocks[qIndex].querySelector(`input[value="${q.correct}"] + label`);
        const indicator = blocks[qIndex].querySelector('.result-indicator');
        indicator.classList.remove('hidden');

        if (isCorrect) {
            if (selectedLabel) selectedLabel.classList.add('correct-answer');
            blocks[qIndex].classList.add('border-green-200');
            blocks[qIndex].style.backgroundColor = 'rgba(240,253,244,0.3)';
            indicator.classList.add('text-green-600');
            indicator.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> Correct';
        } else {
            if (selectedLabel) selectedLabel.classList.add('wrong-answer');
            if (correctLabel) {
                correctLabel.classList.add('correct-answer');
                correctLabel.innerHTML += '<span class="ml-auto text-green-600 flex items-center text-xs font-bold"><svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>Correct</span>';
            }
            blocks[qIndex].classList.add('border-red-200');
            blocks[qIndex].style.backgroundColor = 'rgba(254,242,242,0.3)';
            indicator.classList.add('text-red-500');
            if (!answered) {
                indicator.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01"></path></svg> Not Answered';
                blocks[qIndex].classList.remove('border-red-200');
                blocks[qIndex].classList.add('border-orange-200');
                blocks[qIndex].style.backgroundColor = 'rgba(255,247,237,0.3)';
                indicator.classList.remove('text-red-500');
                indicator.classList.add('text-orange-500');
            } else {
                indicator.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg> Incorrect';
            }
        }
    });

    // Hide submit bar, timer, mobile nav
    document.getElementById('submitBar').classList.add('hidden');
    document.getElementById('timerDisplay').classList.add('hidden');
    document.getElementById('mobileNavToggle').classList.add('hidden');
    document.getElementById('sidebarNav')?.classList.add('hidden');

    // Save to Firebase
    try {
        const resultsRef = ref(db, `mock_results/${currentUser.uid}`);
        const newResultRef = push(resultsRef);
        await set(newResultRef, {
            testId: testId,
            testTitle: currentTest.title,
            userEmail: currentUser.email,
            score: score,
            total: total,
            timeTaken: timeTaken.seconds,
            date: Date.now()
        });

        const percent = total > 0 ? Math.round((score / total) * 100) : 0;
        document.getElementById('scoreDisplay').textContent = `${score} / ${total}`;
        document.getElementById('percentDisplay').textContent = `${percent}%`;
        document.getElementById('timeTakenDisplay').textContent = timeTaken.display;

        // Result icon color based on score
        const iconEl = document.getElementById('resultIcon');
        if (percent >= 80) {
            iconEl.classList.remove('bg-green-100', 'text-green-600');
            iconEl.classList.add('bg-green-100', 'text-green-600');
        } else if (percent < 40) {
            iconEl.classList.remove('bg-green-100', 'text-green-600');
            iconEl.classList.add('bg-red-100', 'text-red-500');
            iconEl.innerHTML = '<svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M12 8v4m0 4h.01"></path></svg>';
        }

        // Show promo in results
        if (currentTest.externalLink) {
            document.getElementById('resultPromoBanner').classList.remove('hidden');
            document.getElementById('resultPromoLink').href = currentTest.externalLink;
            document.getElementById('resultPromoText').textContent = currentTest.externalLinkText || 'Study Material Available';
        }

        setTimeout(() => {
            document.getElementById('resultsModal').classList.remove('hidden');
        }, 600);
    } catch (err) {
        alert("Error saving results: " + err.message);
        document.getElementById('submitBtn').disabled = false;
        document.getElementById('submitBtn').textContent = 'Try Submitting Again';
    }
}

window.closeModalAndScroll = () => {
    document.getElementById('resultsModal').classList.add('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
};
