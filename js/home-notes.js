document.addEventListener('DOMContentLoaded', () => {
    const grid = document.getElementById('notesGrid');
    const paginationContainer = document.getElementById('pagination-container');
    const loadingSpinner = document.getElementById('loading-spinner');

    // Search and Filter Elements
    // Note: We are reusing the existing inputs in index.html which call inline functions like searchNotes() and filterNotes().
    // We should override these or attach event listeners to replace them.
    // The existing HTML has `oninput="searchNotes()"` and `onclick="filterNotes('...')"`.
    // We will attach listeners to these elements to handle the dynamic logic.

    const itemsPerPage = 9;
    let currentPage = 1;
    let allResources = [];
    let currentFilter = 'notes'; // Default to Study Notes as per original design
    let currentSearch = '';

    // Dynamic Root Path Logic
    const scriptTag = document.getElementById('home-notes-script');
    const rootPath = scriptTag ? (scriptTag.getAttribute('data-root') || './') : './';

    // Fetch Data
    async function fetchResources() {
        try {
            // We use the same JSON source with dynamic root
            const response = await fetch(`${rootPath}Notes/resources.json`);
            if (!response.ok) throw new Error('Failed to load resources');
            const data = await response.json();
            allResources = data;

            // Initial Render
            filterAndRender();
        } catch (error) {
            console.error(error);
            grid.innerHTML = '<p class="col-span-full text-center text-red-500">Failed to load resources.</p>';
        }
    }

    // Filter and Render Logic
    function filterAndRender() {
        // Filter
        let filtered = allResources.filter(item => {
            // Category Match
            // Map our specific UI categories to JSON categories
            // UI: notes, papers, answers, other
            // JSON: notes, question-bank, answer-sheet, micro-project, subject-guide, lab-manual

            let itemCategory = item.category;
            // Normalize categories
            if (currentFilter === 'notes') {
                return itemCategory === 'notes' || itemCategory === 'subject-guide';
            } else if (currentFilter === 'papers') {
                return itemCategory === 'question-bank';
            } else if (currentFilter === 'answers') {
                return itemCategory === 'answer-sheet' || itemCategory === 'solution'; // flexible matching
            } else if (currentFilter === 'other') {
                return itemCategory === 'micro-project' || itemCategory === 'lab-manual';
            }
            return true;
        });

        // Search Match
        if (currentSearch) {
            const term = currentSearch.toLowerCase();
            filtered = filtered.filter(item =>
                item.title.toLowerCase().includes(term) ||
                (item.tags && item.tags.some(t => t.toLowerCase().includes(term)))
            );
        }

        // Pagination
        const totalItems = filtered.length;
        const totalPages = Math.ceil(totalItems / itemsPerPage);

        // Ensure valid page
        if (currentPage > totalPages) currentPage = 1;

        const startIndex = (currentPage - 1) * itemsPerPage;
        const itemsToShow = filtered.slice(startIndex, startIndex + itemsPerPage);

        renderGrid(itemsToShow);
        renderPagination(totalPages);
    }

    function renderGrid(items) {
        grid.innerHTML = '';
        if (items.length === 0) {
            grid.innerHTML = '<div class="col-span-full text-center py-10 text-gray-500">No resources found for this category.</div>';
            return;
        }

        items.forEach(item => {
            const card = document.createElement('div');
            // Determining styles based on category/type
            // We mimic the exact styles from the verified HTML design

            let colorTheme = 'blue';
            let iconSVG = '';
            let badgeText = 'Resource';

            if (item.category === 'notes' || item.category === 'subject-guide') {
                colorTheme = 'blue';
                badgeText = 'Note';
                iconSVG = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>`;
            } else if (item.category === 'question-bank') {
                colorTheme = 'red';
                badgeText = 'Exam Prep';
                iconSVG = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>`;
            } else if (item.category === 'answer-sheet') {
                colorTheme = 'yellow';
                badgeText = 'Solution';
                iconSVG = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>`;
            } else {
                colorTheme = 'purple';
                badgeText = 'Idea';
                iconSVG = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>`;
            }

            // Tailwind dynamic classes (safely mapped)
            const bgLight = `bg-${colorTheme}-50`;
            const textDark = `text-${colorTheme}-600`;
            const textDarker = `text-${colorTheme}-700`;
            const hoverText = `group-hover:text-${colorTheme}-600`;
            const groupHoverBg = `group-hover:bg-${colorTheme}-600`;

            // Tags HTML
            const tagsHtml = item.tags.slice(0, 2).map(tag =>
                `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">${tag}</span>`
            ).join('');

            card.className = `note-card ${currentFilter} group bg-white rounded-2xl border border-gray-100 p-7 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 relative overflow-hidden flex flex-col h-full`;

            card.innerHTML = `
                <div class="absolute top-0 right-0 p-4 -mr-4 -mt-4 opacity-5 group-hover:opacity-10 transition-opacity duration-500">
                   <svg class="w-24 h-24 ${textDark}" fill="currentColor" viewBox="0 0 24 24"><path d="M4 19.5v-15A2.5 2.5 0 016.5 2H20v20H6.5a2.5 2.5 0 01-0-2.5z"/></svg> 
                </div>
                <div class="flex items-center gap-3 mb-5 relative z-10">
                    <div class="p-3 ${bgLight} rounded-xl ${textDark} ${groupHoverBg} group-hover:text-white transition-colors duration-300">
                       <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">${iconSVG}</svg>
                    </div>
                    <span class="text-xs font-bold px-2.5 py-1 ${bgLight} ${textDarker} rounded-lg uppercase tracking-wider">${badgeText}</span>
                </div>
                <h3 class="font-display font-bold text-xl text-gray-900 mb-3 ${hoverText} transition-colors line-clamp-2">${item.title}</h3>
                <div class="flex flex-wrap gap-2 mb-6">
                    ${tagsHtml}
                </div>
                <div class="mt-auto">
                   <a href="${item.url}" class="flex items-center justify-center w-full py-3 px-4 bg-gray-50 border border-gray-100 hover:bg-${colorTheme}-600 hover:text-white hover:border-transparent text-gray-700 font-semibold rounded-xl transition-all duration-300 group-hover:shadow-lg">
                      View Resource
                      <svg class="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                   </a>
                </div>
            `;
            grid.appendChild(card);
        });
    }

    function renderPagination(totalPages) {
        paginationContainer.innerHTML = '';
        if (totalPages <= 1) return;

        // Simple Prev/Next logic for clarity
        const createBtn = (text, page, disabled) => {
            const btn = document.createElement('button');
            btn.className = `px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${disabled ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50 hover:text-blue-600 border-gray-300'}`;
            btn.innerHTML = text;
            btn.disabled = disabled;
            if (!disabled) {
                btn.onclick = () => {
                    currentPage = page;
                    filterAndRender();
                    document.getElementById('notes').scrollIntoView({ behavior: 'smooth' });
                };
            }
            return btn;
        };

        paginationContainer.appendChild(createBtn('Previous', currentPage - 1, currentPage === 1));

        // Page info
        const info = document.createElement('span');
        info.className = 'px-4 py-2 text-sm text-gray-600';
        info.innerText = `Page ${currentPage} of ${totalPages}`;
        paginationContainer.appendChild(info);

        paginationContainer.appendChild(createBtn('Next', currentPage + 1, currentPage === totalPages));
    }

    // Initialize Global Functions for HTML Buttons
    window.filterNotes = function (category) {
        currentFilter = category;
        currentPage = 1;

        // Update Active Tab State
        document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active', 'bg-blue-600', 'text-white', 'shadow-md'));
        const activeBtn = document.getElementById(`btn-${category}`);
        if (activeBtn) {
            activeBtn.classList.add('active', 'bg-blue-600', 'text-white', 'shadow-md');
            // Remove defaults
            activeBtn.classList.remove('bg-white', 'text-gray-600');
        }

        // Reset others
        document.querySelectorAll('.filter-btn:not(.active)').forEach(btn => {
            btn.classList.add('bg-white', 'text-gray-600');
            btn.classList.remove('bg-blue-600', 'text-white', 'shadow-md');
        });

        filterAndRender();
    };

    window.searchNotes = function () {
        const input = document.getElementById('searchInput');
        currentSearch = input.value;
        currentPage = 1;
        filterAndRender();
    };

    // Load Data
    fetchResources();
});
