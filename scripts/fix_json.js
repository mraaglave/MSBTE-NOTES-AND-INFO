const fs = require('fs');

let content = fs.readFileSync('blogs.json', 'utf-8');

// Fix encoding issue: "Â·" should be "·" (middle dot)
content = content.replace(/Â·/g, '·');

const data = JSON.parse(content);

// Add missing shortTitle for "top-5-engineering-colleges-maharashtra"
data.forEach(item => {
    if (item.id === 'top-5-engineering-colleges-maharashtra' && !item.shortTitle) {
        item.shortTitle = 'Top 5 Engineering Colleges Maharashtra';
        console.log('Added shortTitle to:', item.id);
    }
    if (item.id === 'niti-aayog-internship-2026' && !item.shortTitle) {
        item.shortTitle = 'NITI Aayog Internship 2026';
        console.log('Added shortTitle to:', item.id);
    }
    if (item.id === 'programming-in-c-312303' && !item.shortTitle) {
        item.shortTitle = 'Programming in C Notes';
        console.log('Added shortTitle to:', item.id);
    }
    if (item.id === 'ugc-new-rules-2026' && !item.shortTitle) {
        item.shortTitle = 'UGC Reforms 2026';
        console.log('Added shortTitle to:', item.id);
    }
    if (item.id === 'msbte-academic-calendar-2025-26' && !item.shortTitle) {
        item.shortTitle = 'MSBTE Academic Calendar 2025-26';
        console.log('Added shortTitle to:', item.id);
    }
});

fs.writeFileSync('blogs.json', JSON.stringify(data, null, 4), 'utf-8');
console.log('Done! Total entries:', data.length);
