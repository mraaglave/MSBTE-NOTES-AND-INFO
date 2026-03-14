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

if (!testId) {
    window.location.href = 'index.html';
}

onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        loadTest();
    } else {
        window.location.href = 'index.html';
    }
});

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

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
        } else {
            document.getElementById('loading').innerHTML = `
                <div class="text-red-500 mb-4"><svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg></div>
                <div class="font-bold text-xl text-gray-900 mb-2">Test Not Found</div>
                <p class="text-gray-500 mb-6">This test may have been removed or the link is invalid.</p>
                <a href="index.html" class="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium">Go Back</a>
            `;
        }
    } catch (err) {
        document.getElementById('loading').textContent = "Error loading test: " + err.message;
    }
}

window.renderTest = function() {
    document.getElementById('loading').classList.add('hidden');
    document.getElementById('testContainer').classList.remove('hidden');
    
    document.getElementById('navTestTitle').textContent = currentTest.title;
    document.getElementById('testTitle').textContent = currentTest.title;
    document.getElementById('testDescription').textContent = currentTest.description || '';

    const container = document.getElementById('questionsContainer');
    let html = '';
    
    if (currentTest.questions) {
        currentTest.questions.forEach((q, qIndex) => {
            html += `
                <div class="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 question-block transition-colors">
                    <h3 class="text-xl font-bold font-display text-gray-900 mb-6 flex gap-3">
                        <span class="bg-blue-100 text-blue-700 min-w-[32px] h-8 rounded-full flex items-center justify-center text-base">${qIndex + 1}</span>
                        <span class="leading-relaxed">${q.text}</span>
                    </h3>
                    <div class="space-y-4 ml-0 md:ml-11">
            `;
            q.options.forEach((opt, oIndex) => {
                html += `
                    <div class="relative">
                        <input type="radio" required name="q_${qIndex}" id="q_${qIndex}_o_${oIndex}" value="${oIndex}" class="hidden option-radio peer">
                        <label for="q_${qIndex}_o_${oIndex}" class="option-label flex items-center w-full p-4 border-2 border-gray-200 rounded-xl hover:bg-gray-50 peer-checked:ring-1 peer-checked:ring-blue-600 font-medium text-gray-700 transition">
                            <span class="w-6 h-6 border-2 border-gray-300 rounded-full mr-4 flex items-center justify-center text-transparent peer-checked:border-blue-600 peer-checked:text-blue-600">
                                <svg class="w-4 h-4 fill-current opacity-0 transition-opacity" viewBox="0 0 20 20"><circle cx="10" cy="10" r="5"/></svg>
                            </span>
                            ${opt}
                        </label>
                    </div>
                `;
            });
            html += `</div>
                <!-- Result Indicator (hidden initially) -->
                <div class="result-indicator hidden mt-6 pt-4 border-t ml-0 md:ml-11 font-bold flex items-center gap-2"></div>
            </div>`;
        });
    }
    container.innerHTML = html;

    // Make custom radio buttons show the inner dot when checked
    const style = document.createElement('style');
    style.textContent = `
        .option-radio:checked + label span { border-color: #2563eb; }
        .option-radio:checked + label span svg { opacity: 1; }
    `;
    document.head.appendChild(style);
}

window.submitTest = async (e) => {
    e.preventDefault();
    
    if(!confirm("Are you sure you want to submit your answers?")) return;
    
    document.getElementById('submitBtn').disabled = true;
    document.getElementById('submitBtn').innerHTML = '<svg class="animate-spin w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8a8 8 0 01-8-8z"></path></svg> Grading...';
    
    const formData = new FormData(e.target);
    let score = 0;
    const total = currentTest.questions.length;
    const blocks = document.querySelectorAll('.question-block');

    // Grade questions and highlight UI
    currentTest.questions.forEach((q, qIndex) => {
        const answer = parseInt(formData.get(`q_${qIndex}`));
        const isCorrect = answer === q.correct;
        if (isCorrect) score++;
        
        // Disable all radios to prevent changing answers after submission
        blocks[qIndex].querySelectorAll('input[type="radio"]').forEach(r => r.disabled = true);
        
        // Highlight Selected
        const selectedLabel = blocks[qIndex].querySelector(`input[value="${answer}"] + label`);
        const correctLabel = blocks[qIndex].querySelector(`input[value="${q.correct}"] + label`);
        const indicator = blocks[qIndex].querySelector('.result-indicator');
        
        indicator.classList.remove('hidden');

        if (isCorrect) {
            if(selectedLabel) selectedLabel.classList.add('correct-answer');
            blocks[qIndex].classList.add('border-green-200', 'bg-green-50/30');
            indicator.classList.add('text-green-600');
            indicator.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> Correct Answer';
        } else {
            if(selectedLabel) selectedLabel.classList.add('wrong-answer');
            if(correctLabel) {
                correctLabel.classList.add('correct-answer');
                correctLabel.innerHTML += '<span class="ml-auto text-green-600 flex items-center text-sm"><svg class="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> Correct selected option</span>';
            }
            blocks[qIndex].classList.add('border-red-200', 'bg-red-50/30');
            indicator.classList.add('text-red-500');
            indicator.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg> Incorrect';
        }
    });

    // Save results to Firebase
    try {
        const resultsRef = ref(db, `mock_results/${currentUser.uid}`);
        const newResultRef = push(resultsRef);
        await set(newResultRef, {
            testId: testId,
            testTitle: currentTest.title,
            userEmail: currentUser.email,
            score: score,
            total: total,
            date: Date.now()
        });

        document.getElementById('scoreDisplay').textContent = `${score} / ${total}`;
        
        setTimeout(() => {
            document.getElementById('resultsModal').classList.remove('hidden');
            document.getElementById('submitBtn').parentElement.classList.add('hidden');
        }, 800);
    } catch (err) {
        alert("Error saving results: " + err.message);
        document.getElementById('submitBtn').disabled = false;
        document.getElementById('submitBtn').textContent = 'Try Submitting Again';
    }
};

window.closeModalAndScroll = () => {
    document.getElementById('resultsModal').classList.add('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
};
