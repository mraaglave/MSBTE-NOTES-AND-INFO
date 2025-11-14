document.addEventListener('DOMContentLoaded', () => {
    const blogContainer = document.getElementById('blogContainer');
    const paginationContainer = document.getElementById('blogPagination');
    const searchInput = document.getElementById('blogSearch');
    const postsPerPage = 6; // Number of blog posts to display per page
    let currentPage = 1;
    let allBlogPosts = [];
    let filteredBlogPosts = [];

    // Function to fetch blog posts from JSON
    async function fetchBlogPosts() {
        try {
            const response = await fetch('blogs.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            allBlogPosts = await response.json();
            // Sort posts by date (newest first)
            allBlogPosts.sort((a, b) => new Date(b.dateAndReadTime.split('·')[0].trim()) - new Date(a.dateAndReadTime.split('·')[0].trim()));
            filteredBlogPosts = [...allBlogPosts]; // Initialize filtered posts
            renderBlogPosts();
            renderPagination();
        } catch (error) {
            console.error("Error fetching blog posts:", error);
            blogContainer.innerHTML = '<p class="text-center text-red-500">Failed to load blog posts. Please try again later.</p>';
        }
    }

    // Function to render blog posts for the current page
    function renderBlogPosts() {
        blogContainer.innerHTML = ''; // Clear existing posts
        const start = (currentPage - 1) * postsPerPage;
        const end = start + postsPerPage;
        const postsToRender = filteredBlogPosts.slice(start, end);

        if (postsToRender.length === 0) {
            blogContainer.innerHTML = '<p class="text-center text-gray-500 col-span-full">No blog posts found matching your search.</p>';
            return;
        }

        postsToRender.forEach(post => {
            const blogCard = document.createElement('div');
            blogCard.className = 'blog-card bg-white rounded-xl shadow hover:shadow-lg transition overflow-hidden';
            blogCard.setAttribute('data-title', post.title); // Keep data-title for search
            blogCard.innerHTML = `
                <img src="${post.image}" alt="${post.imageAlt}" class="w-full h-48 object-cover" />
                <div class="p-6">
                    <p class="text-sm text-gray-500 mb-2">${post.dateAndReadTime}</p>
                    <h3 class="text-lg font-semibold text-blue-700">${post.shortTitle}</h3>
                    <p class="mt-2 text-sm text-gray-600">${post.description}</p>
                    <a href="${post.url}" class="text-blue-600 inline-block mt-3 font-medium">Read Now →</a>
                </div>
            `;
            blogContainer.appendChild(blogCard);
        });
    }

    // Function to render pagination controls
    function renderPagination() {
        paginationContainer.innerHTML = ''; // Clear existing pagination
        const totalPages = Math.ceil(filteredBlogPosts.length / postsPerPage);

        if (totalPages <= 1) {
            return; // No pagination needed for 1 or fewer pages
        }

        // Previous button
        const prevButton = createPaginationButton('← Previous', currentPage - 1, currentPage === 1);
        paginationContainer.appendChild(prevButton);

        // Page numbers
        for (let i = 1; i <= totalPages; i++) {
            const pageButton = createPaginationButton(i, i, currentPage === i);
            paginationContainer.appendChild(pageButton);
        }

        // Next button
        const nextButton = createPaginationButton('Next →', currentPage + 1, currentPage === totalPages);
        paginationContainer.appendChild(nextButton);
    }

    // Helper to create a pagination button
    function createPaginationButton(text, page, isDisabled) {
        const button = document.createElement('button');
        button.textContent = text;
        button.className = `pagination-btn ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''} ${page === currentPage && !isDisabled ? 'active' : ''}`;
        button.disabled = isDisabled;
        button.addEventListener('click', () => {
            currentPage = page;
            renderBlogPosts();
            renderPagination();
            window.scrollTo({ top: blogContainer.offsetTop - 100, behavior: 'smooth' }); // Scroll to blog section
        });
        return button;
    }

    // Search functionality
    searchInput.addEventListener('input', () => {
        const searchTerm = searchInput.value.toLowerCase();
        filteredBlogPosts = allBlogPosts.filter(post =>
            post.title.toLowerCase().includes(searchTerm) ||
            post.description.toLowerCase().includes(searchTerm) ||
            post.shortTitle.toLowerCase().includes(searchTerm)
        );
        currentPage = 1; // Reset to first page on new search
        renderBlogPosts();
        renderPagination();
    });

    // Initial fetch
    fetchBlogPosts();
});