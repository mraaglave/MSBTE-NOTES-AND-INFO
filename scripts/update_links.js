const fs = require('fs');
const path = require('path');

const csvPath = path.join(process.cwd(), 'Notes/subject_links.csv');
const branchesDir = path.join(process.cwd(), 'Branches');

const csv = fs.readFileSync(csvPath, 'utf-8');
const lines = csv.split('\n');

const updates = [];
for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const parts = line.split('","');
    if (parts.length === 2) {
        const titlePart = parts[0].replace(/^"/, '');
        const urlPart = parts[1].replace(/"$/, '');
        
        const codeMatch = titlePart.match(/^(\d{6})/);
        if (codeMatch) {
            const code = codeMatch[1];
            let relativeUrl = urlPart;
            if (urlPart.startsWith('http')) {
                try {
                    relativeUrl = new URL(urlPart).pathname;
                } catch(e){}
            }
            updates.push({ code, url: relativeUrl });
        }
    }
}

const files = fs.readdirSync(branchesDir).filter(f => f.endsWith('.html'));

let changedFilesCount = 0;
let totalReplaced = 0;

for (const file of files) {
    const filePath = path.join(branchesDir, file);
    let content = fs.readFileSync(filePath, 'utf-8');
    let originalContent = content;
    
    for (const update of updates) {
        const regex = new RegExp('href="([^"/]*' + update.code + '-[^"/]*\\.html)"', 'g');
        content = content.replace(regex, (match, p1) => {
            if (p1 !== update.url && !p1.startsWith('/Notes/')) {
                totalReplaced++;
                return 'href="' + update.url + '"';
            }
            return match;
        });
    }
    
    if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf-8');
        changedFilesCount++;
    }
}
console.log('Done. Updated ' + changedFilesCount + ' files. Total links replaced: ' + totalReplaced);
