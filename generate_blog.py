import re
import json

with open("capstone_raw.txt", "r", encoding="utf-8") as f:
    raw = f.read()

# YouTube Promo Box
youtube_promo = """
<!-- Subscribe Promo Box -->
<div class="bg-gradient-to-r from-red-50 to-white border border-red-100 p-5 rounded-xl shadow-sm mb-8 mt-6 flex flex-col md:flex-row items-center gap-4">
    <div class="bg-red-500 text-white rounded-full p-3 flex-shrink-0">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
        </svg>
    </div>
    <div class="flex-grow text-center md:text-left">
        <h3 class="font-bold text-gray-900 text-lg">Subscribe to Our YouTube Channel!</h3>
        <p class="text-gray-600 text-sm mt-1">Get the latest MSBTE updates, video lectures, and exam tips directly on YouTube.</p>
    </div>
    <a href="https://www.youtube.com/@msbte-notes-and-info" target="_blank" class="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-full transition-colors flex-shrink-0 whitespace-nowrap">
        Subscribe
    </a>
</div>
"""

blog_title = "50 Capstone Project Ideas for Computer Engineering Diploma Students"
blog_desc = "Looking for the perfect capstone project? Check out this curated list of 50 project ideas across Web Development, AI, Cybersecurity, IoT, and Data Analytics, specifically designed for MSBTE Diploma computer engineering students."

html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-H5G5CCD95W"></script>
    <script>
        window.dataLayer = window.dataLayer || [];
        function gtag() {{ dataLayer.push(arguments); }}
        gtag('js', new Date());
        gtag('config', 'G-H5G5CCD95W');
    </script>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{blog_title}</title>
    <meta name="description" content="{blog_desc}" />
    <meta name="keywords" content="capstone projects, computer engineering projects, msbte diploma projects, web development projects, AI projects, cybersecurity projects, IoT projects, final year projects" />
    <link rel="canonical" href="https://msbtenotes-info.netlify.app/Blog/50-capstone-project-ideas-computer-engineering.html" />
    <link rel="apple-touch-icon" sizes="180x180" href="/resourse/apple-touch-icon.png">
    <link rel="icon" type="image/png" sizes="32x32" href="/resourse/favicon-32x32.png">
    <link rel="icon" type="image/png" sizes="16x16" href="/resourse/favicon-16x16.png">
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
    <link rel="stylesheet" href="/style.css">
</head>
<body class="bg-gray-50 text-gray-900 pt-16">
    <!-- Header Placeholder (copying generic from template) -->
    <nav class="bg-white shadow fixed top-0 left-0 right-0 z-50">
        <div class="max-w-9xl mx-auto px-4 flex justify-between items-center h-16">
            <a href="/" class="flex items-center text-blue-600 font-bold text-xl font-display">MSBTE Notes & Info</a>
        </div>
    </nav>
    <header class="max-w-4xl mx-auto px-4 pt-10 pb-6 text-left">
        <h1 class="text-4xl font-bold text-blue-600 font-display">{blog_title}</h1>
        <p class="mt-2 text-gray-600">Published by <strong>MSBTE Notes & Info Team</strong> · March 20, 2026</p>
    </header>
    <article class="max-w-4xl mx-auto px-4">
        <img src="/resourse/blog-resourse/50-capstone-project-ideas.png" alt="Capstone Project Ideas" class="rounded-2xl w-full shadow-xl mb-8 border border-gray-100" loading="lazy">
        <div class="prose prose-blue max-w-none">
            <p class="text-lg leading-relaxed text-gray-700 mb-6">{blog_desc}</p>
            {youtube_promo}
"""

# Parsing Logic
sections = raw.split("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
for section in sections:
    if "SECTION" not in section and "PROJECT" not in section: continue
    
    lines = [L.strip() for L in section.split('\\n') if L.strip()]
    if not lines: continue
    
    if "SECTION" in lines[0]:
        section_title = lines[0].replace("SECTION", "").strip()
        html += f"\\n<h2 class='text-3xl font-bold text-gray-800 mt-10 mb-6 border-b-2 border-blue-500 inline-block pb-1'>{section_title}</h2>\\n"
        
        projects = section.split("PROJECT ")[1:]
        for proj in projects:
            proj_parts = proj.split('\\n')
            proj_title = proj_parts[0].replace("---", "").strip()
            
            html += f"""
<div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8 mt-4 hover:shadow-md transition">
    <h3 class="text-xl font-bold text-gray-900 border-b pb-2 mb-4">PROJECT {proj_title}</h3>
    <ul class="space-y-3 text-gray-700">
"""
            current_tag = None
            content_map = {{}}
            for p_line in proj_parts[1:]:
                p_line = p_line.strip()
                if not p_line or '-'*10 in p_line: continue
                
                if p_line.startswith("Brief:") or p_line.startswith("Objective:") or p_line.startswith("Scope:") or \\
                   p_line.startswith("Technologies:") or p_line.startswith("Methodology:") or p_line.startswith("Expected Outcome:") or \\
                   p_line.startswith("Difficulty:"):
                    current_tag = p_line.split(":")[0]
                    content_map[current_tag] = p_line.split(":", 1)[1].strip() + " "
                elif current_tag:
                    content_map[current_tag] += p_line + " "
                    
            for key, val in content_map.items():
                if key == "Technologies":
                    techs = [t.strip() for t in val.split(',')]
                    tech_html = ''.join([f"<span class='bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mr-2 mb-2 inline-block'>{t}</span>" for t in techs if t])
                    html += f"<li><strong>{key}:</strong><br><div class='mt-2'>{tech_html}</div></li>"
                elif key == "Difficulty":
                    html += f"<li><span class='bg-yellow-100 text-yellow-800 text-sm px-3 py-1 rounded-full font-medium'><strong>Details: </strong> {val}</span></li>"
                else:
                    html += f"<li><strong>{key}:</strong> {val}</li>"
            html += "</ul></div>\\n"

html += """
        </div>
    </article>
</body>
</html>
"""

with open("Blog/50-capstone-project-ideas-computer-engineering.html", "w", encoding="utf-8") as f:
    f.write(html)
    
print("Blog generated successfully.")

# Update JSON
with open('blogs.json', 'r', encoding='utf-8') as f:
    blogs = json.load(f)

blogs.insert(0, {
    "id": "50-capstone-project-ideas",
    "title": blog_title,
    "image": "/resourse/blog-resourse/50-capstone-project-ideas.png",
    "imageAlt": "Capstone Project Ideas Illustration",
    "dateAndReadTime": "March 20, 2026 · 12 min read",
    "shortTitle": "50 Capstone Project Ideas",
    "description": blog_desc,
    "url": "/Blog/50-capstone-project-ideas-computer-engineering.html",
    "keywords": [
        "capstone projects",
        "computer engineering projects",
        "msbte projects",
        "web dev projects"
    ]
})

with open('blogs.json', 'w', encoding='utf-8') as f:
    json.dump(blogs, f, indent=4)
print("Updated blogs.json")
