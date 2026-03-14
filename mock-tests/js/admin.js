import { initializeApp } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js";
import { initializeAppCheck, ReCaptchaV3Provider } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-app-check.js";
import { getDatabase, ref, push, onValue, set, get } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-database.js";

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

let questions = [];
let analyticsTestsCount = 0;
let analyticsAttemptsCount = 0;
let editingTestId = null; // null = creating new, string = editing existing

onAuthStateChanged(auth, (user) => {
    if (user) {
        if (user.email === 'bitbuster32@gmail.com') {
            document.getElementById('authView').classList.add('hidden');
            document.getElementById('dashboardView').classList.remove('hidden');
            document.getElementById('logoutBtn').classList.remove('hidden');
            document.getElementById('adminEmailDisplay').classList.remove('hidden');
            document.getElementById('adminEmailDisplay').textContent = user.email;
            
            // Mobile
            const mEmail = document.getElementById('adminEmailDisplayMobile');
            if (mEmail) { mEmail.textContent = user.email; mEmail.classList.remove('hidden'); }
            const mLogout = document.getElementById('logoutBtnMobile');
            if (mLogout) { mLogout.classList.remove('hidden'); mLogout.addEventListener('click', () => signOut(auth)); }
            
            loadResults(); 
            fetchTotalTestsCount();
        } else {
            // Unauthorized user
            signOut(auth);
            document.getElementById('authError').textContent = "Unauthorized: Admin access denied.";
            document.getElementById('authError').classList.remove('hidden');
        }
    } else {
        document.getElementById('authView').classList.remove('hidden');
        document.getElementById('dashboardView').classList.add('hidden');
        document.getElementById('logoutBtn').classList.add('hidden');
        document.getElementById('adminEmailDisplay').classList.add('hidden');
        
        // Mobile
        const mEmail = document.getElementById('adminEmailDisplayMobile');
        if (mEmail) mEmail.classList.add('hidden');
        const mLogout = document.getElementById('logoutBtnMobile');
        if (mLogout) mLogout.classList.add('hidden');
    }
});

// reCAPTCHA verification helper
async function verifyRecaptcha(action = 'login') {
    if (typeof grecaptcha === 'undefined') return true;
    try { return await grecaptcha.execute('6LftA34sAAAAAGAYDgjQ4RCsCUeBmE6GQvgauRPm', { action }); } 
    catch (e) { return true; }
}

window.loginAdmin = async () => {
    await verifyRecaptcha('login');
    const email = document.getElementById('email').value;
    const pass = document.getElementById('password').value;
    const btn = document.getElementById('loginBtn');
    btn.innerHTML = 'Authenticating...';
    try {
        await signInWithEmailAndPassword(auth, email, pass);
        btn.innerHTML = 'Enter Dashboard';
    } catch (error) {
        document.getElementById('authError').textContent = error.message;
        document.getElementById('authError').classList.remove('hidden');
        btn.innerHTML = 'Enter Dashboard';
    }
};

window.loginWithGoogle = async () => {
     await verifyRecaptcha('login');
     const provider = new GoogleAuthProvider();
     try { await signInWithPopup(auth, provider); } 
     catch (error) {
        document.getElementById('authError').textContent = error.message;
        document.getElementById('authError').classList.remove('hidden');
     }
};

window.showBulkUploadModal = () => {
    document.getElementById('bulkDataInput').value = '';
    document.getElementById('bulkUploadModal').classList.remove('hidden');
};

window.closeBulkUploadModal = () => {
    document.getElementById('bulkUploadModal').classList.add('hidden');
};

window.processBulkUpload = () => {
    const rawData = document.getElementById('bulkDataInput').value.trim();
    if(!rawData) {
        alert("Please paste your JSON data.");
        return;
    }
    
    try {
        const parsed = JSON.parse(rawData);
        if(!Array.isArray(parsed)) {
            throw new Error("Data must be a JSON array `[...]`");
        }
        
        let added = 0;
        parsed.forEach((q, i) => {
            // Validate object structure
            if(!q.text || !Array.isArray(q.options) || q.options.length !== 4 || typeof q.correct !== 'number' || q.correct < 0 || q.correct > 3) {
                console.warn(`Skipping invalid question at index ${i}:`, q);
                return;
            }
            questions.push({
                text: String(q.text),
                options: q.options.map(o => String(o)),
                correct: parseInt(q.correct)
            });
            added++;
        });
        
        if(added > 0) {
            renderQuestions();
            closeBulkUploadModal();
            alert(`Successfully imported ${added} questions! (Skipped ${parsed.length - added} invalid ones)`);
        } else {
            alert("No valid questions found in the JSON.");
        }
    } catch (error) {
        alert("Invalid JSON format! Error: " + error.message);
    }
};

document.getElementById('logoutBtn').addEventListener('click', () => {
     if(confirm("Securely end session?")) signOut(auth);
});

window.addQuestion = () => {
    questions.push({ text: '', options: ['', '', '', ''], correct: 0 });
    renderQuestions();
};

window.removeQuestion = (index) => {
    if(confirm("Remove this question?")) {
        questions.splice(index, 1);
        renderQuestions();
    }
}

window.updateQuestion = (qIndex, field, value) => {
    if (field.startsWith('opt_')) {
        const optIndex = parseInt(field.split('_')[1]);
        questions[qIndex].options[optIndex] = value;
    } else {
        questions[qIndex][field] = value;
    }
};

window.resetForm = () => {
    if(confirm("Clear the entire form fields?")) {
        editingTestId = null;
        document.getElementById('testTitle').value = '';
        document.getElementById('testDescription').value = '';
        document.getElementById('testType').value = 'practice';
        document.getElementById('externalLinkUrl').value = '';
        document.getElementById('externalLinkText').value = '';
        questions = [];
        renderQuestions();
        setFormMode('create');
    }
}

function setFormMode(mode, testName) {
    const formTitle = document.getElementById('formTitle');
    const editIndicator = document.getElementById('editingIndicator');
    const cancelBtn = document.getElementById('cancelEditBtn');
    const btnText = document.getElementById('publishBtnText');
    const btn = document.getElementById('publishBtn');

    if (mode === 'edit') {
        formTitle.textContent = 'Edit Mock Test';
        editIndicator.classList.remove('hidden');
        document.getElementById('editingTestName').textContent = testName || '';
        cancelBtn.classList.remove('hidden');
        btnText.textContent = 'Update Test';
        btn.classList.remove('bg-blue-600', 'hover:bg-blue-700', 'shadow-blue-200');
        btn.classList.add('bg-amber-600', 'hover:bg-amber-700', 'shadow-amber-200');
    } else {
        formTitle.textContent = 'Create Mock Test';
        editIndicator.classList.add('hidden');
        cancelBtn.classList.add('hidden');
        btnText.textContent = 'Publish New Test';
        btn.classList.remove('bg-amber-600', 'hover:bg-amber-700', 'shadow-amber-200');
        btn.classList.add('bg-blue-600', 'hover:bg-blue-700', 'shadow-blue-200');
    }
}

window.cancelEdit = () => {
    editingTestId = null;
    document.getElementById('testTitle').value = '';
    document.getElementById('testDescription').value = '';
    document.getElementById('testType').value = 'practice';
    document.getElementById('externalLinkUrl').value = '';
    document.getElementById('externalLinkText').value = '';
    questions = [];
    renderQuestions();
    setFormMode('create');
};

window.loadTestForEdit = async (testId) => {
    try {
        const snapshot = await get(ref(db, `mock_tests/${testId}`));
        if (!snapshot.exists()) { alert('Test not found.'); return; }
        const test = snapshot.val();

        editingTestId = testId;
        document.getElementById('testTitle').value = test.title || '';
        document.getElementById('testDescription').value = test.description || '';
        document.getElementById('testType').value = test.type || 'practice';
        document.getElementById('externalLinkUrl').value = test.externalLink || '';
        document.getElementById('externalLinkText').value = test.externalLinkText || '';

        questions = (test.questions || []).map(q => ({
            text: q.text || '',
            options: q.options || ['', '', '', ''],
            correct: typeof q.correct === 'number' ? q.correct : 0
        }));
        renderQuestions();
        setFormMode('edit', test.title);

        // Scroll form into view
        document.getElementById('formTitle').scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (err) {
        alert('Error loading test: ' + err.message);
    }
};

window.deleteTest = async (testId, title) => {
    if (!confirm(`Permanently delete "${title}"? This cannot be undone.`)) return;
    if (!confirm(`Are you REALLY sure? All student results referencing this test will remain but the test itself will be gone.`)) return;
    try {
        await set(ref(db, `mock_tests/${testId}`), null);
        alert('Test deleted.');
        if (editingTestId === testId) cancelEdit();
    } catch (err) {
        alert('Error deleting: ' + err.message);
    }
};

function renderQuestions() {
    const container = document.getElementById('questionsContainer');
    document.getElementById('qCountBadge').textContent = questions.length;
    
    if (questions.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50" id="emptyQuestionsMsg">
                <p class="text-gray-500 font-medium">No questions added yet.<br>Click the button below to start.</p>
            </div>`;
        return;
    }
    
    container.innerHTML = '';
    
    questions.forEach((q, i) => {
        const qDiv = document.createElement('div');
        qDiv.className = 'p-5 bg-white rounded-xl border border-gray-200 shadow-sm relative group hover:border-blue-300 transition-colors';
        qDiv.innerHTML = `
            <div class="flex justify-between items-center mb-3">
                <div class="font-bold text-gray-800 bg-gray-100 px-3 py-1 rounded-full text-xs uppercase tracking-wider">Question ${i + 1}</div>
                <button onclick="removeQuestion(${i})" class="text-red-400 hover:text-red-600 p-1 bg-red-50 rounded-md transition opacity-0 group-hover:opacity-100" title="Delete">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
            </div>
            
            <textarea placeholder="Write question prompt here..." rows="2" class="w-full mb-4 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none font-medium" oninput="updateQuestion(${i}, 'text', this.value)">${q.text}</textarea>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                <div class="flex items-center">
                    <span class="bg-gray-100 text-gray-500 text-xs font-bold px-3 py-2 border border-r-0 border-gray-300 rounded-l-lg">A</span>
                    <input type="text" placeholder="Option 1" class="w-full px-3 py-2 border border-gray-300 rounded-r-lg focus:ring-1 focus:ring-blue-500 outline-none" value="${q.options[0]}" oninput="updateQuestion(${i}, 'opt_0', this.value)">
                </div>
                <div class="flex items-center">
                    <span class="bg-gray-100 text-gray-500 text-xs font-bold px-3 py-2 border border-r-0 border-gray-300 rounded-l-lg">B</span>
                    <input type="text" placeholder="Option 2" class="w-full px-3 py-2 border border-gray-300 rounded-r-lg focus:ring-1 focus:ring-blue-500 outline-none" value="${q.options[1]}" oninput="updateQuestion(${i}, 'opt_1', this.value)">
                </div>
                <div class="flex items-center">
                    <span class="bg-gray-100 text-gray-500 text-xs font-bold px-3 py-2 border border-r-0 border-gray-300 rounded-l-lg">C</span>
                    <input type="text" placeholder="Option 3" class="w-full px-3 py-2 border border-gray-300 rounded-r-lg focus:ring-1 focus:ring-blue-500 outline-none" value="${q.options[2]}" oninput="updateQuestion(${i}, 'opt_2', this.value)">
                </div>
                <div class="flex items-center">
                    <span class="bg-gray-100 text-gray-500 text-xs font-bold px-3 py-2 border border-r-0 border-gray-300 rounded-l-lg">D</span>
                    <input type="text" placeholder="Option 4" class="w-full px-3 py-2 border border-gray-300 rounded-r-lg focus:ring-1 focus:ring-blue-500 outline-none" value="${q.options[3]}" oninput="updateQuestion(${i}, 'opt_3', this.value)">
                </div>
            </div>
            
            <div class="flex items-center gap-3 bg-blue-50 p-3 rounded-lg border border-blue-100">
                <label class="text-sm font-bold text-blue-800 flex items-center gap-1.5">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    Correct Answer:
                </label>
                <select onchange="updateQuestion(${i}, 'correct', parseInt(this.value))" class="flex-grow border border-gray-300 rounded bg-white px-3 py-1.5 focus:ring-2 focus:ring-blue-500 outline-none font-medium">
                    <option value="0" ${q.correct === 0 ? 'selected' : ''}>A. Option 1</option>
                    <option value="1" ${q.correct === 1 ? 'selected' : ''}>B. Option 2</option>
                    <option value="2" ${q.correct === 2 ? 'selected' : ''}>C. Option 3</option>
                    <option value="3" ${q.correct === 3 ? 'selected' : ''}>D. Option 4</option>
                </select>
            </div>
        `;
        container.appendChild(qDiv);
    });
}

window.saveTest = async () => {
    const title = document.getElementById('testTitle').value.trim();
    const desc = document.getElementById('testDescription').value.trim();
    const type = document.getElementById('testType').value;
    
    if (!title) {
        alert("Please add a title for the test.");
        document.getElementById('testTitle').focus();
        return;
    }
    if (questions.length === 0) {
        alert("Please add at least one question.");
        return;
    }
    // Basic validation
    for(let i=0; i<questions.length; i++) {
        if(!questions[i].text.trim()) { alert(`Question ${i+1} is missing text.`); return; }
        for(let j=0; j<4; j++) {
            if(!questions[i].options[j].trim()) { alert(`Question ${i+1} Option ${String.fromCharCode(65+j)} is empty.`); return; }
        }
    }
    
    const btn = document.getElementById('publishBtn');
    const btnTextEl = document.getElementById('publishBtnText');
    btnTextEl.textContent = 'Saving to Database...';
    btn.disabled = true;
    btn.classList.add('opacity-75', 'cursor-not-allowed');

    try {
        const payload = {
            title: title,
            description: desc,
            type: type,
            questions: questions,
            createdAt: editingTestId ? undefined : Date.now()
        };

        // Add external link if provided
        const externalLink = document.getElementById('externalLinkUrl').value.trim();
        const externalLinkText = document.getElementById('externalLinkText').value.trim();
        if (externalLink) {
            payload.externalLink = externalLink;
            payload.externalLinkText = externalLinkText || 'Study Material Available';
        } else {
            payload.externalLink = null;
            payload.externalLinkText = null;
        }

        if (editingTestId) {
            // UPDATE existing test
            // Preserve original createdAt
            const existingSnap = await get(ref(db, `mock_tests/${editingTestId}`));
            if (existingSnap.exists()) {
                payload.createdAt = existingSnap.val().createdAt || Date.now();
            } else {
                payload.createdAt = Date.now();
            }
            payload.updatedAt = Date.now();
            await set(ref(db, `mock_tests/${editingTestId}`), payload);
            alert('Test updated successfully!');
        } else {
            // CREATE new test
            payload.createdAt = Date.now();
            const testsRef = ref(db, 'mock_tests');
            const newTestRef = push(testsRef);
            await set(newTestRef, payload);
            alert('Test published successfully!');
            analyticsTestsCount++;
            document.getElementById('statTests').textContent = analyticsTestsCount;
        }

        // Reset form
        editingTestId = null;
        document.getElementById('testTitle').value = '';
        document.getElementById('testDescription').value = '';
        document.getElementById('testType').value = 'practice';
        document.getElementById('externalLinkUrl').value = '';
        document.getElementById('externalLinkText').value = '';
        questions = [];
        renderQuestions();
        setFormMode('create');
        
    } catch (err) {
        alert("Error saving test: " + err.message);
        setFormMode(editingTestId ? 'edit' : 'create', editingTestId ? title : null);
    } finally {
        btn.classList.remove('opacity-75', 'cursor-not-allowed');
        btn.disabled = false;
    }
};

window.loadResults = () => {
    const resultsRef = ref(db, 'mock_results');
    onValue(resultsRef, (snapshot) => {
        const data = snapshot.val();
        let rowsHtml = '';
        let tempResults = [];
        
        if (data) {
            // Normalize data for sorting
            Object.keys(data).forEach(uid => {
                const userResults = data[uid];
                Object.keys(userResults).forEach(resId => {
                    const res = userResults[resId];
                    tempResults.push({
                        email: res.userEmail || uid,
                        title: res.testTitle || 'Unknown Test',
                        score: res.score,
                        total: res.total,
                        date: res.date,
                        // Calculate percentage for color coding
                        percent: res.total > 0 ? (res.score / res.total) * 100 : 0
                    });
                });
            });
            
            analyticsAttemptsCount = tempResults.length;
            document.getElementById('statAttempts').textContent = analyticsAttemptsCount;

            // Sort by newest first
            tempResults.sort((a,b) => b.date - a.date);

            tempResults.forEach(res => {
                const dateObj = new Date(res.date);
                const dateStr = dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' });
                const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                
                let badgeColor = 'bg-yellow-100 text-yellow-800';
                if(res.percent >= 80) badgeColor = 'bg-green-100 text-green-800';
                else if(res.percent < 40) badgeColor = 'bg-red-100 text-red-800';
                
                rowsHtml += `
                    <tr class="hover:bg-blue-50/50 transition-colors group">
                        <td class="px-6 py-4 whitespace-nowrap">
                            <div class="flex items-center">
                                <div class="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs uppercase shadow-sm">
                                    ${res.email.substring(0,2)}
                                </div>
                                <div class="ml-3">
                                    <div class="text-sm font-bold text-gray-900 truncate max-w-[140px]" title="${res.email}">${res.email}</div>
                                    <div class="text-xs text-gray-500">${dateStr} <span class="opacity-0 group-hover:opacity-100 transition-opacity">&bull; ${timeStr}</span></div>
                                </div>
                            </div>
                        </td>
                        <td class="px-6 py-4">
                            <div class="text-sm font-medium text-gray-900 truncate max-w-[180px]" title="${res.title}">${res.title}</div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-right">
                            <div class="inline-flex items-center px-2.5 py-1 rounded-md font-bold text-sm ${badgeColor}">
                                ${res.score} / ${res.total}
                            </div>
                            <div class="text-[10px] text-gray-400 font-medium mt-1 uppercase w-full text-right pr-2">${res.percent.toFixed(0)}% Correct</div>
                        </td>
                    </tr>
                `;
            });
        }
        
        if(!rowsHtml) rowsHtml = `
            <tr><td colspan="3" class="px-6 py-12 text-center text-gray-500">
                <div class="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                    <svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path></svg>
                </div>
                <p class="font-medium text-gray-900">No attempts yet</p>
                <p class="text-sm text-gray-400">Student scores will appear here when they submit tests.</p>
            </td></tr>
        `;
        
        document.getElementById('resultsTableBody').innerHTML = rowsHtml;
    });
}

window.fetchTotalTestsCount = function() {
    const testsRef = ref(db, 'mock_tests');
    onValue(testsRef, (snapshot) => {
        const data = snapshot.val();
        analyticsTestsCount = data ? Object.keys(data).length : 0;
        document.getElementById('statTests').textContent = analyticsTestsCount;
        renderExistingTests(data);
    });
}

function renderExistingTests(data) {
    const container = document.getElementById('existingTestsContainer');
    if (!data) {
        container.innerHTML = `<p class="text-gray-400 text-sm col-span-full text-center py-6">No tests created yet.</p>`;
        return;
    }

    let html = '';
    const tests = Object.keys(data).map(id => ({ id, ...data[id] }));
    tests.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    tests.forEach(test => {
        const qCount = test.questions ? test.questions.length : 0;
        const isMock = test.type === 'mock';
        const typeBadge = isMock
            ? '<span class="text-[10px] font-bold bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">Mock</span>'
            : '<span class="text-[10px] font-bold bg-green-100 text-green-700 px-1.5 py-0.5 rounded">Practice</span>';
        const isEditing = editingTestId === test.id;

        html += `
            <div class="relative p-3 rounded-xl border ${isEditing ? 'border-amber-300 bg-amber-50/50' : 'border-gray-200 bg-white hover:border-blue-200'} transition group">
                <div class="flex items-start justify-between mb-2">
                    <h4 class="text-sm font-bold text-gray-900 line-clamp-1 flex-grow pr-2">${test.title}</h4>
                    ${typeBadge}
                </div>
                <p class="text-xs text-gray-500 mb-3">${qCount} questions${test.externalLink ? ' · 🔗 Has promo link' : ''}</p>
                <div class="flex gap-2">
                    <button onclick="loadTestForEdit('${test.id}')" class="flex-1 text-xs font-bold py-1.5 px-2 rounded-lg ${isEditing ? 'bg-amber-200 text-amber-800' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'} transition flex items-center justify-center gap-1">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                        ${isEditing ? 'Editing...' : 'Edit'}
                    </button>
                    <button onclick="deleteTest('${test.id}', '${test.title.replace(/'/g, "\\'").replace(/"/g, '&quot;')}')" class="text-xs font-bold py-1.5 px-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition flex items-center justify-center gap-1">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        Delete
                    </button>
                </div>
            </div>`;
    });

    container.innerHTML = html;
}
