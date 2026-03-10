const fs = require('fs');
const path = require('path');

const CSV_FILE = path.join(__dirname, 'Notes', 'notes - notes.csv');
const OUT_FILE = path.join(__dirname, 'Notes', 'subject_links.csv');

function createSlug(text) {
    return String(text)
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
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

function main() {
    if (!fs.existsSync(CSV_FILE)) {
        console.error("Error: CSV_FILE not found.");
        return;
    }

    const content = fs.readFileSync(CSV_FILE, 'utf-8');
    const lines = content.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const subjIdx = headers.indexOf('Subject / Test Name');

    const uniqueSubjects = new Set();

    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const row = lines[i].split(',');
        const testName = row[subjIdx] ? row[subjIdx].trim() : '';
        const coreSub = extractCoreSubject(testName);
        if (coreSub) {
            uniqueSubjects.add(coreSub);
        }
    }

    let outCsv = "Subject Name,Page Link\n";
    uniqueSubjects.forEach(subject => {
        const slug = createSlug(subject);
        const url = `https://msbtenotes-info.netlify.app/Notes/${slug}.html`;
        outCsv += `"${subject}","${url}"\n`;
    });

    fs.writeFileSync(OUT_FILE, outCsv, 'utf-8');
    console.log(`Exported ${uniqueSubjects.size} subjects to ${OUT_FILE}`);
}

main();
