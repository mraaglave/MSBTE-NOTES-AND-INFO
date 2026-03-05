const fs = require('fs');
const files = [
    'Branches/Computer-I-Scheme.html',
    'Branches/Computer-I-Scheme-Semester-1.html',
    'Branches/Computer-I-Scheme-Semester-2.html',
    'Branches/Computer-I-Scheme-Semester-3.html',
    'Branches/Computer-I-Scheme-Semester-4.html',
    'Branches/Computer-I-Scheme-Semester-5.html'
];

for (let file of files) {
    if (!fs.existsSync(file)) {
        console.log(`File missing: ${file}`);
        continue;
    }

    let content = fs.readFileSync(file, 'utf8');

    // Replace OG image
    content = content.replace(
        'https://msbtenotes-info.netlify.app/Branches/media/Computer.svg',
        'https://msbtenotes-info.netlify.app/resourse/blog-resourse/computer-i-scheme.svg'
    );

    // Insert thumbnail image
    const imgBlock = `        <!-- Thumbnail Image -->
        <div class="max-w-4xl mx-auto mb-10 px-4 sm:px-0 transition-transform duration-500 hover:scale-[1.01]">
            <img src="/resourse/blog-resourse/computer-i-scheme.svg" alt="Computer Engineering I-Scheme Question Papers" class="w-full rounded-2xl shadow-xl border border-gray-200" />
        </div>`;
    // ensure we don't insert it twice
    if (!content.includes('computer-i-scheme.svg" alt="Computer')) {
        content = content.replace('</header>', '</header>\n\n' + imgBlock);
    }

    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated ${file}`);
}

// Add the thumbnail card to Notes page
const notesPath = 'Notes/msbte-computer-engg-question-bank.html';
if (fs.existsSync(notesPath)) {
    let notesContent = fs.readFileSync(notesPath, 'utf8');

    // Let's find the related articles grid and inject the new card
    const cardHtml = `            <a href="/Branches/Computer-I-Scheme.html"
                class="block bg-white rounded-xl shadow hover:shadow-lg transition overflow-hidden border-2 border-transparent hover:border-blue-500">
                <img src="/resourse/blog-resourse/computer-i-scheme.svg" alt="Computer Engineering I-Scheme Question Papers"
                    class="w-full h-40 object-cover">
                <div class="p-4 bg-blue-50">
                    <span class="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-1 rounded-full mb-2 inline-block">HOT ✨</span>
                    <h3 class="font-bold text-blue-800">I-Scheme Computer Engineering Previous Papers</h3>
                </div>
            </a>`;

    // We want to insert it right after '<div id="relatedContainer" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">'
    // Or if that isn't exact, after '<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">'
    const gridRegex = /<div [^>]*class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"[^>]*>/;

    if (!notesContent.includes('/Branches/Computer-I-Scheme.html')) {
        notesContent = notesContent.replace(gridRegex, match => match + '\n' + cardHtml);
        fs.writeFileSync(notesPath, notesContent, 'utf8');
        console.log(`Added card to ${notesPath}`);
    }
}
