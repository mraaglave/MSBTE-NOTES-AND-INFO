const fs = require('fs');
const path = require('path');

const TARGET_FILE = process.argv[2]
    ? path.resolve(process.argv[2])
    : path.join(__dirname, '..', 'Blog', 'msbte-summer-2026-exam-result-date-and-link.html');

function validate() {
    console.log("Checking schemas in:", TARGET_FILE);
    if (!fs.existsSync(TARGET_FILE)) {
        console.error("Target file does not exist.");
        process.exit(1);
    }

    const content = fs.readFileSync(TARGET_FILE, 'utf8');
    
    // Extract script tags matching application/ld+json
    const scriptRegex = /<script\s+type="application\/ld\+json">([\s\S]*?)<\/script>/gi;
    let match;
    let count = 0;
    let hasError = false;

    while ((match = scriptRegex.exec(content)) !== null) {
        count++;
        const jsonText = match[1].trim();
        console.log(`\n--- Found Schema Block ${count} ---`);
        try {
            const parsed = JSON.parse(jsonText);
            console.log(`Type: ${parsed['@type']}`);
            console.log(`Context: ${parsed['@context']}`);
            console.log("Status: VALID JSON");
            
            // Basic semantic checks
            if (!parsed['@context'] || !parsed['@type']) {
                console.warn("Warning: Missing @context or @type!");
            }
        } catch (e) {
            console.error("Status: INVALID JSON!");
            console.error("Error Message:", e.message);
            console.error("Invalid Snippet:\n", jsonText);
            hasError = true;
        }
    }

    if (count === 0) {
        console.warn("No JSON-LD schema blocks found!");
    } else {
        console.log(`\nValidation completed. Found ${count} blocks.`);
    }

    if (hasError) {
        process.exit(1);
    } else {
        console.log("All schemas validated successfully!");
    }
}

validate();
