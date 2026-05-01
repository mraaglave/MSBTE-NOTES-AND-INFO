const fs = require('fs');
const path = require('path');

const csvPath = path.join(process.cwd(), 'Branches/msbte_k_scheme_syllabus.csv');
const branchesDir = path.join(process.cwd(), 'Branches');

const csv = fs.readFileSync(csvPath, 'utf-8');
const lines = csv.split('\n');

const updates = {};
for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Match the URL at the end of the line
    const urlMatch = line.match(/(http[s]?:\/\/[^,]+?)["\s]*$/);
    if (!urlMatch) continue;
    const url = urlMatch[1];
    
    // Match the 6-digit subject code
    const codeMatch = line.match(/\b(\d{6})\b/);
    if (codeMatch) {
        updates[codeMatch[1]] = url;
    }
}

const files = fs.readdirSync(branchesDir).filter(f => f.endsWith('.html'));
let changedFilesCount = 0;
let totalReplaced = 0;

for (const file of files) {
    const filePath = path.join(branchesDir, file);
    let content = fs.readFileSync(filePath, 'utf-8');
    let originalContent = content;
    
    content = content.replace(/<tr[\s\S]*?<\/tr>/gi, (trMatch) => {
        let newTr = trMatch;
        for (const code in updates) {
            if (newTr.includes(code)) {
                const newUrl = updates[code];
                // replace the .pdf link if it exists
                newTr = newTr.replace(/href="([^"]+\.pdf)"/i, `href="${newUrl}"`);
            }
        }
        if (newTr !== trMatch) {
            totalReplaced++;
        }
        return newTr;
    });
    
    if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf-8');
        changedFilesCount++;
    }
}

console.log('Done. Updated ' + changedFilesCount + ' files. Total PDF links replaced: ' + totalReplaced);
