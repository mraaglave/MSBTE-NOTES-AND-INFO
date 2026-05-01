const fs = require('fs');
const path = require('path');

const dir = 'Branches';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

let missingAds = [];
let missingAnalytics = [];

files.forEach(f => {
    const content = fs.readFileSync(path.join(dir, f), 'utf-8');
    if (!content.includes('client=ca-pub-9227354288966999')) {
        missingAds.push(f);
    }
    if (!content.includes('id=G-H5G5CCD95W')) {
        missingAnalytics.push(f);
    }
});

console.log('Missing AdSense:', missingAds.length);
console.log('Missing Analytics:', missingAnalytics.length);
if (missingAds.length > 0) {
    console.log('Sample missing ads:', missingAds.slice(0, 5));
}
