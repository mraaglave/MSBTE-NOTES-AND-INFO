const fs = require('fs').promises;
const { parseStringPromise } = require('xml2js');
const path = require('path');

const RSS_PATH = path.join(__dirname, 'rss.xml');
const BLOGS_JSON_PATH = path.join(__dirname, 'blogs.json');
const RESOURCES_JSON_PATH = path.join(__dirname, 'Notes', 'resources.json');

const BASE_URL = 'https://msbtenotes-info.netlify.app';

/**
 * Converts an absolute URL from the RSS feed to a relative path.
 * @param {string} url - The full URL.
 * @returns {string} The relative path.
 */
function toRelativeUrl(url) {
    if (url.startsWith(BASE_URL)) {
        return url.substring(BASE_URL.length);
    }
    return url;
}

/**
 * Calculates the estimated reading time for a given text.
 * @param {string} text - The text content.
 * @param {number} wpm - Words per minute.
 * @returns {string} The estimated reading time string.
 */
function calculateReadTime(text, wpm = 200) {
    if (!text) return '1 min read';
    const words = text.trim().split(/\s+/).length;
    const time = Math.ceil(words / wpm);
    return `${time} min read`;
}

/**
 * Generates a short title from a full title.
 * Tries to find a meaningful short version or truncates gracefully.
 * @param {string} title - The full title.
 * @returns {string} A shorter title.
 */
function generateShortTitle(title) {
    // Patterns to shorten common titles
    const patterns = [
        /MSBTE (.*?) Question Bank.*/,
        /MSBTE (.*?) Timetable/,
        /MSBTE (.*?) Hall Ticket/,
        /(\d+ .*?) Microproject Ideas.*/,
    ];

    for (const pattern of patterns) {
        const match = title.match(pattern);
        if (match && match[1]) {
            return match[1].trim();
        }
    }

    // If no pattern matches, take the first part before a long separator
    if (title.includes(' | ')) {
        return title.split(' | ')[0];
    }
    if (title.includes(' — ')) {
        return title.split(' — ')[0];
    }

    // Fallback to a simple truncation
    return title.length > 50 ? title.substring(0, 47) + '...' : title;
}

/**
 * Extracts a simple category for resources.json.
 * @param {Array<string>} categories - Array of categories from RSS.
 * @returns {string} A simplified category string.
 */
function getResourceCategory(categories) {
    if (!categories || categories.length === 0) return 'other';
    const lowerCategories = categories.map(c => c.toLowerCase());

    if (lowerCategories.includes('notes') || lowerCategories.includes('subject guide')) return 'subject-guide';
    if (lowerCategories.includes('question bank')) return 'question-bank';
    if (lowerCategories.includes('microprojects')) return 'micro-project';
    if (lowerCategories.includes('lab manual')) return 'lab-manual';

    return 'notes'; // Default fallback
}

/**
 * Extracts tags from the title and categories.
 * @param {string} title - The item title.
 * @param {Array<string>} categories - The item categories.
 * @returns {Array<string>} An array of tags.
 */
function getResourceTags(title, categories) {
    let tags = new Set(categories || []);
    // Add keywords from title
    const titleKeywords = title.match(/\b(K-Scheme|Java|Python|SQL|DBMS|OS|CN|OOP|DTE|PDF)\b/gi);
    if (titleKeywords) {
        titleKeywords.forEach(kw => tags.add(kw));
    }
    return Array.from(tags);
}

async function updateJsonFiles() {
    try {
        console.log('Reading rss.xml...');
        const xmlData = await fs.readFile(RSS_PATH, 'utf8');
        const parsedData = await parseStringPromise(xmlData);

        const items = parsedData.rss.channel[0].item;
        console.log(`Found ${items.length} items in the RSS feed.`);

        const blogPosts = [];
        const resources = [];

        for (const item of items) {
            const link = item.link[0];
            const title = item.title[0];
            const description = item.description[0];
            const pubDate = item.pubDate[0];
            const categories = item.category || [];
            const mediaContent = item['media:content'] ? item['media:content'][0].$ : null;

            const relativeUrl = toRelativeUrl(link);
            const id = path.basename(relativeUrl.replace(/\/$/, ''), '.html'); // Handle trailing slashes

            // Check if it's a blog post
            if (relativeUrl.startsWith('/Blog/')) {
                blogPosts.push({
                    id: id,
                    title: title,
                    image: mediaContent ? toRelativeUrl(mediaContent.url) : '',
                    imageAlt: mediaContent ? (mediaContent['media:title'] ? mediaContent['media:title'][0] : title) : title,
                    dateAndReadTime: `${new Date(pubDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} · ${calculateReadTime(description)}`,
                    shortTitle: generateShortTitle(title),
                    description: description,
                    url: relativeUrl,
                });
            }
            // Check if it's a resource (in /Notes/, /Branches/, or /Jobs/)
            else if (relativeUrl.startsWith('/Notes/') || relativeUrl.startsWith('/Branches/') || relativeUrl.startsWith('/Jobs/')) {
                 // Skip the main notes index page
                if (id === 'index') continue;

                resources.push({
                    title: title,
                    description: description,
                    url: relativeUrl,
                    thumbnail: mediaContent ? toRelativeUrl(mediaContent.url) : '/resourse/MSBTE%20NOTES%20AND%20INFORMATION.png',
                    category: getResourceCategory(categories),
                    tags: getResourceTags(title, categories),
                    dateAdded: new Date(pubDate).toISOString().split('T')[0], // YYYY-MM-DD
                });
            }
        }

        // Sort by date (newest first)
        blogPosts.sort((a, b) => new Date(b.dateAndReadTime.split('·')[0]) - new Date(a.dateAndReadTime.split('·')[0]));
        resources.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));

        console.log(`Processed ${blogPosts.length} blog posts and ${resources.length} resources.`);

        // Write to files
        await fs.writeFile(BLOGS_JSON_PATH, JSON.stringify(blogPosts, null, 4), 'utf8');
        console.log('✅ Successfully updated blogs.json');

        await fs.writeFile(RESOURCES_JSON_PATH, JSON.stringify(resources, null, 4), 'utf8');
        console.log('✅ Successfully updated Notes/resources.json');

    } catch (error) {
        console.error('❌ Error updating JSON files:', error);
    }
}

updateJsonFiles();