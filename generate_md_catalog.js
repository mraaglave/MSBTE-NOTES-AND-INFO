const fs = require('fs');
const path = require('path');

const domain = 'https://msbtenotes-info.netlify.app/';
const rootDir = __dirname;
const siteMapFile = path.join(rootDir, 'site_resources.md');

const categories = {
    'Syllabus': [],
    'Exam Papers & Question Banks': [],
    'Microprojects': [],
    'Notes & Study Material': [],
    'General Tools & Info': []
};

function getTitle(content) {
    const match = content.match(/<title>(.*?)<\/title>/i);
    return match ? match[1].trim() : 'Untitled Page';
}

function processDirectory(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (!file.startsWith('.') && file !== 'node_modules' && file !== 'Branches' && file !== 'resourse' && file !== 'media') {
                // Note: we might want to include Branches since question papers are there.
                processDirectory(fullPath);
            } else if (file === 'Branches' || file === 'Notes') {
                processDirectory(fullPath);
            }
        } else if (file.endsWith('.html')) {
            const relPath = path.relative(rootDir, fullPath).replace(/\\/g, '/');
            const url = domain + (relPath === 'index.html' ? '' : relPath);
            const content = fs.readFileSync(fullPath, 'utf8');
            const title = getTitle(content).replace(/\| MSBTE Notes & Info/g, '').trim();

            const lowerFile = file.toLowerCase();
            const lowerPath = relPath.toLowerCase();

            if (lowerPath.includes('syllabus')) {
                categories['Syllabus'].push({ title, url });
            } else if (lowerPath.includes('question-bank') || lowerPath.includes('paper') || lowerPath.includes('scheme') || lowerPath.includes('model-answer')) {
                categories['Exam Papers & Question Banks'].push({ title, url });
            } else if (lowerPath.includes('microproject')) {
                categories['Microprojects'].push({ title, url });
            } else if (lowerPath.includes('notes') || lowerPath.includes('manual')) {
                categories['Notes & Study Material'].push({ title, url });
            } else {
                categories['General Tools & Info'].push({ title, url });
            }
        }
    }
}

processDirectory(rootDir);

let mdContent = '# MSBTE Notes & Info - Site Resources Directory\n\n';
mdContent += 'This document provides a categorized index of all available resources, pages, and materials on the website.\n\n';

for (const [category, links] of Object.entries(categories)) {
    if (links.length > 0) {
        mdContent += `## ${category}\n\n`;
        // Sort alphabetically by title
        links.sort((a, b) => a.title.localeCompare(b.title));
        for (const link of links) {
            mdContent += `- [${link.title}](${link.url})\n`;
        }
        mdContent += '\n';
    }
}

fs.writeFileSync(siteMapFile, mdContent, 'utf8');
console.log('Successfully generated site_resources.md');
