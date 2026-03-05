const fs = require('fs');

const filesToUpdate = {
    "Notes/msbte-computer-engg-question-bank.html": {
        branch: "Computer Engineering (CO)",
        intro: "Preparing for MSBTE exams requires access to the right study materials. This page provides a\n                comprehensive collection of free K-Scheme Computer Engineering (CO) question banks and unit test papers from\n                Bharati Vidyapeeth's Institute of Technology, Navi Mumbai."
    },
    "Notes/msbte-civil-engg-question-bank.html": {
        branch: "Civil Engineering (CE)",
        intro: "Preparing for MSBTE exams requires access to the right study materials. This page provides a\n                comprehensive collection of free K-Scheme Civil Engineering (CE) question banks and unit test papers from\n                Bharati Vidyapeeth's Institute of Technology, Navi Mumbai."
    },
    "Notes/msbte-mech-engg-question-bank.html": {
        branch: "Mechanical Engineering (ME)",
        intro: "Preparing for MSBTE exams requires access to the right study materials. This page provides a\n                comprehensive collection of free K-Scheme Mechanical Engineering (ME) question banks and unit test papers from\n                Bharati Vidyapeeth's Institute of Technology, Navi Mumbai."
    },
    "Notes/msbte-electrical-engg-question-bank.html": {
        branch: "Electrical Engineering (EE)",
        intro: "Preparing for MSBTE exams requires access to the right study materials. This page provides a\n                comprehensive collection of free K-Scheme Electrical Engineering (EE) question banks and unit test papers from\n                Bharati Vidyapeeth's Institute of Technology, Navi Mumbai."
    },
    "Notes/msbte-etc-engg-question-bank.html": {
        branch: "Electronics and Telecommunication Engineering (E&TC)",
        intro: "Preparing for MSBTE exams requires access to the right study materials. This page provides a\n                comprehensive collection of free K-Scheme Electronics and Telecommunication Engineering (E&TC) question banks and unit test papers from\n                Bharati Vidyapeeth's Institute of Technology, Navi Mumbai."
    },
    "Notes/msbte-it-engg-question-bank.html": {
        branch: "Information Technology (IT)",
        intro: "Preparing for MSBTE exams requires access to the right study materials. This page provides a\n                comprehensive collection of free K-Scheme Information Technology (IT) question banks and unit test papers from\n                Bharati Vidyapeeth's Institute of Technology, Navi Mumbai."
    }
};

const seoTemplate = (branch, intro) => `        <div class="prose prose-blue max-w-none">
            <p>
                ${intro.trim()} These resources are designed to help you precisely understand the exam pattern, important topics, and practice effectively for your upcoming academic assessments.
            </p>
            <h2 class="text-2xl font-bold text-blue-600 font-display mt-8">Why Are ${branch} Question Banks Essential for High Scores?</h2>
            <p>
                In the highly competitive environment of MSBTE diploma programs, simply studying from course textbooks is often not enough to secure top grades. The examination board strictly follows specific question patterns, focusing heavily on core principles, technical applications, and analytical problem-solving. By consistently practicing with official ${branch} unit test papers and comprehensive question banks, students gain an invaluable strategic advantage. It allows you to rapidly identify frequently asked questions, clearly understand the official marking scheme, and perfect your time-management skills during actual examination settings.
            </p>
            <h3 class="text-xl font-bold text-gray-800 font-display mt-6">Unlocking Excellent Academic Performance</h3>
            <p>
                Whether you are preparing for your mid-semester unit evaluations or gearing up for the rigorous final Summer/Winter exams, leveraging proper study materials guarantees tremendous results. These expertly curated ${branch} resources bridge the gap between theoretical knowledge and practical exam execution. As a technical student, you must learn to format your answers professionally—with neat diagrams, structured flowcharts, and concise step-by-step logic—to ensure you never lose easy marks. Cultivating this essential habit consistently dramatically reduces exam-day anxiety and significantly boosts your overall aggregate percentage.
            </p>
            <h3 class="text-xl font-bold text-gray-800 font-display mt-6">Free Access for Student Empowerment</h3>
            <p>
                At MSBTE Notes & Info, our fundamental mission is to universally democratize high-quality technical education. We firmly believe that every single engineering student genuinely deserves direct access to premium study resources, completely free of cost. These authentic PDF documents compiled directly from highly reputed institutions will serve as your ultimate roadmap to achieving academic excellence and embarking on a successful, lucrative engineering career. Bookmark this page securely and make these official papers a mandatory part of your daily revision routine!
            </p>
        </div>`;

for (const [filepath, data] of Object.entries(filesToUpdate)) {
    if (fs.existsSync(filepath)) {
        let content = fs.readFileSync(filepath, 'utf8');
        const pattern = /<div class="prose prose-blue max-w-none">[\s\S]*?<\/div>\s*<!-- Ads -->/;
        const newBlock = seoTemplate(data.branch, data.intro) + "\n\n        <!-- Ads -->";
        if (pattern.test(content)) {
            content = content.replace(pattern, newBlock);
            fs.writeFileSync(filepath, content, 'utf8');
            console.log("Updated " + filepath);
        } else {
            console.log("Pattern not found in " + filepath);
        }
    }
}

// Master
const masterPath = "Notes/msbte-k-scheme-question-banks.html";
if (fs.existsSync(masterPath)) {
    let masterContent = fs.readFileSync(masterPath, 'utf8');
    const masterSeo = `        <div class="prose prose-blue max-w-none">
            <p>
                Preparing for MSBTE K-Scheme exams successfully requires the ultimate integration of precise study materials. This definitive page actively serves as your central repository, providing a comprehensive, constantly updated collection of official unit test papers and verified question banks directly from Bharati Vidyapeeth's Institute of Technology, Navi Mumbai. All vital resources are intuitively organized by respective engineering departments for exceptionally quick, incredibly easy, and completely free high-quality PDF downloads.
            </p>
            <h2 class="text-2xl font-bold text-blue-600 font-display mt-8">Why Use These Master Question Banks to Maximize Your Diploma Score?</h2>
            <p>
                Engineering students frequently face immense academic pressure to secure top-tier percentages, largely due to the intense competition for esteemed degree campus placements and highly selective direct second-year engineering admissions. Utilizing official K-Scheme MSBTE question repositories is undeniably the smartest strategic approach. These extensively verified documents completely eliminate unnecessary guesswork regarding the syllabus weightage. They proactively highlight highly repetitive subject topics, strongly enforce proper formatting habits, and actively train students to write highly concise, examiner-friendly answers. 
            </p>
            <h3 class="text-xl font-bold text-gray-800 font-display mt-6">The Power of Official Question Papers</h3>
            <ul>
                <li><strong>Authentic Official Resources:</strong> Every single paper featured here undeniably constitutes an authentic official document accurately sourced from a highly reputable technological institute, rigorously guaranteeing supreme academic authenticity.</li>
                <li><strong>Deeply Understand Exam Patterns:</strong> Swiftly and comprehensively establish a crystal-clear understanding of the nuanced question formats, the exceptionally strict official marking schemes, and the most critical high-weightage topics spanning across every single technical subject.</li>
                <li><strong>Strategic Practice for Unparalleled Success:</strong> Actively solving these exact past examination papers relentlessly tests your conceptual knowledge under strict time constraints, fundamentally teaching you to effortlessly manage your limited time effectively, consequently boosting your overall psychological confidence exponentially before sitting your board exams.</li>
                <li><strong>Completely 100% Free Forever:</strong> All of these meticulously curated, highly valuable K-Scheme question banks undeniably remain available for completely unrestricted free download, unequivocally supporting your empowering educational journey without any financial burden whatsoever.</li>
            </ul>
        </div>`;
    const patternMaster = /<div class="prose prose-blue max-w-none">[\s\S]*?<\/div>\s*<\/article>/;
    if (patternMaster.test(masterContent)) {
        masterContent = masterContent.replace(patternMaster, masterSeo + "\n    </article>");
        fs.writeFileSync(masterPath, masterContent, 'utf8');
        console.log("Updated " + masterPath);
    } else {
        console.log("Pattern not found in " + masterPath);
    }
}
