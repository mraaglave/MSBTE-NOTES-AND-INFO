const fs = require('fs');
const path = require('path');

const BLOGS_JSON_PATH = path.join(__dirname, '..', 'blogs.json');
const RESOURCES_JSON_PATH = path.join(__dirname, '..', 'Notes', 'resources.json');
const OUTPUT_CSV_PATH = path.join(__dirname, '..', 'data', 'pinterest_bulk_upload.csv');
const BASE_URL = 'https://msbtenotes-info.netlify.app';

// Helper to sanitize CSV fields (escape quotes and wrap in quotes if there are commas)
function escapeCSV(text) {
    if (!text) return '';
    let escaped = String(text).replace(/"/g, '""');
    // Pinterest description and title might have commas or newlines
    return `"${escaped}"`;
}

function truncate(text, maxLength) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
}

function generateCSV() {
    let blogs = [];
    let resources = [];
    
    try {
        blogs = JSON.parse(fs.readFileSync(BLOGS_JSON_PATH, 'utf8'));
    } catch(e) {
        console.error("Could not read blogs.json");
    }

    try {
        resources = JSON.parse(fs.readFileSync(RESOURCES_JSON_PATH, 'utf8'));
    } catch(e) {
        console.error("Could not read resources.json");
    }

    const rows = [];
    // CSV Header exactly as Pinterest expects (or close to it based on docs)
    // "Title","Media URL","Pinterest board","Thumbnail","Description","Link","Publish date","Keywords"
    rows.push(['Title', 'Media URL', 'Pinterest board', 'Thumbnail', 'Description', 'Link', 'Publish date', 'Keywords'].join(','));

    // Process Blogs
    for (const blog of blogs) {
        const title = truncate(blog.title, 100);
        
        let mediaUrl = blog.image;
        if (!mediaUrl.startsWith('http')) {
            mediaUrl = BASE_URL + (mediaUrl.startsWith('/') ? '' : '/') + mediaUrl;
        }
        if (!mediaUrl.match(/\.(png|jpe?g)$/i)) {
            mediaUrl = BASE_URL + '/resourse/MSBTE%20NOTES%20AND%20INFORMATION.png';
        }

        const board = 'MSBTE Updates';
        const thumbnail = ''; // Blank for images
        let rawDesc = blog.description || blog.shortTitle || '';
        rawDesc = String(rawDesc).replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
        const description = truncate(rawDesc, 500);
        const link = BASE_URL + (blog.url.startsWith('/') ? '' : '/') + blog.url;
        const publishDate = ''; // Empty for immediate publish
        
        // Basic keywords
        const keywords = 'MSBTE, Diploma, Maharashtra, Engineering, Education, Updates';

        rows.push([
            escapeCSV(title),
            escapeCSV(mediaUrl),
            escapeCSV(board),
            escapeCSV(thumbnail),
            escapeCSV(description),
            escapeCSV(link),
            escapeCSV(publishDate),
            escapeCSV(keywords)
        ].join(','));
    }

    // Process Resources (Notes/Syllabus etc.)
    for (const res of resources) {
        const title = truncate(res.title, 100);
        
        let mediaUrl = res.thumbnail;
        if (!mediaUrl || !mediaUrl.trim()) continue; // Media URL is required
        
        if (!mediaUrl.startsWith('http')) {
            mediaUrl = BASE_URL + (mediaUrl.startsWith('/') ? '' : '/') + mediaUrl;
        }
        if (!mediaUrl.match(/\.(png|jpe?g)$/i)) {
            mediaUrl = BASE_URL + '/resourse/MSBTE%20NOTES%20AND%20INFORMATION.png';
        }

        let board = 'MSBTE Study Notes';
        if (res.category === 'question-bank') board = 'MSBTE Question Banks';
        if (res.category === 'micro-project') board = 'MSBTE Microprojects';

        const thumbnail = ''; 
        let rawDesc = res.description || res.title || '';
        rawDesc = String(rawDesc).replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
        const description = truncate(rawDesc, 500);
        const link = BASE_URL + (res.url.startsWith('/') ? '' : '/') + res.url;
        const publishDate = ''; 
        
        // Keywords from resource tags
        let keywords = 'MSBTE, Notes, Study Material, Diploma';
        if (res.tags && res.tags.length > 0) {
            keywords = res.tags.slice(0, 5).join(', ');
        }

        rows.push([
            escapeCSV(title),
            escapeCSV(mediaUrl),
            escapeCSV(board),
            escapeCSV(thumbnail),
            escapeCSV(description),
            escapeCSV(link),
            escapeCSV(publishDate),
            escapeCSV(keywords)
        ].join(','));
    }

    const header = rows[0];
    const dataRows = rows.slice(1);
    const CHUNK_SIZE = 190;
    
    for (let i = 0; i < dataRows.length; i += CHUNK_SIZE) {
        const chunk = dataRows.slice(i, i + CHUNK_SIZE);
        const partNum = Math.floor(i / CHUNK_SIZE) + 1;
        const partPath = OUTPUT_CSV_PATH.replace('.csv', `_part${partNum}.csv`);
        const content = [header, ...chunk].join('\n');
        fs.writeFileSync(partPath, content, 'utf8');
        console.log(`Generated Pinterest CSV at ${partPath} with ${chunk.length} pins.`);
    }
}

generateCSV();
