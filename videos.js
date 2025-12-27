document.addEventListener('DOMContentLoaded', () => {
  fetchVideos();
});

async function fetchVideos() {
  try {
    const response = await fetch('videos.json');
    const videos = await response.json();
    renderVideos(videos);
  } catch (error) {
    console.error('Error fetching videos:', error);
    document.getElementById('videosGrid').innerHTML = `
            <div class="col-span-full text-center py-12">
                <div class="text-red-500 text-xl font-bold mb-2">Unavailable to Load Videos</div>
                <p class="text-gray-600 mb-4">Please check your internet connection or try again later.</p>
                <button onclick="location.reload()" class="px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition">
                    Retry
                </button>
            </div>
        `;
  }
}

function renderVideos(videos) {
  const grid = document.getElementById('videosGrid');
  grid.innerHTML = '';

  videos.forEach(video => {

    const card = document.createElement('div');
    card.className = 'group flex flex-col h-full bg-white rounded-2xl shadow-sm hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden border border-gray-100';

    // SEO Schema for Video Object
    const schema = {
      "@context": "https://schema.org",
      "@type": "VideoObject",
      "name": video.title,
      "description": video.description,
      "thumbnailUrl": [video.thumbnail],
      "uploadDate": video.date,
      "contentUrl": `https://www.youtube.com/watch?v=${video.videoId}`,
      "embedUrl": `https://www.youtube.com/embed/${video.videoId}`
    };

    card.innerHTML = `
      <script type="application/ld+json">${JSON.stringify(schema)}</script>
      <div class="relative overflow-hidden aspect-w-16 aspect-h-9 bg-gray-200">
        <a href="https://www.youtube.com/watch?v=${video.videoId}" target="_blank" rel="noopener noreferrer" class="block w-full h-full">
          <img src="${video.thumbnail}" 
               alt="${video.title}" 
               class="w-full h-48 object-cover transform group-hover:scale-110 transition-transform duration-500"
               loading="lazy"
               onerror="this.src='resourse/MSBTE NOTES AND INFORMATION.png'">
          
          <!-- Play Button Overlay -->
          <div class="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 group-hover:bg-opacity-40 transition-all duration-300 backdrop-blur-[2px] group-hover:backdrop-blur-none">
            <div class="w-14 h-14 bg-red-600 rounded-full flex items-center justify-center shadow-lg transform group-hover:scale-125 transition-transform duration-300">
               <svg class="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            </div>
          </div>
          
          <!-- Duration/New Badge (Optional - using date for now) -->
          <div class="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded font-mono">
            YouTube
          </div>
        </a>
      </div>
      
      <div class="p-5 flex flex-col flex-grow relative z-10 bg-white">
        <div class="flex items-center gap-2 mb-3 text-xs font-semibold text-blue-500 uppercase tracking-wide">
          <span class="w-2 h-2 rounded-full bg-blue-500"></span>
          Tutorial
        </div>
        
        <h3 class="text-lg font-bold text-gray-900 mb-2 leading-snug group-hover:text-blue-600 transition-colors line-clamp-2">
          <a href="https://www.youtube.com/watch?v=${video.videoId}" target="_blank">${video.title}</a>
        </h3>
        
        <p class="text-gray-600 text-sm line-clamp-2 mb-4 flex-grow">${video.description}</p>
        
        <div class="mt-auto border-t border-gray-100 pt-4 flex justify-between items-center">
             <a href="https://www.youtube.com/watch?v=${video.videoId}" target="_blank" 
             class="text-sm font-semibold text-red-600 hover:text-red-700 flex items-center gap-1 group/link">
             Watch Video
             <svg class="w-4 h-4 transform group-hover/link:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
             </a>
             <button class="text-gray-400 hover:text-gray-600" title="Share" onclick="navigator.clipboard.writeText('https://www.youtube.com/watch?v=${video.videoId}'); alert('Link copied!'); event.preventDefault();">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path></svg>
             </button>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });
}
