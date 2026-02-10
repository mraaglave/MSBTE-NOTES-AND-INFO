document.addEventListener('DOMContentLoaded', () => {
    // Shared state
    let allBlogPosts = [];

    // --- SECTION 1: Featured + List Logic (Top) ---
    const featuredPost = document.getElementById('featuredPostTop');
    const recentPostsList = document.getElementById('recentPostsListTop');
    let s1_currentIndex = 1;
    let s1_postsPerLoad = 4;
    let s1_isLoading = false;

    // --- SECTION 2: Grid + Pagination + Search Logic (Bottom - Authentic) ---
    const s2_blogContainer = document.getElementById('blogContainer');
    const s2_paginationContainer = document.getElementById('blogPagination');
    const s2_searchInput = document.getElementById('blogSearch');
    let s2_currentPage = 1;
    let s2_postsPerPage = 6;
    let s2_filteredPosts = [];

    // Helper to extract date from dateAndReadTime string
    function extractDate(dateString) {
        try {
            const datePart = dateString.split('·')[0].trim();
            return new Date(datePart);
        } catch (e) {
            return new Date(0);
        }
    }

    // Helper function to extract category from keywords
    function extractCategory(keywords) {
        if (!keywords || keywords.length === 0) return 'News & Updates';
        const categoryMap = {
            'result': 'News & Updates',
            'marksheet': 'News & Updates',
            'sppu': 'News & Updates',
            'msbte': 'News & Updates',
            'scholarship': 'Guidance & Strategy',
            'coaching': 'Guidance & Strategy',
            'exam': 'Guidance & Strategy',
            'job': 'Career',
            'internship': 'Career',
            'engineering': 'Education',
            'course': 'Education'
        };
        for (const keyword of keywords) {
            const keywordLower = keyword.toLowerCase();
            for (const [key, value] of Object.entries(categoryMap)) {
                if (keywordLower.includes(key)) return value;
            }
        }
        return 'News & Updates';
    }

    // --- SECTION 1 FUNCTIONS ---

    function createFeaturedCard(post) {
        const category = extractCategory(post.keywords || []);
        const date = post.dateAndReadTime.split('·')[0].trim();
        const readTime = post.dateAndReadTime.split('·')[1]?.trim() || '';
        const primaryKeyword = post.keywords && post.keywords[0] ? post.keywords[0] : '';

        return `
            <a href="${post.url}" class="block group h-full">
                <div class="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 h-full flex flex-col">
                    <div class="relative aspect-video overflow-hidden bg-gray-100">
                        <img src="${post.image}" alt="${post.imageAlt || post.title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22800%22 height=%22450%22%3E%3Crect fill=%22%23e5e7eb%22 width=%22800%22 height=%22450%22/%3E%3C/svg%3E'" />
                        <div class="absolute top-4 left-4">
                            <span class="inline-block px-4 py-2 bg-orange-500 text-white rounded-full text-sm font-medium shadow-lg">${category}</span>
                        </div>
                    </div>
                    <div class="p-4 md:p-6 flex-1 flex flex-col">
                        ${primaryKeyword ? `<div class="mb-2"><span class="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">${primaryKeyword}</span></div>` : ''}
                        <h3 class="text-lg md:text-2xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 line-clamp-2">${post.shortTitle || post.title}</h3>
                        <p class="text-gray-600 text-sm md:text-base mb-3 line-clamp-3 flex-1">${post.description}</p>
                        <div class="flex flex-wrap items-center gap-2 md:gap-3 pt-3 border-t border-gray-100">
                            <span class="text-gray-500 text-xs md:text-sm">${date}</span>
                            ${readTime ? `<span class="text-gray-400">•</span><span class="text-gray-500 text-xs md:text-sm">${readTime}</span>` : ''}
                            <span class="ml-auto text-blue-600 font-medium text-sm group-hover:text-blue-700">Read More →</span>
                        </div>
                    </div>
                </div>
            </a>`;
    }

    function createHorizontalCard(post) {
        const category = extractCategory(post.keywords || []);
        const date = post.dateAndReadTime.split('·')[0].trim();
        const readTime = post.dateAndReadTime.split('·')[1]?.trim() || '';
        const primaryKeyword = post.keywords && post.keywords[0] ? post.keywords[0] : '';

        return `
            <a href="${post.url}" class="block group">
                <div class="bg-white rounded-xl overflow-hidden shadow hover:shadow-lg transition-all duration-300 flex gap-3 p-3">
                    <div class="flex-shrink-0 w-28 sm:w-32 md:w-36 relative aspect-video overflow-hidden rounded-lg bg-gray-100">
                        <img src="${post.image}" alt="${post.imageAlt || post.title}" class="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22160%22 height=%2290%22%3E%3Crect fill=%22%23e5e7eb%22 width=%22160%22 height=%2290%22/%3E%3C/svg%3E'" />
                    </div>
                    <div class="flex-1 min-w-0 flex flex-col justify-between py-1">
                        <div>
                            <div class="flex flex-wrap items-center gap-1.5 mb-1.5">
                                <span class="inline-block px-2 py-0.5 bg-orange-100 text-orange-600 rounded text-xs font-medium">${category}</span>
                                ${primaryKeyword ? `<span class="inline-block px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-xs">${primaryKeyword}</span>` : ''}
                            </div>
                            <h4 class="text-sm md:text-base font-semibold text-gray-900 group-hover:text-blue-600 line-clamp-2 leading-snug mb-1">${post.shortTitle || post.title}</h4>
                            <p class="text-xs text-gray-600 line-clamp-1 hidden sm:block">${post.description}</p>
                        </div>
                        <div class="flex items-center gap-1.5 text-xs text-gray-500 mt-1"><span>${date}</span>${readTime ? `<span>•</span><span>${readTime}</span>` : ''}</div>
                    </div>
                </div>
            </a>`;
    }

    function s1_loadMorePosts() {
        if (s1_currentIndex >= allBlogPosts.length) return;
        const endIndex = s1_currentIndex + s1_postsPerLoad;
        const postsToLoad = allBlogPosts.slice(s1_currentIndex, endIndex);
        postsToLoad.forEach(post => {
            const cardHTML = createHorizontalCard(post);
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = cardHTML;
            recentPostsList.appendChild(tempDiv.firstElementChild);
        });
        s1_currentIndex = endIndex;
        s1_isLoading = false;
    }

    function s1_setup() {
        if (!featuredPost || !recentPostsList) return;
        featuredPost.innerHTML = createFeaturedCard(allBlogPosts[0]);
        recentPostsList.innerHTML = '';
        s1_loadMorePosts();
        recentPostsList.addEventListener('scroll', () => {
            if (recentPostsList.scrollTop + recentPostsList.clientHeight >= recentPostsList.scrollHeight - 100 && !s1_isLoading && s1_currentIndex < allBlogPosts.length) {
                s1_isLoading = true;
                setTimeout(s1_loadMorePosts, 300);
            }
        });
    }

    // --- SECTION 2 FUNCTIONS (Authentic Style) ---

    function createGridCard(post) {
        return `
            <div class="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col h-full hover:shadow-2xl transition duration-300 transform hover:-translate-y-2 group">
                <div class="relative overflow-hidden h-48 sm:h-56">
                    <img src="${post.image}" alt="${post.imageAlt || post.title}" class="w-full h-full object-cover group-hover:scale-110 transition duration-500" loading="lazy">
                    <div class="absolute top-4 left-4">
                        <span class="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-md opacity-90 group-hover:opacity-100 transition duration-300">
                            ${post.keywords && post.keywords.length > 0 ? post.keywords[0] : 'Blog'}
                        </span>
                    </div>
                </div>
                <div class="p-6 flex flex-col flex-grow">
                    <div class="flex items-center text-xs text-blue-500 font-semibold mb-3">
                        <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                        </svg>
                        ${post.dateAndReadTime.split('·')[0].trim()}
                    </div>
                    <h3 class="text-xl font-bold text-gray-800 mb-3 group-hover:text-blue-600 transition duration-300 leading-snug line-clamp-2">
                        ${post.title}
                    </h3>
                    <p class="text-gray-600 text-sm mb-6 line-clamp-3 leading-relaxed">
                        ${post.description}
                    </p>
                    <div class="mt-auto">
                        <a href="${post.url}" class="inline-flex items-center text-blue-600 font-bold text-sm group-hover:underline">
                            Read More
                            <svg class="w-4 h-4 ml-2 group-hover:translate-x-1 transition duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path>
                            </svg>
                        </a>
                    </div>
                </div>
            </div>`;
    }

    function s2_renderGrid() {
        if (!s2_blogContainer) return;
        const start = (s2_currentPage - 1) * s2_postsPerPage;
        const end = start + s2_postsPerPage;
        const postsToDisplay = s2_filteredPosts.slice(start, end);

        s2_blogContainer.innerHTML = postsToDisplay.length > 0 ?
            postsToDisplay.map(post => createGridCard(post)).join('') :
            '<p class="text-center text-gray-500 col-span-full py-10">No blog posts found matching your search.</p>';

        s2_renderPagination();
    }

    function s2_renderPagination() {
        if (!s2_paginationContainer) return;
        const totalPages = Math.ceil(s2_filteredPosts.length / s2_postsPerPage);
        if (totalPages <= 1) {
            s2_paginationContainer.innerHTML = '';
            return;
        }

        let html = `<button class="pagination-btn" ${s2_currentPage === 1 ? 'disabled' : ''} data-page="${s2_currentPage - 1}">Prev</button>`;
        for (let i = 1; i <= totalPages; i++) {
            html += `<button class="pagination-btn ${s2_currentPage === i ? 'active' : ''}" data-page="${i}">${i}</button>`;
        }
        html += `<button class="pagination-btn" ${s2_currentPage === totalPages ? 'disabled' : ''} data-page="${s2_currentPage + 1}">Next</button>`;
        s2_paginationContainer.innerHTML = html;

        s2_paginationContainer.querySelectorAll('.pagination-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const page = parseInt(btn.dataset.page);
                if (page && page !== s2_currentPage) {
                    s2_currentPage = page;
                    s2_renderGrid();
                    document.getElementById('blogs').scrollIntoView({ behavior: 'smooth' });
                }
            });
        });
    }

    function s2_handleSearch() {
        if (!s2_searchInput) return;
        const query = s2_searchInput.value.toLowerCase();
        s2_filteredPosts = allBlogPosts.filter(post =>
            post.title.toLowerCase().includes(query) ||
            post.description.toLowerCase().includes(query) ||
            (post.keywords && post.keywords.some(k => k.toLowerCase().includes(query)))
        );
        s2_currentPage = 1;
        s2_renderGrid();
    }

    function s2_setup() {
        if (!s2_blogContainer) return;
        s2_filteredPosts = [...allBlogPosts];
        s2_renderGrid();
        if (s2_searchInput) {
            s2_searchInput.addEventListener('input', s2_handleSearch);
        }
    }

    // --- MAIN INITIALIZATION ---

    async function init() {
        try {
            const response = await fetch('blogs.json');
            if (!response.ok) throw new Error('Failed to fetch blogs');
            allBlogPosts = await response.json();
            allBlogPosts.sort((a, b) => extractDate(b.dateAndReadTime) - extractDate(a.dateAndReadTime));

            s1_setup();
            s2_setup();
        } catch (error) {
            console.error(error);
        }
    }

    init();
});