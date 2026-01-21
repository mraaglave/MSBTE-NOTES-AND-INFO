/**
 * Video Player Logic for MSBTE Video Courses
 * Handles:
 * - Fetching video data from JSON
 * - Rendering the playlist
 * - YouTube Player initialization and control
 * - Autoplay (Next video)
 * - Responsive Ad placement
 */

let player;
let videoData = [];
let currentVideoIndex = 0;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    // Check if COURSE_FILE is defined (set in the HTML file)
    if (typeof COURSE_FILE === 'undefined') {
        console.error("COURSE_FILE is not defined.");
        return;
    }

    try {
        const response = await fetch(COURSE_FILE);
        const rawData = await response.json();

        // Normalize data to ensure consistent format (id, title, duration, description)
        videoData = rawData.map(item => {
            // Check if it's the new format (with "Video url" or "Title" caps)
            if (item['Video url'] || item['Title']) {
                let videoId = item.id;
                if (!videoId && item['Video url']) {
                    // Extract ID from URL (e.g., https://www.youtube.com/watch?v=ID)
                    const urlParts = item['Video url'].split('v=');
                    if (urlParts.length > 1) {
                        videoId = urlParts[1].split('&')[0];
                    }
                }

                return {
                    id: videoId || item.id,
                    title: item['Title'] || item.title,
                    duration: item['Duration in timestamp'] || item['Duration'] || item.duration,
                    description: item['Description'] || item.description
                };
            }
            // Return as is if already in correct format
            return item;
        });

        renderPlaylist();
        loadYouTubeAPI();
    } catch (error) {
        console.error("Failed to load course data:", error);
    }
});

// Load YouTube Iframe API
function loadYouTubeAPI() {
    const tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
}

// Inject custom styles for line-clamp (since Tailwind 2.x CDN might not have it)
function injectStyles() {
    const style = document.createElement('style');
    style.innerHTML = `
        .line-clamp-2 {
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
        }
    `;
    document.head.appendChild(style);
}
injectStyles();

// Called automatically by YouTube API
function onYouTubeIframeAPIReady() {
    if (videoData.length > 0) {
        const firstVideoId = videoData[0].id; // Default to first video
        player = new YT.Player('main-player', {
            videoId: firstVideoId,
            playerVars: {
                'playsinline': 1,
                'rel': 0, // Don't show related videos from other channels
                'autoplay': 0 // Don't autoplay on initial load (better UX/policy)
            },
            events: {
                'onStateChange': onPlayerStateChange
            }
        });

        // Highlight first video
        updateActiveVideo(0);
        updateVideoInfo(0);
    }
}

// Handle Player State Changes (Autoplay logic)
function onPlayerStateChange(event) {
    if (event.data === YT.PlayerState.ENDED) {
        playNextVideo();
    }
}

function playNextVideo() {
    if (currentVideoIndex < videoData.length - 1) {
        const nextIndex = currentVideoIndex + 1;
        changeVideo(videoData[nextIndex].id, nextIndex);
    }
}

// Change video function (called by click or autoplay)
window.changeVideo = function (videoId, index) {
    if (player && player.loadVideoById) {
        player.loadVideoById(videoId);
        currentVideoIndex = index;
        updateActiveVideo(index);

        // Scroll video into view on mobile if needed
        if (window.innerWidth < 1024) {
            document.getElementById('main-player-container').scrollIntoView({ behavior: 'smooth' });
        }
    }

    updateVideoInfo(index);
}

function updateVideoInfo(index) {
    // Update Video Info Section (Title & Description)
    const video = videoData[index];
    const infoContainer = document.getElementById('video-info-container');
    if (infoContainer && video) {
        // Escape content to prevent XSS (basic) - though here we trust the JSON source mostly
        const safeDescription = (video.description || 'No description available.').replace(/\n/g, '<br>');

        infoContainer.innerHTML = `
            <h2 class="text-xl md:text-2xl font-bold text-white mb-2 font-display">${video.title}</h2>
            
            <div class="relative">
                <div id="video-description" class="text-gray-400 text-sm md:text-base leading-relaxed line-clamp-2 overflow-hidden transition-all duration-300">
                    ${safeDescription}
                </div>
                <button id="read-more-btn" onclick="toggleDescription()" 
                    class="text-blue-400 text-xs font-semibold mt-1 hover:text-blue-300 focus:outline-none hidden">
                    Read more
                </button>
            </div>

            <div class="mt-4 flex items-center gap-4 text-sm text-gray-500">
                <span>${video.duration}</span>
                <span>•</span>
                <span>video ${index + 1} of ${videoData.length}</span>
            </div>
            
            <div class="mt-6 pt-4 border-t border-gray-800 text-xs text-gray-500 leading-relaxed opacity-75">
                 Disclaimer: This course section is for educational purposes only. All rights belong to the original creators/teachers. 
                 If anyone has an issue regarding this, please email us: <a href="mailto:info.mraaglave@gmail.com" class="text-blue-400 hover:underline">info.mraaglave@gmail.com</a>
            </div>
        `;

        // Check if truncation is needed
        setTimeout(() => {
            const desc = document.getElementById('video-description');
            const btn = document.getElementById('read-more-btn');
            if (desc && btn) {
                // If content height is greater than visible height (approximate check for line clamp effect)
                // A safe heuristic is also checking if text length is substantial
                if (desc.scrollHeight > desc.clientHeight || safeDescription.length > 150) {
                    btn.classList.remove('hidden');
                }
            }
        }, 0);
    }
}

// Global function to toggle description
window.toggleDescription = function () {
    const desc = document.getElementById('video-description');
    const btn = document.getElementById('read-more-btn');

    if (desc.classList.contains('line-clamp-2')) {
        desc.classList.remove('line-clamp-2');
        btn.textContent = 'Read less';
    } else {
        desc.classList.add('line-clamp-2');
        btn.textContent = 'Read more';
    }
}

// Render the playlist
function renderPlaylist() {
    const listContainer = document.getElementById('video-list-container');
    if (!listContainer) return;

    listContainer.innerHTML = ''; // Clear placeholders

    videoData.forEach((video, index) => {
        const btn = document.createElement('button');
        const thumbnailUrl = `https://i.ytimg.com/vi/${video.id}/mqdefault.jpg`;

        btn.innerHTML = `
            <div class="flex gap-3 pointer-events-none">
                <div class="flex-shrink-0 w-32 relative">
                    <img src="${thumbnailUrl}" alt="${video.title}" class="w-full h-20 object-cover rounded-md shadow-sm group-hover:shadow-md transition">
                    <div class="absolute bottom-1 right-1 bg-black bg-opacity-75 text-white text-[10px] px-1 rounded">${video.duration.split(' ')[0]}</div>
                    <div class="absolute top-1 left-1 video-index-badge w-5 h-5 rounded-full bg-black bg-opacity-50 text-white flex items-center justify-center text-[10px] font-bold shadow-sm">${index + 1}</div>
                </div>
                <div class="flex-1">
                    <h4 class="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition title-text line-clamp-2">${video.title}</h4>
                    <p class="text-xs text-gray-500 mt-1 flex items-center">
                        <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd"></path></svg>
                        Play Video
                    </p>
                </div>
            </div>
        `;

        // Tailwind classes
        btn.className = "video-item-btn w-full text-left p-4 hover:bg-gray-50 border-b border-gray-100 transition duration-150 group";

        btn.onclick = () => changeVideo(video.id, index);

        // Insert Ad placeholder every 5 videos (Responsive logic)
        if (index > 0 && index % 5 === 0) {
            const adDiv = document.createElement('div');
            // Added min-h-[250px] to ensure space is reserved and visible
            adDiv.className = "w-full bg-gray-50 p-2 border-b border-gray-100 text-center min-h-[250px] flex flex-col items-center justify-center";
            adDiv.innerHTML = `<div class="text-xs text-gray-400 uppercase tracking-wider mb-2">Advertisement</div>
                               <ins class="adsbygoogle"
                                    style="display:block; width: 100%;"
                                    data-ad-client="ca-pub-9227354288966999"
                                    data-ad-slot="1275037071"
                                    data-ad-format="rectangle"
                                    data-full-width-responsive="true"></ins>`;
            listContainer.appendChild(adDiv);

            // Push the new ad unit to AdSense
            try {
                (window.adsbygoogle = window.adsbygoogle || []).push({});
            } catch (e) {
                console.error("AdSense push error: ", e);
            }
        }

        listContainer.appendChild(btn);
    });
}

function updateActiveVideo(index) {
    const buttons = document.querySelectorAll('.video-item-btn');
    buttons.forEach((btn, idx) => {
        const badge = btn.querySelector('.video-index-badge');

        if (idx === index) {
            btn.classList.add('active-video', 'bg-blue-50', 'border-l-4', 'border-blue-600');
            // Update badge inside
            if (badge) {
                badge.classList.remove('bg-black', 'bg-opacity-50');
                badge.classList.add('bg-blue-600');
            }
        } else {
            btn.classList.remove('active-video', 'bg-blue-50', 'border-l-4', 'border-blue-600');
            // Reset badge
            if (badge) {
                badge.classList.remove('bg-blue-600');
                badge.classList.add('bg-black', 'bg-opacity-50');
            }
        }
    });

    // Auto scroll playlist to active video
    const activeBtn = buttons[index];
    if (activeBtn) {
        activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}
