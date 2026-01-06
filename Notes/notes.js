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
            const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(`(${escapedTerm})`, 'gi');
            return text.replace(regex, `<mark>$1</mark>`);
        };

        filteredResources.forEach((resource, index) => {
            const card = document.createElement('div');
            card.className = 'bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full note-card-enter';
            card.style.animationDelay = `${index * 50}ms`; // Staggered animation

            const highlightedTitle = highlightText(resource.title, searchTerm);
            const highlightedDescription = highlightText(resource.description, searchTerm);

            // Pastel tags
            const tagsHTML = resource.tags.map(tag => `
                <span class="text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-md bg-blue-50 text-blue-600 border border-blue-100">
                    ${highlightText(tag, searchTerm)}
                </span>
            `).join('');

            const hasSpecificThumbnail = resource.thumbnail && !resource.thumbnail.includes('MSBTE%20NOTES%20AND%20INFORMATION.png');

            let imageHTML;
            if (hasSpecificThumbnail) {
                imageHTML = `
                    <div class="h-48 w-full overflow-hidden bg-gray-50 border-b border-gray-100 group">
                        <img src="${resource.thumbnail}" alt="${resource.title}" class="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500" loading="lazy">
                    </div>
                `;
            } else {
                const colors = [
                    ['#EEF2FF', '#4F46E5'], // Indigo
                    ['#ECFDF5', '#10B981'], // Emerald
                    ['#EFF6FF', '#3B82F6'], // Blue
                    ['#FAF5FF', '#A855F7'], // Purple
                    ['#FFF1F2', '#F43F5E']  // Rose
                ];
                // Deterministic color based on title length
                const colorIndex = resource.title.length % colors.length;
                const [bgColor, iconColor] = colors[colorIndex];

                const iconPaths = {
                    'notes': 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
                    'question-bank': 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01',
                    'micro-project': 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z',
                    'subject-guide': 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
                    'lab-manual': 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.977l-.51.342a6 6 0 01-3.86.977l-2.387.477a2 2 0 00-1.022.547m3.234-1.234a6 6 0 013.86-.977l1.022.204a2 2 0 011.022.547m-3.234-1.234a6 6 0 00-3.86.977l-1.022.204a2 2 0 00-1.022.547m10.234-4.234a6 6 0 01-3.86-.977l-.51-.342a6 6 0 00-3.86-.977l-2.387-.477a2 2 0 00-1.022.547m3.234-1.234a6 6 0 013.86-.977l1.022.204a2 2 0 011.022.547m-3.234-1.234a6 6 0 00-3.86.977l-1.022.204a2 2 0 00-1.022.547'
                };
                const iconPath = iconPaths[resource.category] || iconPaths['notes'];

                imageHTML = `
                    <div class="h-48 w-full flex items-center justify-center border-b border-gray-100" style="background-color: ${bgColor}">
                        <div class="text-center p-4">
                            <div class="w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center bg-white shadow-sm">
                                <svg class="w-6 h-6" style="color: ${iconColor}" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${iconPath}"></path>
                                </svg>
                            </div>
                            <span class="text-xs font-bold uppercase tracking-wide" style="color: ${iconColor}">${resource.category.replace('-', ' ')}</span>
                        </div>
                    </div>
                `;
            }

            card.innerHTML = `
                <a href="${resource.url}" class="flex flex-col h-full group">
                    ${imageHTML}
                    <div class="p-5 flex-grow flex flex-col">
                        <h3 class="text-lg font-bold text-gray-900 mb-2 leading-snug group-hover:text-blue-600 transition-colors line-clamp-2">${highlightedTitle}</h3>
                        <p class="text-sm text-gray-500 mb-4 line-clamp-3">${highlightedDescription}</p>
                        <div class="flex flex-wrap gap-2 mt-auto">
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