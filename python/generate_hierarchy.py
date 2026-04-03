
import json
import os
import re
import html
import datetime

# Configuration
JSON_PATH = r'c:\Users\bitbu\OneDrive\Documents\GitHub\MSBTE-NOTES-AND-INFO\scheme\Kscheme.json'
OUTPUT_DIR = r'c:\Users\bitbu\OneDrive\Documents\GitHub\MSBTE-NOTES-AND-INFO\Branches'
MEDIA_DIR = r'c:\Users\bitbu\OneDrive\Documents\GitHub\MSBTE-NOTES-AND-INFO\Branches\media'
BASE_URL = "https://msbtenotes-info.netlify.app"

# Branch Mapping
BRANCH_MAP = {
    "Computer Technology": "Computer",
    "Electronics and Telecommunication": "ETC-Engineering",
    "Information Technology": "Information-Technology",
    "Mechanical Engineering": "Mechanical-Engineering",
    "Civil Engineering": "Civil",
    "Electrical Engineering": "Electrical-Engineering",
    "Artificial Intelligence & Machine Learning": "AI-ML"
}

# Semester Mapping
SEM_MAP = {
    "First Year First Semester": 1,
    "First Year Second Semester": 2,
    "Second Year Third Semester": 3,
    "Second Year Fourth Semester": 4,
    "Third Year Fifth Semester": 5,
    "Third Year Sixth Semester": 6
}

# Ensure media directory exists
os.makedirs(MEDIA_DIR, exist_ok=True)

def create_svg(filename, title, subtitle):
    """Generates an SVG file with the given title and subtitle."""
    svg_content = f"""<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1e3a8a;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#3b82f6;stop-opacity:1" />
    </linearGradient>
    <pattern id="pattern1" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
      <circle cx="2" cy="2" r="1" fill="rgba(255,255,255,0.1)" />
    </pattern>
  </defs>
  <rect width="1200" height="630" fill="url(#grad1)" />
  <rect width="1200" height="630" fill="url(#pattern1)" />
  
  <text x="600" y="280" font-family="Arial, sans-serif" font-weight="bold" font-size="70" fill="white" text-anchor="middle" dominant-baseline="middle">
    {html.escape(title)}
  </text>
  <text x="600" y="380" font-family="Arial, sans-serif" font-size="40" fill="#bfdbfe" text-anchor="middle" dominant-baseline="middle">
    {html.escape(subtitle)}
  </text>
  <text x="600" y="550" font-family="Arial, sans-serif" font-size="25" fill="rgba(255,255,255,0.8)" text-anchor="middle">
    msbtenotes-info.netlify.app
  </text>
</svg>"""
    
    with open(os.path.join(MEDIA_DIR, filename), 'w', encoding='utf-8') as f:
        f.write(svg_content)

# --- TEMPLATES ---

# 1. Subject Page Template
SUBJECT_TEMPLATE = """<!DOCTYPE html>
<html lang="en">

<head>
    <!-- Google tag (gtag.js) -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-H5G5CCD95W"></script>
    <script>
        window.dataLayer = window.dataLayer || [];
        function gtag() {{ dataLayer.push(arguments); }}
        gtag('js', new Date());
        gtag('config', 'G-H5G5CCD95W');
    </script>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{subject_name} ({subject_code}) K-Scheme Syllabus & Notes PDF</title>
    <meta name="description"
        content="Free Download MSBTE K-Scheme Syllabus and Notes for {subject_name} ({subject_code}). Official study material for {branch_name} Semester {sem_num}." />
    <meta name="keywords"
        content="MSBTE, K-Scheme, {subject_name}, {subject_code}, {branch_name}, Diploma, Notes, Syllabus, PDF, Question Paper, Solved Manual, Important Questions, MSBTE Result" />
    <meta name="author" content="MSBTE Notes & Info Team" />
    <link rel="canonical" href="{canonical_url}" />

    <!-- Open Graph / Facebook -->
    <meta property="og:title" content="{subject_name} ({subject_code}) Syllabus & Notes | MSBTE" />
    <meta property="og:description"
        content="Get official MSBTE K-Scheme Syllabus, Notes, and Important Questions for {subject_name} ({subject_code}). Free PDF Download." />
    <meta property="og:type" content="article" />
    <meta property="og:url" content="{canonical_url}" />
    <meta property="og:image" content="{base_url}/Branches/media/{svg_filename}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:type" content="image/svg+xml" />

    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="{subject_name} ({subject_code}) Syllabus & Notes | MSBTE" />
    <meta name="twitter:description"
        content="Download MSBTE K-Scheme Syllabus and Notes for {subject_name} ({subject_code})." />
    <meta name="twitter:image" content="{base_url}/Branches/media/{svg_filename}" />

    <!-- Breadcrumb Structured Data -->
    <script type="application/ld+json">
    {{
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [{{
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "{base_url}/"
      }},{{
        "@type": "ListItem",
        "position": 2,
        "name": "{branch_name}",
        "item": "{base_url}/Branches/{branch_filename}"
      }},{{
        "@type": "ListItem",
        "position": 3,
        "name": "Semester {sem_num}",
        "item": "{base_url}/Branches/{semester_filename}"
      }},{{
        "@type": "ListItem",
        "position": 4,
        "name": "{subject_name} ({subject_code})"
      }}]
    }}
    </script>
    
    <!-- FAQ Structured Data -->
    <script type="application/ld+json">
    {{
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [{{
        "@type": "Question",
        "name": "Where can I download the {subject_name} ({subject_code}) syllabus?",
        "acceptedAnswer": {{
          "@type": "Answer",
          "text": "You can download the official MSBTE K-Scheme syllabus PDF for {subject_name} ({subject_code}) directly from the download button on this page."
        }}
      }},{{
        "@type": "Question",
        "name": "Is this syllabus for the latest MSBTE K-Scheme?",
        "acceptedAnswer": {{
          "@type": "Answer",
          "text": "Yes, this syllabus and notes are specifically designed for the Master of Science Board of Technical Education (MSBTE) K-Scheme curriculum."
        }}
      }},{{
        "@type": "Question",
        "name": "How can I contribute notes for {subject_name}?",
        "acceptedAnswer": {{
          "@type": "Answer",
          "text": "You can contribute your notes by clicking the 'Upload Your Notes' button on this page. Your contribution will help thousands of other students."
        }}
      }}]
    }}
    </script>

    <!-- Tailwind & Fonts -->
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://api.fontshare.com/v2/css?f[]=clash-display@600&display=swap" rel="stylesheet">

    <!-- Favicon and App Icons -->
    <link rel="apple-touch-icon" sizes="180x180" href="/resourse/apple-touch-icon.png">
    <link rel="icon" type="image/png" sizes="32x32" href="/resourse/favicon-32x32.png">
    <link rel="icon" type="image/png" sizes="16x16" href="/resourse/favicon-16x16.png">
    <link rel="manifest" href="/resourse/site.webmanifest">
    <link rel="icon" href="/resourse/favicon.ico" type="image/x-icon">
    <link rel="shortcut icon" href="/resourse/favicon.ico">

    <link rel="stylesheet" href="/style.css">
    <style>
        .font-display {{
            font-family: 'Clash Display', sans-serif;
        }}
    </style>
    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9227354288966999"
        crossorigin="anonymous"></script>
</head>

<body class="bg-gray-50 text-gray-900 pt-16">

    <!-- Header -->
    <nav class="bg-white shadow fixed top-0 left-0 right-0 z-50">
        <div class="max-w-9xl mx-auto px-4 flex justify-between items-center h-16">
            <a href="/" class="flex items-center text-blue-600 font-bold text-xl font-display">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7 mr-2" viewBox="0 0 576 512" fill="currentColor">
                    <path
                        d="M249.6 471.5c10.8 3.8 22.4-4.1 22.4-15.5V78.6c0-4.2-1.6-8.4-5-11C247.4 52 202.4 32 144 32C93.5 32 46.3 45.3 18.1 56.1C6.8 60.5 0 71.7 0 83.8V454.1c0 11.9 12.8 20.2 24.1 16.5C55.6 460.1 105.5 448 144 448c33.9 0 79 14 105.6 23.5zm76.8 0C353 462 398.1 448 432 448c38.5 0 88.4 12.1 119.9 22.6c11.3 3.8 24.1-4.6 24.1-16.5V83.8c0-12.1-6.8-23.3-18.1-27.6C529.7 45.3 482.5 32 432 32c-58.4 0-103.4 20-123 35.6c-3.3 2.6-5 6.8-5 11V456c0 11.4 11.7 19.3 22.4 15.5z" />
                </svg>
                MSBTE Notes & Info
            </a>
            <div class="hidden md:flex space-x-6">
                <a href="/about.html" class="hover:text-blue-600">About</a>
                <a href="/contact.html" class="hover:text-blue-600">Contact</a>
                <a href="/privacy-policy.html" class="hover:text-blue-600">Privacy</a>
            </div>
            <button onclick="toggleMobileMenu()" class="md:hidden text-blue-600 text-3xl font-bold">≡</button>
        </div>
        <div id="mobileNav" class="md:hidden hidden bg-white shadow px-4 py-2">
            <a href="/about.html" class="block py-2">About</a>
            <a href="/contact.html" class="block py-2">Contact</a>
            <a href="/privacy-policy.html" class="block py-2">Privacy Policy</a>
        </div>
    </nav>

    <!-- Main Content -->
    <main class="max-w-4xl mx-auto px-4 pt-8 pb-12">
        <header class="text-center mb-8">
             <div class="relative overflow-hidden rounded-xl shadow-lg mb-8">
                <img src="media/{svg_filename}" alt="{subject_name} Syllabus Banner" class="w-full h-auto object-cover">
            </div>
            <h1 class="text-3xl sm:text-4xl font-bold text-blue-600 font-display">{subject_name} ({subject_code})</h1>
            <p class="mt-2 text-gray-600">MSBTE K-Scheme, {branch_name} - Semester {sem_num}</p>
        </header>

        <div class="bg-white p-6 rounded-lg shadow-md">
            <!-- Syllabus Link -->
            <div class="mb-6 text-center">
                <h2 class="text-2xl font-semibold font-display text-gray-800 mb-3">Syllabus</h2>
                 <p class="text-gray-600 mb-4">Click the button below to download the official MSBTE K-Scheme Syllabus PDF for {subject_name}.</p>
                <a href="{syllabus_link}"
                    target="_blank"
                    class="inline-block bg-blue-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-blue-700 transition-colors duration-300 shadow-md">
                    Download Syllabus PDF ⬇
                </a>
            </div>

            <hr class="my-8 border-gray-200">

            <!-- Contribution Section -->
            <div class="text-center">
                <h3 class="text-xl font-semibold font-display text-gray-800 mb-2">Help Your Peers!</h3>
                <p class="text-gray-600 mb-4">
                    Currently, we don't have notes for this subject. If you have notes, please consider sharing them. Your contribution will be a great help to other students, and we will give you proper credit for your work.
                </p>
                <a href="https://docs.google.com/forms/d/e/1FAIpQLSecpLUBl47V_FqSeVlzhhVVFjQFjgRRQWQltb0RLSC0GO1MSQ/viewform?usp=dialog"
                    target="_blank"
                    class="inline-block bg-green-500 text-white px-8 py-3 rounded-lg font-bold hover:bg-green-600 transition-colors duration-300 shadow-md">
                    Upload Your Notes 🚀
                </a>
            </div>
        </div>
    </main>

    <!-- Footer -->
    <footer class="bg-blue-600 text-white mt-16 py-10">
        <div class="max-w-6xl mx-auto px-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            <div>
                <h3 class="text-xl font-semibold mb-4">About Us</h3>
                <p class="text-sm">We provide free and premium study materials, notes, and guidance for MSBTE diploma
                    engineering students across all departments.</p>
            </div>
            <div>
                <h3 class="text-xl font-semibold mb-4">Quick Links</h3>
                <ul class="space-y-2 text-sm">
                    <li><a href="/" class="hover:underline">Home</a></li>
                    <li><a href="/about.html" class="hover:underline">About</a></li>
                    <li><a href="/contact.html" class="hover:underline">Contact</a></li>
                    <li><a href="/privacy-policy.html" class="hover:underline">Privacy Policy</a></li>
                </ul>
            </div>
            <div>
                <h3 class="text-xl font-semibold mb-4">Contact</h3>
                <p class="text-sm mb-2">📧 info.mraaglave@gmail.com</p>
                <p class="text-sm mb-2">📱 +91 70832 36221</p>
                <a href="https://chat.whatsapp.com/KFcI5VeJOpjLPgp30NXMfQ" target="_blank"
                    class="inline-block mt-4 bg-white text-blue-600 px-4 py-2 rounded-full font-semibold hover:bg-gray-100">Join
                    WhatsApp Community</a>
            </div>
        </div>
        <div class="text-center mt-10 text-sm text-blue-100">
        <div class="flex justify-center mt-8">
            <a href="https://www.producthunt.com/products/msbte-notes-info/reviews/new?utm_source=badge-product_review&utm_medium=badge&utm_source=badge-msbte&#0045;notes&#0045;info" target="_blank"><img src="https://api.producthunt.com/widgets/embed-image/v1/product_review.svg?product_id=1131454&theme=light" alt="MSBTE&#0032;Notes&#0032;&#0038;&#0032;Info - we&#0032;provide&#0032;free&#0032;&#0038;&#0032;premium&#0032;study&#0032;materials&#0032;&#0038;&#0032;notes&#0032;for&#0032;msbte&#0032; | Product Hunt" style="width: 250px; height: 54px;" width="250" height="54" /></a>
        </div>
            &copy; 2025 MSBTE Notes & Info. All rights reserved.
        </div>
    </footer>

    <script>
        function toggleMobileMenu() {{
            document.getElementById('mobileNav').classList.toggle('hidden');
        }}
    </script>
<script src="../whatsapp-popup.js" defer></script>
</body>
</html>"""

# 2. Semester Page Template
SEMESTER_TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
    <!-- Google tag (gtag.js) -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-H5G5CCD95W"></script>
    <script>
        window.dataLayer = window.dataLayer || [];
        function gtag() {{ dataLayer.push(arguments); }}
        gtag('js', new Date());
        gtag('config', 'G-H5G5CCD95W');
    </script>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{branch_name} Semester {sem_num} Syllabus & Notes | MSBTE</title>
    <meta name="description" content="Download MSBTE {branch_name} Semester {sem_num} Syllabus PDF, Notes, and Study Materials. Free K-Scheme Official Resources." />
    <meta name="keywords" content="MSBTE, {branch_name}, Semester {sem_num}, Syllabus, Notes, PDF, K-Scheme, Diploma Engineering, Question Papers" />
    <meta name="author" content="MSBTE Notes & Info Team" />
    <link rel="canonical" href="{canonical_url}" />
    
    <!-- Open Graph -->
    <meta property="og:title" content="{branch_name} Semester {sem_num} Syllabus | MSBTE" />
    <meta property="og:description" content="Get official MSBTE {branch_name} Semester {sem_num} syllabus, subject list, and free notes." />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="{canonical_url}" />
    <meta property="og:image" content="{base_url}/Branches/media/{svg_filename}" />
    
    <!-- Tailwind & Fonts -->
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://api.fontshare.com/v2/css?f[]=clash-display@600&display=swap" rel="stylesheet">
    
    <!-- Favicon -->
    <link rel="icon" type="image/png" sizes="32x32" href="/resourse/favicon-32x32.png">
    <link rel="stylesheet" href="/style.css">
    
    <style>
        .font-display {{ font-family: 'Clash Display', sans-serif; }}
        table {{ width: 100%; border-collapse: collapse; }}
        th, td {{ padding: 0.75rem 1rem; border: 1px solid #e5e7eb; text-align: left; }}
        thead {{ background-color: #f3f4f6; }}
        th {{ font-weight: 600; font-family: 'Clash Display', sans-serif; }}
        tbody tr:nth-child(odd) {{ background-color: #f9fafb; }}
        a.download-btn {{ color: #2563eb; font-weight: 500; }}
        a.download-btn:hover {{ text-decoration: underline; }}
    </style>
    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9227354288966999" crossorigin="anonymous"></script>
</head>
<body class="bg-gray-50 text-gray-900 pt-16">
    <!-- Navbar -->
    <nav class="bg-white shadow fixed top-0 left-0 right-0 z-50">
        <div class="max-w-7xl mx-auto px-4 flex justify-between items-center h-16">
            <a href="/" class="flex items-center text-blue-600 font-bold text-xl font-display">MSBTE Notes & Info</a>
             <div class="hidden md:flex space-x-6">
                <a href="/about.html" class="hover:text-blue-600">About</a>
                <a href="/contact.html" class="hover:text-blue-600">Contact</a>
            </div>
            <button onclick="document.getElementById('mobileNav').classList.toggle('hidden')" class="md:hidden text-blue-600 text-3xl">≡</button>
        </div>
        <div id="mobileNav" class="md:hidden hidden bg-white shadow px-4 py-2">
            <a href="/about.html" class="block py-2">About</a>
            <a href="/contact.html" class="block py-2">Contact</a>
        </div>
    </nav>
    
    <main class="max-w-5xl mx-auto px-4 pt-10 pb-12">
        <header class="mb-8">
             <div class="relative overflow-hidden rounded-xl shadow-lg mb-8">
                <img src="media/{svg_filename}" alt="{branch_name} Banner" class="w-full h-auto object-cover">
            </div>
            <div class="text-sm text-gray-500 mb-2">
                <a href="/" class="hover:text-blue-600">Home</a> &gt; 
                <a href="/Branches/{branch_filename}" class="hover:text-blue-600">{branch_name}</a> &gt; 
                <span class="text-gray-900">Semester {sem_num}</span>
            </div>
            <h1 class="text-3xl sm:text-4xl font-bold text-blue-600 font-display">{branch_name} - Semester {sem_num}</h1>
            <p class="mt-2 text-gray-600">Download syllabus PDFs and access notes for all subjects.</p>
        </header>
        
        <!-- Scheme Download Button if available -->
        {scheme_button}

        <div class="bg-white rounded-lg shadowoverflow-hidden border border-gray-200 mt-6">
            <div class="overflow-x-auto">
                <table class="w-full">
                    <thead>
                        <tr>
                            <th>Subject Name</th>
                            <th>Code</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {table_rows}
                    </tbody>
                </table>
            </div>
        </div>
        
        <!-- Ad Unit -->
        <div class="mt-8 text-center">
             <ins class="adsbygoogle"
                 style="display:block"
                 data-ad-client="ca-pub-9227354288966999"
                 data-ad-slot="7917907402"
                 data-ad-format="auto"
                 data-full-width-responsive="true"></ins>
            <script>
                 (adsbygoogle = window.adsbygoogle || []).push({{}});
            </script>
        </div>
    </main>
    
    <!-- Footer -->
    <footer class="bg-blue-600 text-white mt-12 py-8 text-center">
        <p>&copy; 2025 MSBTE Notes & Info. All rights reserved.</p>
    </footer>
    <script src="../whatsapp-popup.js" defer></script>
</body>
</html>"""

# 3. Branch Page Template
BRANCH_TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
    <!-- Google tag (gtag.js) -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-H5G5CCD95W"></script>
    <script>
        window.dataLayer = window.dataLayer || [];
        function gtag() {{ dataLayer.push(arguments); }}
        gtag('js', new Date());
        gtag('config', 'G-H5G5CCD95W');
    </script>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{branch_name} Notes, Syllabus & PDF | MSBTE K-Scheme</title>
    <meta name="description" content="Official MSBTE K-Scheme {branch_name} syllabus, notes, and study materials for all semesters. Download PDFs now." />
    <meta name="keywords" content="MSBTE, {branch_name}, Diploma Notes, K-Scheme, Syllabus, Engineering, Polytechnic" />
    <meta name="author" content="MSBTE Notes & Info Team" />
    <link rel="canonical" href="{canonical_url}" />
    
    <!-- Open Graph -->
    <meta property="og:title" content="{branch_name} Syllabus & Notes | MSBTE" />
    <meta property="og:image" content="{base_url}/Branches/media/{svg_filename}" />
    
    <!-- Tailwind & Fonts -->
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://api.fontshare.com/v2/css?f[]=clash-display@600&display=swap" rel="stylesheet">
    <link rel="icon" type="image/png" sizes="32x32" href="/resourse/favicon-32x32.png">
    <link rel="stylesheet" href="/style.css">
    
    <style>
        .font-display {{ font-family: 'Clash Display', sans-serif; }}
    </style>
     <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9227354288966999" crossorigin="anonymous"></script>
</head>
<body class="bg-gray-50 text-gray-900 pt-16">
    <!-- Navbar -->
    <nav class="bg-white shadow fixed top-0 left-0 right-0 z-50">
        <div class="max-w-7xl mx-auto px-4 flex justify-between items-center h-16">
            <a href="/" class="flex items-center text-blue-600 font-bold text-xl font-display">MSBTE Notes & Info</a>
             <div class="hidden md:flex space-x-6">
                <a href="/about.html" class="hover:text-blue-600">About</a>
                <a href="/contact.html" class="hover:text-blue-600">Contact</a>
            </div>
            <button onclick="document.getElementById('mobileNav').classList.toggle('hidden')" class="md:hidden text-blue-600 text-3xl">≡</button>
        </div>
        <div id="mobileNav" class="md:hidden hidden bg-white shadow px-4 py-2">
            <a href="/about.html" class="block py-2">About</a>
            <a href="/contact.html" class="block py-2">Contact</a>
        </div>
    </nav>

    <main class="max-w-5xl mx-auto px-4 pt-12 pb-16">
        <header class="text-center mb-12">
             <div class="relative overflow-hidden rounded-xl shadow-lg mb-8">
                <img src="media/{svg_filename}" alt="{branch_name} Banner" class="w-full h-auto object-cover">
            </div>
            <h1 class="text-4xl md:text-5xl font-bold text-blue-600 font-display mb-4">{branch_name}</h1>
            <p class="text-lg text-gray-600 max-w-2xl mx-auto">
                Select your semester to access the complete MSBTE K-Scheme syllabus, notes, and resources for {branch_name}.
            </p>
        </header>

        <!-- Semester Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {sem_buttons}
        </div>
        
        <!-- Ad Unit -->
        <div class="mt-12 text-center">
             <ins class="adsbygoogle"
                 style="display:block"
                 data-ad-client="ca-pub-9227354288966999"
                 data-ad-slot="7917907402"
                 data-ad-format="auto"
                 data-full-width-responsive="true"></ins>
            <script>
                 (adsbygoogle = window.adsbygoogle || []).push({{}});
            </script>
        </div>
    </main>

    <footer class="bg-blue-600 text-white mt-auto py-8 text-center">
        <p>&copy; 2025 MSBTE Notes & Info. All rights reserved.</p>
    </footer>
    <script src="../whatsapp-popup.js" defer></script>
</body>
</html>"""

def slugify(text):
    text = text.lower()
    text = re.sub(r'[^a-z0-9]+', '-', text)
    return text.strip('-')

def extract_code(subject_name):
    # Extracts code like '314321' from '314321 - Microprocessor'
    match = re.match(r'^(\d+)', subject_name)
    if match:
        return match.group(1)
    return ""

def clean_subject_name(subject_name):
    # Removes code prefix like '314321 -'
    return re.sub(r'^\d+\s*[-]\s*', '', subject_name).strip()

def main():
    with open(JSON_PATH, 'r', encoding='utf-8') as f:
        data = json.load(f)

    branch_data = {}

    for item in data.get('Kscheme_data', []):
        branch = item.get('branch')
        sem_str = item.get('semester')
        subjects = item.get('subjects', [])
        
        if branch not in BRANCH_MAP:
            continue

        sem_num = SEM_MAP.get(sem_str)
        if not sem_num:
            continue

        if branch not in branch_data:
            branch_data[branch] = {}
        
        if sem_num not in branch_data[branch]:
            branch_data[branch][sem_num] = {'subjects': [], 'scheme_link': None}

        # Process subjects
        for sub in subjects:
            s_name_raw = sub.get('subject', '')
            link = sub.get('link', '')

            if 'scheme' in s_name_raw.lower() or 'k scheme' in s_name_raw.lower():
                branch_data[branch][sem_num]['scheme_link'] = link
            else:
                code = extract_code(s_name_raw)
                clean_name = clean_subject_name(s_name_raw)
                
                slug = slugify(clean_name)
                if code:
                    filename = f"{code}-{slug}.html"
                    svg_filename = f"{code}-{slug}.svg"
                else:
                    filename = f"{slug}.html"
                    svg_filename = f"{slug}.svg"
                
                branch_data[branch][sem_num]['subjects'].append({
                    'code': code,
                    'name': clean_name,
                    'filename': filename,
                    'svg_filename': svg_filename,
                    'pdf_link': link
                })

    # GENERATION PHASE
    generated_count = 0
    
    for branch, semesters in branch_data.items():
        branch_file_slug = BRANCH_MAP[branch]
        branch_filename = f"{branch_file_slug}.html"
        branch_svg_filename = f"{branch_file_slug}.svg"
        
        # Create Branch SVG
        create_svg(branch_svg_filename, branch, "Diploma Engineering")
        
        sem_buttons_html = ""
        
        # Sort semesters 1-6
        for sem_num in sorted(semesters.keys()):
            sem_info = semesters[sem_num]
            semester_filename = f"{branch_file_slug}-Semester-{sem_num}.html"
            semester_svg_filename = f"{branch_file_slug}-Semester-{sem_num}.svg"
            
            # Create Semester SVG
            create_svg(semester_svg_filename, f"{branch} - Sem {sem_num}", f"Semester {sem_num}")
            
            # 1. Generate SUBJECT PAGES
            table_rows_html = ""
            for sub in sem_info['subjects']:
                # Generate Subject SVG
                create_svg(sub['svg_filename'], sub['name'], f"Code: {sub['code']}")
                
                # Generate Subject HTML Page
                sub_html = SUBJECT_TEMPLATE.format(
                    subject_name=sub['name'],
                    subject_code=sub['code'],
                    branch_name=branch,
                    sem_num=sem_num,
                    branch_filename=branch_filename,
                    semester_filename=semester_filename,
                    syllabus_link=sub['pdf_link'],
                    canonical_url=f"{BASE_URL}/Branches/{sub['filename']}",
                    base_url=BASE_URL,
                    og_url=f"{BASE_URL}/Branches/{sub['filename']}",
                    svg_filename=sub['svg_filename']
                )
                
                out_path = os.path.join(OUTPUT_DIR, sub['filename'])
                with open(out_path, 'w', encoding='utf-8') as f:
                    f.write(sub_html)
                generated_count += 1
                
                # Add to Semester Table row
                table_rows_html += f"""
                        <tr class="hover:bg-gray-50 transition-colors">
                            <td class="font-medium text-gray-900">
                                <a href="{sub['filename']}" class="hover:text-blue-600 block py-2">{sub['name']}</a>
                            </td>
                            <td class="text-gray-600">{sub['code']}</td>
                            <td>
                                <a href="{sub['pdf_link']}" target="_blank" class="download-btn text-blue-600 bg-blue-50 px-3 py-1 rounded-md hover:bg-blue-100 transition-colors inline-block">
                                    ⬇ PDF
                                </a>
                            </td>
                        </tr>"""

            # 2. Generate SEMESTER PAGE
            scheme_btn = ""
            if sem_info['scheme_link']:
                scheme_btn = f"""<div class="mb-6"><a href="{sem_info['scheme_link']}" target="_blank" class="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">Download Semester Scheme PDF</a></div>"""

            sem_page_html = SEMESTER_TEMPLATE.format(
                branch_name=branch,
                branch_filename=branch_filename,
                sem_num=sem_num,
                canonical_url=f"{BASE_URL}/Branches/{semester_filename}",
                scheme_button=scheme_btn,
                table_rows=table_rows_html,
                base_url=BASE_URL,
                svg_filename=semester_svg_filename
            )
            
            sem_out_path = os.path.join(OUTPUT_DIR, semester_filename)
            with open(sem_out_path, 'w', encoding='utf-8') as f:
                f.write(sem_page_html)
            
            # Add to Branch Grid Button
            sem_buttons_html += f"""
            <a href="{semester_filename}" class="block p-6 bg-white border border-blue-100 rounded-xl shadow-sm hover:shadow-md hover:border-blue-300 transition-all duration-300 group">
                <div class="flex items-center justify-between mb-4">
                    <span class="text-3xl font-bold text-blue-100 group-hover:text-blue-600 transition-colors">{sem_num}</span>
                    <svg class="w-6 h-6 text-blue-400 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
                </div>
                <h3 class="text-xl font-bold text-gray-900 group-hover:text-blue-600">Semester {sem_num}</h3>
                <p class="text-sm text-gray-500 mt-2">{len(sem_info['subjects'])} Subjects</p>
            </a>
            """

        # 3. Generate BRANCH PAGE
        branch_page_html = BRANCH_TEMPLATE.format(
            branch_name=branch,
            canonical_url=f"{BASE_URL}/Branches/{branch_filename}",
            sem_buttons=sem_buttons_html,
            base_url=BASE_URL,
            svg_filename=branch_svg_filename
        )
        
        branch_out_path = os.path.join(OUTPUT_DIR, branch_filename)
        with open(branch_out_path, 'w', encoding='utf-8') as f:
            f.write(branch_page_html)

    print(f"Success! Generated {generated_count} subject pages, plus Semester and Branch pages with SVGs.")
    
    # UPDATE RESOURCES AND SITEMAP
    update_resources_and_sitemap(branch_data)

def update_resources_and_sitemap(branch_data):
    resources_path = r'c:\Users\bitbu\OneDrive\Documents\GitHub\MSBTE-NOTES-AND-INFO\Notes\resources.json'
    sitemap_path = r'c:\Users\bitbu\OneDrive\Documents\GitHub\MSBTE-NOTES-AND-INFO\sitemap.xml'
    
    new_resources = []
    new_urls = []
    today_str = datetime.date.today().isoformat()

    for branch, semesters in branch_data.items():
        branch_file_slug = BRANCH_MAP[branch]
        
        # Branch Page
        branch_url = f"/Branches/{branch_file_slug}.html"
        full_branch_url = f"{BASE_URL}{branch_url}"
        new_urls.append(full_branch_url)
        new_resources.append({
            "title": f"{branch} Syllabus & Notes",
            "description": f"Official MSBTE K-Scheme Syllabus and Notes for {branch}.",
            "url": branch_url,
            "thumbnail": f"/Branches/media/{branch_file_slug}.svg",
            "category": "subject-guide",
            "tags": [branch, "K-Scheme", "Syllabus"],
            "dateAdded": today_str
        })

        for sem_num, sem_info in semesters.items():
            semester_filename = f"{branch_file_slug}-Semester-{sem_num}.html"
            semester_url = f"/Branches/{semester_filename}"
            full_sem_url = f"{BASE_URL}{semester_url}"
            new_urls.append(full_sem_url)
            
            new_resources.append({
                "title": f"{branch} Semester {sem_num}",
                "description": f"Download all subjects syllabus and notes for {branch} Semester {sem_num}.",
                "url": semester_url,
                "thumbnail": f"/Branches/media/{branch_file_slug}-Semester-{sem_num}.svg",
                "category": "subject-guide",
                "tags": [branch, f"Semester {sem_num}", "K-Scheme"],
                "dateAdded": today_str
            })

            for sub in sem_info['subjects']:
                sub_url = f"/Branches/{sub['filename']}"
                full_sub_url = f"{BASE_URL}{sub_url}"
                new_urls.append(full_sub_url)
                
                new_resources.append({
                    "title": f"{sub['name']} ({sub['code']})",
                    "description": f"Syllabus, Notes and Important Questions for {sub['name']}.",
                    "url": sub_url,
                    "thumbnail": f"/Branches/media/{sub['svg_filename']}",
                    "category": "subject-guide",
                    "tags": [sub['code'], branch, f"Semester {sem_num}", "K-Scheme"],
                    "dateAdded": today_str
                })

    # 1. Update resources.json
    try:
        with open(resources_path, 'r', encoding='utf-8') as f:
            res_data = json.load(f)
    except Exception:
        res_data = []

    existing_urls = {item.get('url') for item in res_data}
    added_res = 0
    for res in new_resources:
        if res['url'] not in existing_urls:
            res_data.append(res)
            added_res += 1
    
    with open(resources_path, 'w', encoding='utf-8') as f:
        json.dump(res_data, f, indent=4)
    print(f"Added {added_res} new entries to resources.json")

    # 2. Update sitemap.xml
    try:
        # Read nicely with utf-8
        with open(sitemap_path, 'r', encoding='utf-8') as f:
            sitemap_content = f.read()
    except Exception:
        sitemap_content = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n</urlset>'

    # Simple string manipulation to append
    if '</urlset>' in sitemap_content:
        sitemap_content = sitemap_content.replace('</urlset>', '')
    
    added_sitemap = 0
    for url in new_urls:
        if url not in sitemap_content:
            sitemap_content += f"""  <url>
    <loc>{url}</loc>
    <lastmod>{today_str}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
"""
            added_sitemap += 1
    
    sitemap_content += '</urlset>'
    
    with open(sitemap_path, 'w', encoding='utf-8') as f:
        f.write(sitemap_content)
    print(f"Added {added_sitemap} new URLs to sitemap.xml")

if __name__ == "__main__":
    main()
