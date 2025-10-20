document.addEventListener('DOMContentLoaded', () => {
    const grid = document.getElementById('resource-grid');
    const searchInput = document.getElementById('search-input');
    const filterContainer = document.getElementById('filter-buttons');
    const sortDropdown = document.getElementById('sort-dropdown');
    const noResults = document.getElementById('no-results');
    const loadingSpinner = document.getElementById('loading-spinner');

    const paginationContainer = document.getElementById('pagination-container');

    let resources = [];
    let currentPage = 1;
    const itemsPerPage = 9; // 9 items per page for a 3-column grid

    const categories = [
        { id: 'all', name: 'All' },
        { id: 'notes', name: 'Notes' },
        { id: 'question-bank', name: 'Question Banks' },
        { id: 'micro-project', name: 'Micro-Projects' },
        { id: 'subject-guide', name: 'Subject Guides' },
        { id: 'lab-manual', name: 'Lab Manuals' },
    ];

    async function fetchResources() {
        try {
            const response = await fetch('/Notes/resources.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            resources = await response.json();
            return resources;
        } catch (error) {
            console.error("Could not fetch resources:", error);
            grid.innerHTML = `<p class="col-span-full text-center text-red-500">Failed to load resources. Please try again later.</p>`;
            return [];
        }
    }

    function renderResources(filteredResources, searchTerm = '') {
        grid.innerHTML = '';
        if (filteredResources.length === 0) {
            noResults.classList.remove('hidden');
        } else {
            noResults.classList.add('hidden');
        }

        const highlightText = (text, term) => {
            if (!term.trim()) {
                return text;
            }
            // Escape special characters in the term for the regex
            const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(`(${escapedTerm})`, 'gi');
            return text.replace(regex, `<mark>$1</mark>`);
        };

        filteredResources.forEach(resource => {
            const card = document.createElement('div');
            card.className = 'note-card'; // Use the global .note-card style

            const highlightedTitle = highlightText(resource.title, searchTerm);
            const highlightedDescription = highlightText(resource.description, searchTerm);

            const tagsHTML = resource.tags.map(tag => `<span class="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-full">${highlightText(tag, searchTerm)}</span>`).join(' ');
            const hasSpecificThumbnail = resource.thumbnail && !resource.thumbnail.includes('MSBTE%20NOTES%20AND%20INFORMATION.png');

            let imageHTML;
            if (hasSpecificThumbnail) {
                imageHTML = `<img src="${resource.thumbnail}" alt="${resource.title}" class="rounded-lg mb-4 w-full h-40 object-cover" loading="lazy">`;
            } else {
                const colors = [
                    ['#a855f7', '#6366f1'], ['#f59e0b', '#ef4444'], ['#10b981', '#059669'],
                    ['#3b82f6', '#2563eb'], ['#ec4899', '#d946ef']
                ];
                const colorPair = colors[Math.floor(Math.random() * colors.length)];
                const iconPaths = {
                    'notes': 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
                    'question-bank': 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01',
                    'micro-project': 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z',
                    'subject-guide': 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
                    'lab-manual': 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.977l-.51.342a6 6 0 01-3.86.977l-2.387.477a2 2 0 00-1.022.547m3.234-1.234a6 6 0 013.86-.977l1.022.204a2 2 0 011.022.547m-3.234-1.234a6 6 0 00-3.86.977l-1.022.204a2 2 0 00-1.022.547m10.234-4.234a6 6 0 01-3.86-.977l-.51-.342a6 6 0 00-3.86-.977l-2.387-.477a2 2 0 00-1.022.547m3.234-1.234a6 6 0 013.86-.977l1.022.204a2 2 0 011.022.547m-3.234-1.234a6 6 0 00-3.86.977l-1.022.204a2 2 0 00-1.022.547'
                };
                const iconPath = iconPaths[resource.category] || iconPaths['notes'];

                imageHTML = `
                    <div class="rounded-lg mb-4 w-full h-40 flex items-center justify-center text-white p-4" style="background: linear-gradient(135deg, ${colorPair[0]}, ${colorPair[1]})">
                        <div class="text-center">
                            <svg class="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${iconPath}"></path></svg>
                            <span class="text-sm font-semibold break-words">${highlightedTitle}</span>
                        </div>
                    </div>
                `;
            }

            card.innerHTML = `
                <a href="${resource.url}" class="flex flex-col h-full">
                    ${imageHTML}
                    <div class="flex-grow flex flex-col">
                        <h3 class="text-lg font-semibold text-blue-600 mb-2">${highlightedTitle}</h3>
                        <p class="text-sm text-gray-600 mb-4 flex-grow">${highlightedDescription}</p>
                        <div class="flex flex-wrap gap-2 mt-auto pt-4 border-t border-gray-100">
                            ${tagsHTML}
                        </div>
                    </div>
                </a>
            `;
            grid.appendChild(card);
        });
    }

    function filterAndRender() {
        const searchTerm = searchInput.value.toLowerCase();
        const category = filterContainer.querySelector('.active')?.dataset.filter || 'all';
        const sortValue = sortDropdown.value;

        let filtered = resources.filter(resource => {
            const matchesCategory = category === 'all' || resource.category === category;
            const matchesSearch = resource.title.toLowerCase().includes(searchTerm) ||
                resource.description.toLowerCase().includes(searchTerm) ||
                resource.tags.some(tag => tag.toLowerCase().includes(searchTerm));
            return matchesCategory && matchesSearch;
        });

        // Sorting logic
        switch (sortValue) {
            case 'title-asc':
                filtered.sort((a, b) => a.title.localeCompare(b.title));
                break;
            case 'title-desc':
                filtered.sort((a, b) => b.title.localeCompare(a.title));
                break;
            case 'date-asc':
                filtered.sort((a, b) => new Date(a.dateAdded) - new Date(b.dateAdded));
                break;
            case 'date-desc':
            default:
                filtered.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
                break;
        }

        const paginatedItems = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

        renderResources(paginatedItems, searchTerm);
        renderPagination(filtered.length);
    }

    function renderPagination(totalItems) {
        paginationContainer.innerHTML = '';
        const totalPages = Math.ceil(totalItems / itemsPerPage);

        if (totalPages <= 1) return;

        // Previous Button
        const prevButton = document.createElement('button');
        prevButton.innerHTML = '&laquo; Prev';
        prevButton.className = 'pagination-btn';
        prevButton.setAttribute('aria-label', 'Go to previous page');
        prevButton.disabled = currentPage === 1;
        prevButton.addEventListener('click', () => { if (currentPage > 1) { currentPage--; filterAndRender(); } });
        paginationContainer.appendChild(prevButton);

        // Page Number Buttons
        for (let i = 1; i <= totalPages; i++) {
            const pageButton = document.createElement('button');
            pageButton.textContent = i;
            pageButton.setAttribute('aria-label', `Go to page ${i}`);
            pageButton.className = 'pagination-btn';
            if (i === currentPage) { pageButton.classList.add('active'); }
            pageButton.addEventListener('click', () => { currentPage = i; filterAndRender(); });
            paginationContainer.appendChild(pageButton);
        }

        // Next Button
        const nextButton = document.createElement('button');
        nextButton.innerHTML = 'Next &raquo;';
        nextButton.className = 'pagination-btn';
        nextButton.setAttribute('aria-label', 'Go to next page');
        nextButton.disabled = currentPage === totalPages;
        nextButton.addEventListener('click', () => { if (currentPage < totalPages) { currentPage++; filterAndRender(); } });
        paginationContainer.appendChild(nextButton);
    }

    function setupFilters() {
        categories.forEach(cat => {
            const button = document.createElement('button');
            button.textContent = cat.name;
            button.dataset.filter = cat.id;
            button.className = 'filter-btn';
            if (cat.id === 'all') {
                button.classList.add('active');
            }
            filterContainer.appendChild(button);
        });

        filterContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('filter-btn')) {
                filterContainer.querySelector('.active').classList.remove('active');
                e.target.classList.add('active');
                currentPage = 1; // Reset to first page on filter change
                filterAndRender();
            }
        });
    }

    async function init() {
        setupFilters();
        searchInput.addEventListener('input', () => {
            currentPage = 1; // Reset to first page on search
            filterAndRender();
        });
        sortDropdown.addEventListener('change', () => {
            currentPage = 1; // Reset to first page on sort change
            filterAndRender();
        });

        await fetchResources();
        loadingSpinner.classList.add('hidden');
        filterAndRender(); // Use filterAndRender to handle initial state correctly
    }

    init();
});

function toggleMobileMenu() {
    const menu = document.getElementById('mobileNav');
    const button = document.querySelector('button[onclick="toggleMobileMenu()"]');
    menu.classList.toggle('hidden');
    const isExpanded = !menu.classList.contains('hidden');
    button.setAttribute('aria-expanded', isExpanded);
    menu.setAttribute('aria-hidden', !isExpanded);
}