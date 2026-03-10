const fs = require('fs');
const path = require('path');

// File paths
const CSV_FILE = path.join(__dirname, 'Notes', 'notes - notes.csv');
const JSON_FILE = path.join(__dirname, 'Notes', 'resources.json');
const TEMPLATE_FILE = path.join(__dirname, 'Notes', 'note_page_template.html');
const NOTES_DIR = path.join(__dirname, 'Notes');
const THUMBS_DIR = path.join(__dirname, 'resourse', 'note-thumbs');

function cleanup() {
    console.log("Starting cleanup of old '---' files...");
    let removedHtml = 0;
    let removedSvg = 0;

    if (fs.existsSync(NOTES_DIR)) {
        const files = fs.readdirSync(NOTES_DIR);
        files.forEach(f => {
            if (f.includes('---') && f.endsWith('.html')) {
                fs.unlinkSync(path.join(NOTES_DIR, f));
                removedHtml++;
            }
        });
    }

    if (fs.existsSync(THUMBS_DIR)) {
        const thumbs = fs.readdirSync(THUMBS_DIR);
        thumbs.forEach(f => {
            if (f.includes('---') && f.endsWith('.svg')) {
                fs.unlinkSync(path.join(THUMBS_DIR, f));
                removedSvg++;
            }
        });
    }

    if (fs.existsSync(JSON_FILE)) {
        let data = JSON.parse(fs.readFileSync(JSON_FILE, 'utf-8'));
        const originalCount = data.length;
        data = data.filter(item => !item.url.includes('---'));
        fs.writeFileSync(JSON_FILE, JSON.stringify(data, null, 4), 'utf-8');
        console.log("Cleanup: Removed " + (originalCount - data.length) + " bad entries from resources.json, " + removedHtml + " HTML files, " + removedSvg + " SVG files.");
    }
}

function createSlug(text) {
    return String(text)
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-') // collapse multiple dashes into one
        .replace(/^-+|-+$/g, '');
}

function extractCoreSubject(testName) {
    const parts = testName.split(' - ');
    if (parts.length >= 2 && /^\d+$/.test(parts[0])) {
        return parts[0] + ' - ' + parts[1];
    }
    if (testName.includes(' - ')) {
        return parts.slice(0, 2).join(' - ');
    }
    return testName;
}

function extractResourceType(testName) {
    const parts = testName.split(' - ');
    if (parts.length >= 3) {
        return parts.slice(2).join(' - ');
    }
    return "Resource";
}

function wrapText(text, maxLineLength) {
    const words = text.split(' ');
    let lines = [];
    let currentLine = '';

    for (const word of words) {
        if ((currentLine + word).length > maxLineLength) {
            if (currentLine) lines.push(currentLine.trim());
            currentLine = word + ' ';
        } else {
            currentLine += word + ' ';
        }
    }
    if (currentLine) lines.push(currentLine.trim());
    return lines;
}

function generateSvg(title, slug, index) {
    const palettes = [
        ['#4F46E5', '#3B82F6'], // Indigo to Blue
        ['#10B981', '#059669'], // Emerald
        ['#8B5CF6', '#6D28D9'], // Purple
        ['#EC4899', '#BE185D'], // Pink
        ['#F59E0B', '#D97706'], // Amber
        ['#06B6D4', '#0891B2'], // Cyan
        ['#14B8A6', '#0D9488'], // Teal
        ['#F43F5E', '#E11D48']  // Rose
    ];
    const color = palettes[index % palettes.length];
    
    const parts = title.split(' - ');
    const code = (parts.length > 1 && /^\d+$/.test(parts[0])) ? parts[0] : "Question Bank";
    const subj = parts.length > 1 ? parts.slice(1).join(' - ').trim() : title.trim();
    
    let lines = wrapText(subj, 28);
    if (lines.length > 2) {
        lines = lines.slice(0, 2);
        lines[1] = lines[1].slice(0, Math.max(0, lines[1].length - 3)) + '...';
    }

    let startY = lines.length === 2 ? 340 : 380;
    const lineSpacing = 85;
    
    let textNodes = '';
    lines.forEach((line, idx) => {
        textNodes += '\n    <text x="640" y="' + (startY + (idx * lineSpacing)) + '" font-family="\'Inter\', system-ui, sans-serif" font-weight="800" font-size="70" fill="white" text-anchor="middle" filter="drop-shadow(0px 2px 4px rgba(0,0,0,0.2))">' + line + '</text>';
    });

    const dividerY = lines.length === 2 ? 490 : 440;
    const subtitleY = lines.length === 2 ? 560 : 510;
    
    const svgContent = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" width="100%" height="100%">\n' +
    '    <defs>\n' +
    '        <linearGradient id="bg-grad-' + index + '" x1="0%" y1="0%" x2="100%" y2="100%">\n' +
    '            <stop offset="0%" stop-color="' + color[0] + '" />\n' +
    '            <stop offset="100%" stop-color="' + color[1] + '" />\n' +
    '        </linearGradient>\n' +
    '        <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">\n' +
    '            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>\n' +
    '        </pattern>\n' +
    '        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">\n' +
    '            <feDropShadow dx="0" dy="12" stdDeviation="20" flood-opacity="0.25"/>\n' +
    '        </filter>\n' +
    '    </defs>\n' +
    '    <rect width="1280" height="720" fill="url(#bg-grad-' + index + ')" />\n' +
    '    <rect width="1280" height="720" fill="url(#grid)" />\n' +
    '    <circle cx="1100" cy="150" r="350" fill="white" opacity="0.04" />\n' +
    '    <circle cx="150" cy="650" r="250" fill="white" opacity="0.04" />\n' +
    '    <path d="M0,720 L1280,450 L1280,720 Z" fill="rgba(255,255,255,0.03)" />\n' +
    '    <rect x="120" y="140" width="1040" height="440" rx="40" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.25)" stroke-width="2" backdrop-filter="blur(16px)" filter="url(#shadow)" />\n' +
    '    <text x="640" y="250" font-family="\'Inter\', system-ui, sans-serif" font-weight="900" font-size="45" fill="rgba(255,255,255,0.85)" text-anchor="middle" letter-spacing="5">' + code + '</text>\n' +
    textNodes + '\n' +
    '    <rect x="520" y="' + dividerY + '" width="240" height="6" rx="3" fill="white" opacity="0.6" />\n' +
    '    <text x="640" y="' + subtitleY + '" font-family="\'Inter\', system-ui, sans-serif" font-weight="600" font-size="28" fill="rgba(255,255,255,0.95)" text-anchor="middle" letter-spacing="2">MSBTE DIPLOMA QUESTION BANKS</text>\n' +
    '    <text x="1150" y="680" font-family="system-ui, sans-serif" font-weight="bold" font-size="22" fill="white" opacity="0.6" text-anchor="end" letter-spacing="1">msbtenotes-info.netlify.app</text>\n' +
    '</svg>';
    
    if (!fs.existsSync(THUMBS_DIR)) {
        fs.mkdirSync(THUMBS_DIR, { recursive: true });
    }
    fs.writeFileSync(path.join(THUMBS_DIR, slug + '.svg'), svgContent, 'utf-8');
    return '/resourse/note-thumbs/' + slug + '.svg';
}

function processCsvSync() {
    const subjects = {};
    const content = fs.readFileSync(CSV_FILE, 'utf-8');
    const lines = content.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    
    const schemeIdx = headers.indexOf('Scheme');
    const branchIdx = headers.indexOf('Branch');
    const semIdx = headers.indexOf('Semester');
    const subjIdx = headers.indexOf('Subject / Test Name');
    const pdfIdx = headers.indexOf('PDF URL');
    const driveIdx = headers.indexOf('Drive Link');
    
    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        
        const row = lines[i].split(',');
        
        const testName = row[subjIdx] ? row[subjIdx].trim() : '';
        const coreSub = extractCoreSubject(testName);
        if (!coreSub) continue;
        
        if (!subjects[coreSub]) {
            subjects[coreSub] = {
                scheme: row[schemeIdx] ? row[schemeIdx].trim() : '',
                semester: row[semIdx] ? row[semIdx].trim() : '',
                branches: new Set(),
                resources: []
            };
        }
        
        if (row[branchIdx]) {
            subjects[coreSub].branches.add(row[branchIdx].trim());
        }
        
        const resType = extractResourceType(testName);
        const pdfUrl = row[pdfIdx] ? row[pdfIdx].trim() : '';
        const driveLink = row[driveIdx] ? row[driveIdx].trim() : '';
        
        // Deduplicate solely based on the resource type (e.g. "Unit Test - 1")
        // because different branches might have different backup drive links for the same PDF.
        const isDuplicate = subjects[coreSub].resources.some(r => r.type === resType);
        
        if (!isDuplicate && (pdfUrl || driveLink)) {
            subjects[coreSub].resources.push({
                type: resType,
                pdf: pdfUrl,
                drive: driveLink
            });
        }
    }
    
    return subjects;
}

function generateSeoText(subject, branchesStr, scheme, semester) {
    return '\n' +
    '    <section class="mt-12 bg-white p-8 rounded-2xl shadow-sm border border-gray-100 prose prose-blue max-w-none">\n' +
    '        <h2 class="text-2xl font-bold font-display text-blue-600 mb-4">Mastering ' + subject + ' in MSBTE ' + scheme + '</h2>\n' +
    '        <p>Studying <strong>' + subject + '</strong> can be a challenging yet highly rewarding experience for diploma students, particularly those enrolled in the MSBTE ' + scheme + '. Whether you are in ' + branchesStr + ' pursuing your ' + semester + ', practicing with the right question banks for ' + subject + ' is absolutely essential for your academic and professional growth. This page provides an exhaustive collection of important questions tailored specifically to fulfill the MSBTE curriculum requirements.</p>\n' +
    '        \n' +
    '        <h3 class="text-xl font-bold font-display text-gray-800 mt-6 mb-3">Why Quality Question Banks Matter?</h3>\n' +
    '        <p>Preparing for MSBTE board exams demands clear concepts, persistent practice, and access to premium quality educational resources. The question banks, unit test papers, and model answers provided here for ' + subject + ' are meticulously arranged to ensure you grasp complex theories effortlessly. It is not just about memorization; it is about deeply understanding the fundamentals that will empower you in your technical career. Earning top grades requires smart study plans, and our optimized PDFs act as your perfect companion.</p>\n' +
    '        \n' +
    '        <h3 class="text-xl font-bold font-display text-gray-800 mt-6 mb-3">What You Will Find Here</h3>\n' +
    '        <ul class="list-disc pl-5 space-y-2 mt-2">\n' +
    '            <li><strong>Question Banks:</strong> Comprehensive collections of important questions to help you prepare effectively for all chapters prescribed in the MSBTE syllabus.</li>\n' +
    '            <li><strong>Unit Tests &amp; Previous Papers:</strong> Access previous unit tests and model question papers to anticipate exam patterns and secure higher marks.</li>\n' +
    '            <li><strong>Model Answers:</strong> Step-by-step guidance and detailed solutions for examinations to ensure you know exactly how to score.</li>\n' +
    '            <li><strong>Downloadable PDFs:</strong> High-quality, mobile-friendly PDF files that you can access anytime, anywhere, or even download offline via Google Drive backup links.</li>\n' +
    '        </ul>\n' +
    '        \n' +
    '        <h3 class="text-xl font-bold font-display text-gray-800 mt-6 mb-3">Tips to Score Highest Marks</h3>\n' +
    '        <p>Consistent revision is the key. Make sure to download the Unit Test papers available above and solve them under timed conditions. Focus on the repeated questions and deeply review the step-by-step solutions. We highly recommend discussing these question banks in your student forums and study groups. By fully leveraging these free educational resources, you are setting yourself on a clear path to extraordinary performance in your MSBTE examinations. Share these resources with your classmates and join our community to stay updated on the latest academic materials and trending technical topics!</p>\n' +
    '    </section>\n' +
    '    ';
}

function main() {
    if (!fs.existsSync(CSV_FILE)) {
        console.error("Error: CSV_FILE not found.");
        return;
    }

    // 1. Run cleanup
    cleanup();
    
    // 2. Load template and parse CSV
    const template = fs.readFileSync(TEMPLATE_FILE, 'utf-8');
    const subjects = processCsvSync();
    
    let resourcesJson = [];
    try {
        if (fs.existsSync(JSON_FILE)) {
            resourcesJson = JSON.parse(fs.readFileSync(JSON_FILE, 'utf-8'));
        }
    } catch (e) {
        console.warn("Could not parse JSON. Starting fresh.");
        resourcesJson = [];
    }

    const newEntries = [];
    const currentDate = new Date().toISOString().split('T')[0];

    const subjectKeys = Object.keys(subjects);
    
    for (let i = 0; i < subjectKeys.length; i++) {
        const subject = subjectKeys[i];
        const data = subjects[subject];
        const slug = createSlug(subject);
        
        const branchesList = Array.from(data.branches);
        const branchesStr = branchesList.slice(0, 3).join(", ") + (branchesList.length > 3 ? " and others" : "");
        
        let yearLevel = "Diploma";
        if (data.semester.includes("First Year")) yearLevel = "First Year";
        else if (data.semester.includes("Second Year")) yearLevel = "Second Year";
        else if (data.semester.includes("Third Year")) yearLevel = "Third Year";

        const thumbUrl = generateSvg(subject, slug, i);
        
        let resourcesHtml = '<div class="grid gap-6 mt-6">';
        for (const res of data.resources) {
            const driveBtn = res.drive && res.drive.startsWith('http') ? '<a href="' + res.drive + '" target="_blank" class="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-lg font-semibold transition flex items-center justify-center gap-2">Backup (Drive)</a>' : '';
            const pdfBtn = res.pdf && res.pdf.startsWith('http') ? '<a href="' + res.pdf + '" target="_blank" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition flex items-center justify-center gap-2">View/Download PDF</a>' : '';
            resourcesHtml += '\n' +
            '            <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition">\n' +
            '                <h4 class="text-lg font-bold text-gray-900 mb-4">' + res.type + '</h4>\n' +
            '                <div class="flex flex-wrap gap-3">\n' +
            '                    ' + pdfBtn + '\n' +
            '                    ' + driveBtn + '\n' +
            '                </div>\n' +
            '            </div>\n' +
            '            ';
        }
        resourcesHtml += '</div>';
        
        resourcesHtml += generateSeoText(subject, branchesStr, data.scheme, data.semester);

        let htmlContent = template.replace(/\{\{TITLE_TAG\}\}/g, subject + ' Question Banks & PDFs - MSBTE ' + data.scheme);
        htmlContent = htmlContent.replace(/\{\{META_DESCRIPTION\}\}/g, 'Download ' + subject + ' question banks, previous year papers, and study materials for MSBTE ' + data.scheme + '. Free PDF downloads for highest marks.');
        htmlContent = htmlContent.replace(/\{\{META_KEYWORDS\}\}/g, subject + ', MSBTE question banks, MSBTE ' + data.scheme + ', ' + yearLevel + ' question banks, ' + branchesList[0] + ' question banks');
        htmlContent = htmlContent.replace(/\{\{SLUG\}\}/g, slug);
        htmlContent = htmlContent.replace(/\{\{SUBJECT\}\}/g, subject);
        htmlContent = htmlContent.replace(/\{\{DATE_PUBLISHED\}\}/g, currentDate);
        htmlContent = htmlContent.replace(/\{\{SEMESTER\}\}/g, data.semester);
        htmlContent = htmlContent.replace(/\{\{YEAR_LEVEL\}\}/g, yearLevel);
        htmlContent = htmlContent.replace(/\{\{RESOURCES_SECTION\}\}/g, resourcesHtml);

        htmlContent = htmlContent.replace('content="https://msbtenotes-info.netlify.app/resourse/blog-resourse/advanced-java-notes.png"', 'content="https://msbtenotes-info.netlify.app' + thumbUrl + '"');
        htmlContent = htmlContent.replace('src="https://msbtenotes-info.netlify.app/resourse/blog-resourse/advanced-java-notes.png"', 'src="' + thumbUrl + '"');

        const pageUrl = '/Notes/' + slug + '.html';
        fs.writeFileSync(path.join(NOTES_DIR, slug + '.html'), htmlContent, 'utf-8');

        // Close the Active Document from VS Code before replacing it! The user has basic-electrical.html open
        // VS Code handles file updates externally fine, just updating it.

        const entryData = {
            title: subject + ' - ' + data.semester + ' Question Bank',
            description: 'Download ' + subject + ' question banks, model answers, and study materials for ' + data.semester + ', ' + yearLevel + '.',
            url: pageUrl,
            thumbnail: thumbUrl,
            category: "question-bank",
            tags: [subject, data.semester, yearLevel, "MSBTE", data.scheme],
            dateAdded: currentDate
        };

        const existingIndex = resourcesJson.findIndex(item => item.url === pageUrl);
        if (existingIndex > -1) {
            resourcesJson[existingIndex] = { ...resourcesJson[existingIndex], ...entryData };
        } else {
            newEntries.push(entryData);
        }
    }

    console.log("Generated " + subjectKeys.length + " clean pages and SVGs.");

    if (newEntries.length > 0 || resourcesJson.length > 0) {
        const finalList = [...newEntries, ...resourcesJson];
        const uniqueMap = new Map();
        finalList.forEach(item => uniqueMap.set(item.url, item));
        
        fs.writeFileSync(JSON_FILE, JSON.stringify(Array.from(uniqueMap.values()), null, 4), 'utf-8');
        console.log("Updated JSON. Total resources now: " + uniqueMap.size);
    }
}

main();
