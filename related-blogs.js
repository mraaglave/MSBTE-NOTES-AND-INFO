document.addEventListener('DOMContentLoaded', () => {
    const relatedContainer = document.getElementById('relatedContainer');
    const relatedPagination = document.getElementById('relatedPagination');
    const postsPerPage = 3; // Display 3 related posts at a time
    let currentPage = 1;
    let allBlogPosts = [];

    // Function to get the current page's ID from its canonical URL
    function getCurrentPageId() {
        const canonicalLink = document.querySelector("link[rel='canonical']");
        if (canonicalLink) {
            const urlParts = canonicalLink.href.split('/');
            const htmlFile = urlParts.pop(); // e.g., 'dbms-guess-paper-free.html'
            return htmlFile.replace('.html', ''); // e.g., 'dbms-guess-paper-free'
        }
        return null;
    }

    // Function to fetch blog posts from JSON
    async function fetchBlogPosts() {
        try {
            // Adjust the path to blogs.json relative to the blog post's location
            const response = await fetch('../blogs.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const allPosts = await response.json();
            const currentPageId = getCurrentPageId();

            // Filter out the current page from the list of related posts
            allBlogPosts = allPosts.filter(post => post.id !== currentPageId);

            // Sort posts by date (newest first)
            allBlogPosts.sort((a, b) => new Date(b.dateAndReadTime.split('·')[0].trim()) - new Date(a.dateAndReadTime.split('·')[0].trim()));
            
            renderBlogPosts();
            renderPagination();
        } catch (error) {
            console.error("Error fetching related blog posts:", error);
            if (relatedContainer) {
                relatedContainer.innerHTML = '<p class="text-center text-red-500 col-span-full">Failed to load related posts.</p>';
            }
        }
    }

    // Function to render blog posts for the current page
    function renderBlogPosts() {
        if (!relatedContainer) return;
        relatedContainer.innerHTML = ''; // Clear existing posts
        const start = (currentPage - 1) * postsPerPage;
        const end = start + postsPerPage;
        const postsToRender = allBlogPosts.slice(start, end);

        postsToRender.forEach(post => {
            const blogCard = document.createElement('a');
            blogCard.href = post.url.startsWith('/') ? `..${post.url}` : post.url; // Adjust URL for relative path
            blogCard.className = 'block bg-white rounded-xl shadow hover:shadow-lg transition overflow-hidden';
            blogCard.innerHTML = `
                <img src="..${post.image}" alt="${post.imageAlt}" class="w-full h-40 object-cover" loading="lazy">
                <div class="p-4">
                    <h3 class="font-semibold text-blue-700">${post.shortTitle}</h3>
                </div>
            `;
            relatedContainer.appendChild(blogCard);
        });
    }

    // Function to render pagination controls
    function renderPagination() {
        if (!relatedPagination) return;
        relatedPagination.innerHTML = ''; // Clear existing pagination
        const totalPages = Math.ceil(allBlogPosts.length / postsPerPage);

        if (totalPages <= 1) return;

        for (let i = 1; i <= totalPages; i++) {
            const pageButton = document.createElement('button');
            pageButton.textContent = i;
            pageButton.className = `w-10 h-10 rounded-full border transition-colors ${currentPage === i ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'}`;
            pageButton.addEventListener('click', () => {
                currentPage = i;
                renderBlogPosts();
                renderPagination();
            });
            relatedPagination.appendChild(pageButton);
        }
    }

    // Initial fetch
    fetchBlogPosts();
});