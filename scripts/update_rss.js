const fs = require('fs');
const path = require('path');

const BASE_URL = "https://msbtenotes-info.netlify.app";
const BLOGS_JSON_PATH = path.join(__dirname, '..', 'blogs.json');
const RSS_FEED_PATH = path.join(__dirname, '..', 'rss.xml');

function escapeXml(unsafe) {
    if (!unsafe) return '';
    return unsafe.replace(/[<>&'"]/g, function (c) {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '\'': return '&apos;';
            case '"': return '&quot;';
        }
    });
}

function parseDate(dateAndReadTime) {
    if (!dateAndReadTime) return new Date().toUTCString();
    
    // Split date and read time, e.g. "June 3, 2026 · 7 min read" -> "June 3, 2026"
    const datePart = dateAndReadTime.split(' · ')[0].trim();
    const parsed = Date.parse(datePart);
    if (!isNaN(parsed)) {
        // Return RFC 822 format (equivalent to toUTCString in JS but with UTC timezone)
        return new Date(parsed).toUTCString();
    }
    return new Date().toUTCString();
}

function generateRssItem(post) {
    const title = post.title || 'No Title';
    const link = `${BASE_URL}${post.url || ''}`;
    const description = post.description || '';
    const imageUrl = `${BASE_URL}${post.image || ''}`;
    const pubDate = parseDate(post.dateAndReadTime);
    
    let mimeType = "image/jpeg";
    const imgLower = imageUrl.toLowerCase();
    if (imgLower.endsWith(".png")) {
        mimeType = "image/png";
    } else if (imgLower.endsWith(".gif")) {
        mimeType = "image/gif";
    } else if (imgLower.endsWith(".webp")) {
        mimeType = "image/webp";
    }

    const categoryTags = Array.isArray(post.keywords) 
        ? post.keywords.map(kw => `      <category>${escapeXml(kw)}</category>`).join('\n')
        : (post.category ? `      <category>${escapeXml(post.category)}</category>` : '');

    return `    <item>
      <title>${escapeXml(title)}</title>
      <link>${link}</link>
      <description>${escapeXml(description)}</description>
      <pubDate>${pubDate}</pubDate>
      <dc:creator>MSBTE Notes &amp; Info Team</dc:creator>
      <guid isPermaLink="true">${link}</guid>
${categoryTags}
      <media:content url="${imageUrl}" medium="image" type="${mimeType}">
        <media:title type="plain">${escapeXml(post.shortTitle || title)}</media:title>
        <media:description type="plain">${escapeXml(post.imageAlt || title)}</media:description>
      </media:content>
      <enclosure url="${imageUrl}" type="${mimeType}" length="0" />
    </item>`;
}

function main() {
    console.log("Generating RSS feed...");
    
    if (!fs.existsSync(BLOGS_JSON_PATH)) {
        console.error(`Error: blogs.json not found at ${BLOGS_JSON_PATH}`);
        process.exit(1);
    }
    
    const blogsRaw = fs.readFileSync(BLOGS_JSON_PATH, 'utf8');
    let blogs;
    try {
        blogs = JSON.parse(blogsRaw);
    } catch (e) {
        console.error("Error parsing blogs.json:", e);
        process.exit(1);
    }
    
    const rssItems = blogs.map(generateRssItem).join('\n');
    const lastBuildDate = new Date().toUTCString();
    
    const rssContent = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:media="http://search.yahoo.com/mrss/" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>MSBTE Notes &amp; Info Blog</title>
    <link>${BASE_URL}</link>
    <description>Latest updates, scholarship guides, and academic news for MSBTE students.</description>
    <language>en-us</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${BASE_URL}/rss.xml" rel="self" type="application/rss+xml"/>
    <image>
      <url>${BASE_URL}/resourse/favicon-32x32.png</url>
      <title>MSBTE Notes &amp; Info</title>
      <link>${BASE_URL}</link>
    </image>
${rssItems}
  </channel>
</rss>
`;

    fs.writeFileSync(RSS_FEED_PATH, rssContent, 'utf8');
    console.log(`Successfully generated ${RSS_FEED_PATH} with ${blogs.length} items.`);
}

main();
