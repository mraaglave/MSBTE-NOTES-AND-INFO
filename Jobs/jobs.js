// Initialize all AdSense blocks
(adsbygoogle = window.adsbygoogle || []).push({});
(adsbygoogle = window.adsbygoogle || []).push({});

// --- The Page Logic ---

document.addEventListener('DOMContentLoaded', () => {
    const grid = document.getElementById("jobsGrid");
    const noResults = document.getElementById("noResults");
    const searchInput = document.getElementById("searchInput");
    const typeFilter = document.getElementById("typeFilter");
    const sortFilter = document.getElementById("sortFilter");
    const loadMoreBtn = document.getElementById("loadMoreBtn");
    const mobileMenuBtn = document.getElementById("mobileMenuBtn");
    const mobileNav = document.getElementById("mobileNav");

    if (mobileMenuBtn && mobileNav) {
        mobileMenuBtn.addEventListener('click', () => {
            mobileNav.classList.toggle('hidden');
        });
    }

    let allJobs = [];
    let filteredJobs = [];
    let jobsPerPage = 6;
    let jobsDisplayed = 0;
    let bookmarkedJobs = {}; // Stores bookmarked jobs as {id: jobObject}

    // --- Data Fetching ---
    async function fetchJobs() {
        try {
            const response = await fetch('./jobs.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            allJobs = await response.json();
            loadBookmarkedJobs(); // Load bookmarks after fetching all jobs
            applyFilters();
        } catch (error) {
            console.error("Could not fetch jobs:", error);
            if (grid) {
                grid.innerHTML = `<p class="text-red-500 col-span-full text-center">Failed to load jobs. Please try again later.</p>`;
            }
        }
    }

    // --- Rendering ---
    function renderJobs() {
        if (!grid) return;
        const jobsToRender = filteredJobs.slice(0, jobsDisplayed);
        grid.innerHTML = ""; // Clear previous results

        if (jobsToRender.length === 0) {
            noResults.classList.remove('hidden');
        } else {
            noResults.classList.add('hidden');
        }

        jobsToRender.forEach(job => {
            const card = createJobCard(job);
            grid.appendChild(card);
        });

        // Handle "Load More" button visibility
        if (loadMoreBtn) {
            if (jobsDisplayed < filteredJobs.length) {
                loadMoreBtn.classList.remove('hidden');
            } else {
                loadMoreBtn.classList.add('hidden');
            }
        }
    }

    // --- Bookmark Functions ---
    function loadBookmarkedJobs() {
        const storedBookmarks = localStorage.getItem('bookmarkedJobs');
        bookmarkedJobs = storedBookmarks ? JSON.parse(storedBookmarks) : {};
    }

    function saveBookmarkedJobs() {
        localStorage.setItem('bookmarkedJobs', JSON.stringify(bookmarkedJobs));
    }

    function isBookmarked(jobId) {
        return !!bookmarkedJobs[jobId];
    }

    function createJobCard(job) {
        const daysAgo = Math.floor((new Date() - new Date(job.posted)) / (1000 * 60 * 60 * 24));
        const postedText = daysAgo === 0 ? 'Today' : `${daysAgo} day${daysAgo > 1 ? 's' : ''} ago`;

        const tagsHTML = job.tags.map(tag => `<span class="inline-block bg-blue-50 text-blue-700 px-2 py-1 rounded-full text-xs font-medium">${tag}</span>`).join(" ");

        let statusHTML = '';
        if (job.status) {
            const statusColors = {
                'New': 'bg-green-100 text-green-800',
                'Hot': 'bg-red-100 text-red-800',
                'Closing Soon': 'bg-yellow-100 text-yellow-800'
            };
            statusHTML = `<span class="absolute top-0 right-0 mt-2 mr-2 text-xs font-bold px-2 py-1 rounded-full ${statusColors[job.status] || ''}">${job.status}</span>`;
        }

        const card = document.createElement("div");
        card.className = "job-card p-6 relative";
        card.innerHTML = `
        <div>
            ${statusHTML}
            <div class="flex justify-between items-start mb-4" loading="lazy">
                <div class="flex items-center gap-4">
                    <img src="${job.logo}" alt="${job.company} Logo" class="h-14 w-14 object-contain rounded-md p-1 border border-gray-200 bg-white">
                    <div>
                        <h3 class="text-lg font-semibold text-gray-800 hover:text-blue-600 transition-colors duration-200"><a href="job-detail.html?id=${job.id}">${job.title}</a></h3>
                        <p class="text-gray-600 text-sm font-medium">${job.company}</p>
                    </div>
                </div>
            </div>
            <div class="flex items-center text-sm text-gray-500 gap-x-4 gap-y-2 mb-4 flex-wrap">
                <div class="flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" />
                    </svg>
                    <span>${job.location}</span>
                </div>
                <div class="flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.414-1.415L11 9.586V6z" clip-rule="evenodd" />
                    </svg>
                    <span>${postedText}</span>
                </div>
                <span class="text-xs font-semibold px-2.5 py-1 rounded-full ${job.type === 'Internship' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}">${job.type}</span>
            </div>
            <div class="flex flex-wrap gap-2 mt-4 border-t border-gray-100 pt-4">
                ${tagsHTML}
            </div>
        </div>
        <div class="flex items-center gap-3 mt-6">
            <a href="job-detail.html?id=${job.id}"
                class="flex-1 bg-gray-100 text-gray-700 px-4 py-2.5 rounded-lg font-semibold text-center hover:bg-gray-200 transition duration-300 text-sm">
                View Details
            </a>
            <a href="${job.url}" target="_blank"
                class="flex-1 bg-blue-600 text-white px-4 py-2.5 rounded-lg font-semibold text-center hover:bg-blue-700 transition duration-300 text-sm">
                Apply Now →
            </a>
            <button aria-label="Bookmark job" class="bookmark-btn p-2.5 rounded-lg hover:bg-gray-100 ${isBookmarked(job.id) ? 'text-yellow-500' : 'text-gray-400'}" data-job-id="${job.id}">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
            </button>
        </div>
        `;
        return card;
    }

    // --- Filtering and Sorting ---
    function applyFilters() {
        const searchValue = searchInput.value.toLowerCase();
        const typeValue = typeFilter.value;
        const sortValue = sortFilter.value;

        filteredJobs = allJobs.filter(job => {
            const matchesSearch =
                job.title.toLowerCase().includes(searchValue) ||
                job.company.toLowerCase().includes(searchValue) ||
                job.location.toLowerCase().includes(searchValue) ||
                job.tags.some(tag => tag.toLowerCase().includes(searchValue));

            const matchesType = typeValue === "" || job.type === typeValue;

            return matchesSearch && matchesType;
        });

        // Sort the filtered jobs
        if (sortValue === 'latest') {
            filteredJobs.sort((a, b) => new Date(b.posted) - new Date(a.posted));
        } else if (sortValue === 'deadline') {
            filteredJobs.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
        }

        jobsDisplayed = jobsPerPage; // Reset display count
        renderJobs();
    }

    // --- Event Listeners ---
    if (searchInput) searchInput.addEventListener("input", applyFilters);
    if (typeFilter) typeFilter.addEventListener("change", applyFilters);
    if (sortFilter) sortFilter.addEventListener("change", applyFilters);

    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', () => {
            jobsDisplayed += jobsPerPage;
            renderJobs();
        });
    }

    if (grid) {
        grid.addEventListener('click', (event) => {
            const bookmarkButton = event.target.closest('.bookmark-btn');
            if (bookmarkButton) {
                const jobId = bookmarkButton.dataset.jobId;
                const job = allJobs.find(j => j.id === jobId);
                if (job) {
                    if (isBookmarked(jobId)) {
                        delete bookmarkedJobs[jobId];
                        bookmarkButton.classList.replace('text-yellow-500', 'text-gray-400');
                    } else {
                        bookmarkedJobs[jobId] = job; // Store the entire job object
                        bookmarkButton.classList.replace('text-gray-400', 'text-yellow-500');
                    }
                    saveBookmarkedJobs();
                }
            }
        });
    }

    // --- Recently Viewed Logic ---
    function renderRecentlyViewed() {
        const recentlyViewedSection = document.getElementById('recentlyViewedSection');
        const recentlyViewedGrid = document.getElementById('recentlyViewedGrid');
        const recentJobs = JSON.parse(localStorage.getItem('recentlyViewedJobs')) || [];

        if (recentJobs.length > 0 && recentlyViewedGrid) {
            recentlyViewedSection.classList.remove('hidden');
            recentlyViewedGrid.innerHTML = '';
            recentJobs.forEach((job, index) => {
                const card = createRecentJobCard(job);
                recentlyViewedGrid.appendChild(card);
                card.style.animation = `fadeIn 0.5s ease-out ${index * 0.1}s forwards`;
                card.style.opacity = '0'; // Start hidden
            });

            // Add event listener for the clear button
            const clearBtn = document.getElementById('clearRecentlyViewedBtn');
            if (clearBtn) {
                clearBtn.addEventListener('click', () => {
                    if (confirm("Are you sure you want to clear all recently viewed jobs?")) {
                        localStorage.removeItem('recentlyViewedJobs');
                        recentlyViewedSection.classList.add('hidden');
                        recentlyViewedGrid.innerHTML = '';
                    }
                });
            }
        }
    }

    function createRecentJobCard(job) {
        const card = document.createElement("div");
        // Using a slightly different style for recent cards
        card.className = "job-card p-5 relative flex flex-col justify-between opacity-0";
        card.innerHTML = `
            <div>
                <div class="flex items-center gap-3 mb-3">
                    <img src="${job.logo}" alt="${job.company} Logo" loading="lazy" class="h-10 w-10 object-contain rounded-md p-1 border bg-white">
                    <div>
                        <h4 class="font-semibold text-gray-800 leading-tight"><a href="job-detail.html?id=${job.id}" class="hover:text-blue-600">${job.title}</a></h4>
                        <p class="text-gray-500 text-sm">${job.company}</p>
                    </div>
                </div>
            </div>
            <a href="job-detail.html?id=${job.id}" class="mt-4 w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-semibold text-center hover:bg-gray-200 transition text-sm">View Job</a>
        `;
        return card;
    }

    // --- Initial Load ---
    fetchJobs();

    // Logic for the infinite scroller
    const scrollers = document.querySelectorAll(".scroller");
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        addAnimation();
    }

    function addAnimation() {
        scrollers.forEach((scroller) => {
            scroller.setAttribute("data-animated", true);
            const scrollerInner = scroller.querySelector(".scroller__inner");
            const scrollerContent = Array.from(scrollerInner.children);
            scrollerContent.forEach(item => {
                const duplicatedItem = item.cloneNode(true);
                duplicatedItem.setAttribute("aria-hidden", true);
                scrollerInner.appendChild(duplicatedItem);
            });

            // Pause animation on hover
            scroller.addEventListener('mouseenter', () => {
                scrollerInner.style.animationPlayState = 'paused';
            });
            scroller.addEventListener('mouseleave', () => {
                scrollerInner.style.animationPlayState = 'running';
            });
        });
    }

    // Render recently viewed jobs on page load
    renderRecentlyViewed();
});