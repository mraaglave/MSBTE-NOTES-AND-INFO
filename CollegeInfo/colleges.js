document.addEventListener('DOMContentLoaded', () => {
    const grid = document.getElementById('collegesGrid');
    const searchInput = document.getElementById('searchInput');
    const typeFilter = document.getElementById('typeFilter');
    const noResults = document.getElementById('noResults');

    let allColleges = [];

    // Fetch Data
    async function fetchColleges() {
        showSkeletons();
        try {
            // Added a small delay to simulate network/loading for better UX feel
            await new Promise(resolve => setTimeout(resolve, 800));
            const response = await fetch('colleges.json');
            if (!response.ok) throw new Error('Failed to load colleges data');
            allColleges = await response.json();
            renderColleges(allColleges);
        } catch (error) {
            console.error(error);
            grid.innerHTML = `
                <div class="col-span-full text-center py-20">
                    <div class="inline-flex items-center justify-center p-4 bg-red-50 text-red-600 rounded-2xl mb-4 text-4xl">
                        <span class="material-symbols-outlined">error</span>
                    </div>
                    <h3 class="text-xl font-bold text-gray-900 mb-2">Failed to load content</h3>
                    <p class="text-gray-600">Please check your internet connection and try again.</p>
                </div>
            `;
        }
    }

    function showSkeletons() {
        grid.innerHTML = `
            <div class="animate-pulse bg-white border border-gray-100 rounded-3xl h-80 shadow-sm"></div>
            <div class="animate-pulse bg-white border border-gray-100 rounded-3xl h-80 shadow-sm"></div>
            <div class="animate-pulse bg-white border border-gray-100 rounded-3xl h-80 shadow-sm"></div>
        `;
    }

    // Render Function
    function renderColleges(colleges) {
        grid.innerHTML = '';

        if (colleges.length === 0) {
            noResults.classList.remove('hidden');
            grid.classList.add('hidden');
            return;
        }

        noResults.classList.add('hidden');
        grid.classList.remove('hidden');

        colleges.forEach(college => {
            const card = document.createElement('div');
            // Premium Card Styles - Compacted Padding and Typo
            card.className = 'group bg-white rounded-2xl border border-gray-100 p-6 flex flex-col h-full shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 cursor-default';

            const highlightsHtml = college.highlights.map(h =>
                `<li class="flex items-start gap-2.5 text-[13px] text-gray-600 mb-2.5 group-hover:text-gray-700 transition-colors">
                    <span class="material-symbols-outlined text-green-500 text-base flex-shrink-0 mt-0.5">verified</span>
                    ${h}
                </li>`
            ).join('');

            const tagsHtml = college.tags.map(tag =>
                `<span class="px-2.5 py-1 bg-blue-50 text-blue-600 text-[9px] font-extrabold rounded-full uppercase tracking-widest border border-blue-100 shadow-sm">${tag}</span>`
            ).join('');

            card.innerHTML = `
                <div class="flex items-start justify-between mb-5">
                    <div class="flex items-center gap-3.5">
                        <div class="w-14 h-14 rounded-xl bg-gray-50 border border-gray-100 p-2.5 flex items-center justify-center shadow-inner group-hover:bg-white transition-colors">
                            <img src="${college.logo}" alt="${college.name} logo" class="w-full h-full object-contain">
                        </div>
                        <div class="flex-1">
                            <h3 class="font-display font-bold text-lg text-gray-900 leading-tight mb-0.5 group-hover:text-blue-600 transition-colors">${college.name}</h3>
                            <div class="flex items-center gap-1.5 text-gray-500 text-xs font-medium">
                                <span class="material-symbols-outlined text-sm">location_on</span>
                                <span>${college.location}</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="flex flex-wrap gap-2 mb-6">
                    ${tagsHtml}
                </div>

                <div class="flex-grow">
                    <h4 class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Key Highlights</h4>
                    <ul class="mb-6">
                        ${highlightsHtml}
                    </ul>
                </div>

                <a href="${college.url}" class="mt-auto inline-flex items-center justify-center gap-2 w-full py-3.5 px-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-200 hover:shadow-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300">
                    Explore Details
                    <span class="material-symbols-outlined text-base">arrow_forward</span>
                </a>
            `;
            grid.appendChild(card);
        });
    }

    // Filter Logic
    function filterColleges() {
        const searchTerm = searchInput.value.toLowerCase();
        const typeTerm = typeFilter.value;

        const filtered = allColleges.filter(college => {
            const matchesSearch = college.name.toLowerCase().includes(searchTerm) ||
                college.location.toLowerCase().includes(searchTerm) ||
                college.tags.some(t => t.toLowerCase().includes(searchTerm));

            const matchesType = typeTerm === "" || college.type === typeTerm;

            return matchesSearch && matchesType;
        });

        renderColleges(filtered);
    }

    // Event Listeners
    searchInput.addEventListener('input', filterColleges);
    typeFilter.addEventListener('change', filterColleges);

    window.resetFilters = () => {
        searchInput.value = '';
        typeFilter.value = '';
        renderColleges(allColleges);
    };

    // Initial Fetch
    fetchColleges();
});
