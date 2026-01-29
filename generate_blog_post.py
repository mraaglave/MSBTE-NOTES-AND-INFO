import csv
import os
import re
import json
import random
from datetime import datetime

# Configuration
CSV_FILE = 'notes_data.csv'
BLOG_TEMPLATE_FILE = 'Blog/ajit-pawar-death-news.html'
BLOG_OUTPUT_FILE = 'Blog/computer-engineering-diploma-notes.html'
BLOG_JSON = 'blogs.json'
THUMB_DIR = 'resourse/blog-resourse'
BLOG_TITLE = "Computer Engineering Diploma All Semester Subject Notes and Books"
BLOG_SLUG = "computer-engineering-diploma-notes"
BLOG_DESC = "Download all semester subject notes, books, and manuals for MSBTE Computer Engineering Diploma (K-Scheme). Access free PDFs for Sem 1 to 6."

def create_slug(text):
    """Creates a URL-friendly slug from text."""
    slug = text.lower()
    slug = re.sub(r'[^a-z0-9\s-]', '', slug)
    slug = re.sub(r'\s+', '-', slug)
    return slug

def generate_svg_thumbnail():
    """Generates an SVG thumbnail for the blog post."""
    os.makedirs(THUMB_DIR, exist_ok=True)
    
    # Using a professional blue theme
    bg_color = "#EEF2FF" # Indigo 50
    text_color = "#4F46E5" # Indigo 600
    
    svg_content = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630">
    <rect width="1200" height="630" fill="{bg_color}"/>
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="{text_color}" stroke-width="1" opacity="0.1"/>
    </pattern>
    <rect width="1200" height="630" fill="url(#grid)" />
    
    <g transform="translate(600, 250) scale(8) translate(-16, -16)">
         <path d="M27 6H5C3.34315 6 2 7.34315 2 9V23C2 24.6569 3.34315 26 5 26H27C28.6569 26 30 24.6569 30 23V9C30 7.34315 28.6569 6 27 6Z" fill="{text_color}"/>
        <path d="M16 6V26H5C4.20435 26 3.44129 25.6839 2.87868 25.1213C2.31607 24.5587 2 23.7956 2 23V9C2 8.20435 2.31607 7.44129 2.87868 6.87868C3.44129 6.31607 4.20435 6 5 6H16Z" fill="{text_color}" opacity="0.8"/>
        <path d="M12 6V20C12 20.2652 11.8946 20.5196 11.7071 20.7071C11.5196 20.8946 11.2652 21 11 21C10.7348 21 10.4804 20.8946 10.2929 20.7071C10.1054 20.5196 10 20.2652 10 20V6H12Z" fill="white"/>
        <path d="M25 13H20C19.7348 13 19.4804 12.8946 19.2929 12.7071C19.1054 12.5196 19 12.2652 19 12C19 11.7348 19.1054 11.4804 19.2929 11.2929C19.4804 11.1054 19.7348 11 20 11H25C25.2652 11 25.5196 11.1054 25.7071 11.2929C25.8946 11.4804 26 11.7348 26 12C26 12.2652 25.8946 12.5196 25.7071 12.7071C25.5196 12.8946 25.2652 13 25 13Z" fill="{text_color}" opacity="0.3"/>
        <path d="M25 17H22C21.7348 17 21.4804 16.8946 21.2929 16.7071C21.1054 16.5196 21 16.2652 21 16C21 15.7348 21.1054 15.4804 21.2929 15.2929C21.4804 15.1054 21.7348 15 22 15H25C25.2652 15 25.5196 15.1054 25.7071 15.2929C25.8946 15.4804 26 15.7348 26 16C26 16.2652 25.8946 16.5196 25.7071 16.7071C25.5196 16.8946 25.2652 17 25 17Z" fill="{text_color}" opacity="0.3"/>
        <path d="M25 21H20C19.7348 21 19.4804 20.8946 19.2929 20.7071C19.1054 20.5196 19 20.2652 19 20C19 19.7348 19.1054 19.4804 19.2929 19.2929C19.4804 19.1054 19.7348 19 20 19H25C25.2652 19 25.5196 19.1054 25.7071 19.2929C25.8946 19.4804 26 19.7348 26 20C26 20.2652 25.8946 20.5196 25.7071 20.7071C25.5196 20.8946 25.2652 21 25 21Z" fill="{text_color}" opacity="0.3"/>
    </g>
    
    <text x="600" y="480" font-family="Arial, sans-serif" font-size="50" font-weight="bold" fill="{text_color}" text-anchor="middle">Computer Engineering Notes</text>
    <text x="600" y="550" font-family="Arial, sans-serif" font-size="30" fill="{text_color}" opacity="0.8" text-anchor="middle">Diploma All Semesters • Books • Manuals</text>
</svg>"""

    filename = f"{BLOG_SLUG}.svg"
    filepath = os.path.join(THUMB_DIR, filename)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(svg_content)
        
    return f"/{THUMB_DIR}/{filename}"

def generate_blog_content():
    # 1. Group Data by Semester
    semesters = {}
    with open(CSV_FILE, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            sem = row['Semester'].strip() # e.g., "Semester - 1"
            if sem not in semesters:
                semesters[sem] = set()
            semesters[sem].add(row['Subject'].strip())
            
    # Sort semesters
    sorted_sem_keys = sorted(semesters.keys()) # Might need better sorting if mixed formats
    
    html = ""
    
    html += f"""
    <section class="my-10 prose prose-blue max-w-none">
        <p>Are you a Computer Engineering Diploma student looking for high-quality study materials? 
        You've come to the right place. We have curated a complete collection of MSBTE K-Scheme notes, 
        textbooks, laboratary manuals, and important questions for all semesters.</p>
        
        <div class="success-box rounded-xl p-6 mb-8 mt-6">
            <h3 class="text-lg font-bold text-green-800 mb-2">✅ What You Will Find Here</h3>
            <ul class="list-disc ml-6 text-gray-700">
                <li><strong>Subject-wise Notes:</strong> Concise and exam-oriented notes.</li>
                <li><strong>Textbooks:</strong> Standard reference books recommended by MSBTE.</li>
                <li><strong>Lab Manuals:</strong> Solved practical manuals for term-work.</li>
                <li><strong>Question Banks:</strong> Important questions for upcoming exams.</li>
            </ul>
        </div>
    </section>
    """
    
    for sem in sorted_sem_keys:
        subjects = sorted(list(semesters[sem]))
        sem_id = create_slug(sem)
        
        html += f"""
        <section id="{sem_id}" class="my-12">
            <h2 class="text-2xl font-bold text-gray-900 font-display mb-6 border-b pb-2">{sem} Resources</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        """
        
        for subject in subjects:
            page_slug = create_slug(f"{subject} {sem}")
            page_url = f"/Notes/{page_slug}.html"
            
            # Use SVG thumbnail for the subject card too (we know the path pattern)
            thumb_url = f"/resourse/note-thumbs/{page_slug}.svg"
            
            html += f"""
                <a href="{page_url}" class="group block bg-white rounded-xl shadow-sm hover:shadow-md transition border border-gray-100 overflow-hidden">
                    <div class="h-32 bg-gray-50 flex items-center justify-center p-4">
                        <img src="{thumb_url}" alt="{subject}" class="h-16 w-auto opacity-80 group-hover:scale-110 transition duration-300">
                    </div>
                    <div class="p-5">
                        <h3 class="font-bold text-gray-800 group-hover:text-blue-600 transition">{subject}</h3>
                        <p class="text-sm text-gray-500 mt-1">Free Notes & Books</p>
                    </div>
                </a>
            """
            
        html += """
            </div>
        </section>
        """
        
    # Conclusion
    html += """
    <section class="my-12 prose prose-blue max-w-none">
        <h2 class="text-2xl font-bold text-gray-900 font-display mb-4">Why Choose These Notes?</h2>
        <p>These resources are specifically tailored for the MSBTE K-Scheme curriculum, ensuring you study exactly what is needed for your exams. Regular updates are made to include the latest question papers and model answers.</p>
        
        <div class="bg-blue-50 rounded-xl p-6 text-center mt-8">
            <h3 class="text-xl font-bold text-blue-800 mb-2">Stay Updated!</h3>
            <p class="text-blue-600 mb-4">Join our community for daily updates and exam alerts.</p>
            <a href="https://chat.whatsapp.com/KFcI5VeJOpjLPgp30NXMfQ" target="_blank" class="inline-block bg-blue-600 text-white font-semibold py-2 px-6 rounded-full hover:bg-blue-700 transition">Join WhatsApp Group</a>
        </div>
    </section>
    """
        
    return html

def create_blog_page():
    # 1. Read Template
    with open(BLOG_TEMPLATE_FILE, 'r', encoding='utf-8') as f:
        template = f.read()
        
    # 2. Generate Content
    content_html = generate_blog_content()
    thumb_path = generate_svg_thumbnail()
    current_date = datetime.now()
    
    # 3. Replace Placeholders (Basic string replacement)
    # We need to act smart here because the template is a specific news article.
    # We will replace metadata and the main <article> content.
    
    # Metadata
    page_html = re.sub(r'<title>.*?</title>', f'<title>{BLOG_TITLE}</title>', template)
    page_html = re.sub(r'<meta name="description" content=".*?" />', f'<meta name="description" content="{BLOG_DESC}" />', page_html)
    page_html = re.sub(r'<meta name="keywords" content=".*?" />', f'<meta name="keywords" content="Computer Engineering notes, MSBTE diploma books, polytechnic notes, {BLOG_TITLE}" />', page_html)
    page_html = re.sub(r'<link rel="canonical" href=".*?" />', f'<link rel="canonical" href="https://msbtenotes-info.netlify.app/{BLOG_OUTPUT_FILE}" />', page_html)
    
    # OG Tags
    page_html = re.sub(r'<meta property="og:title" content=".*?" />', f'<meta property="og:title" content="{BLOG_TITLE}" />', page_html)
    page_html = re.sub(r'<meta property="og:description" content=".*?" />', f'<meta property="og:description" content="{BLOG_DESC}" />', page_html)
    page_html = re.sub(r'<meta property="og:url" content=".*?" />', f'<meta property="og:url" content="https://msbtenotes-info.netlify.app/{BLOG_OUTPUT_FILE}" />', page_html)
    page_html = re.sub(r'<meta property="og:image" content=".*?" />', f'<meta property="og:image" content="https://msbtenotes-info.netlify.app{thumb_path}" />', page_html)
    
    # Twitter
    page_html = re.sub(r'<meta name="twitter:title" content=".*?" />', f'<meta name="twitter:title" content="{BLOG_TITLE}" />', page_html)
    page_html = re.sub(r'<meta name="twitter:description" content=".*?" />', f'<meta name="twitter:description" content="{BLOG_DESC}" />', page_html)
    page_html = re.sub(r'<meta name="twitter:image" content=".*?" />', f'<meta name="twitter:image" content="https://msbtenotes-info.netlify.app{thumb_path}" />', page_html)
    
    # Schema - A bit hacky with regex, but works for full block replacement if we find the block
    # Simplify: Just replacing specific fields inside the existing JSON-LD
    page_html = page_html.replace('Ajit Pawar Death News: Maharashtra Deputy CM Dies in Tragic Plane Crash in Baramati', BLOG_TITLE)
    # Assuming description is unique enough
    # page_html = page_html.replace('Maharashtra Deputy CM Ajit Pawar dies in a tragic plane crash...', BLOG_DESC) 
    
    # Header Content
    page_html = re.sub(r'<h1.*?>(.*?)</h1>', f'<h1 class="text-3xl md:text-4xl font-bold text-gray-900 font-display leading-tight" itemprop="headline">{BLOG_TITLE}</h1>', page_html, flags=re.DOTALL)
    
    # Date
    date_str = current_date.strftime("%B %d, %Y")
    iso_date = current_date.strftime("%Y-%m-%d")
    page_html = re.sub(r'<time datetime=".*?" itemprop="datePublished">.*?</time>', f'<time datetime="{iso_date}" itemprop="datePublished">{date_str}</time>', page_html)
    
    # Hero Image in Body
    page_html = re.sub(r'<img src="/resourse/blog-resourse/ajit-pawar-death-news.png".*?>', f'<img src="{thumb_path}" alt="{BLOG_TITLE}" class="w-full h-auto rounded-2xl shadow-xl mb-8 object-cover aspect-video" loading="eager" />', page_html, flags=re.DOTALL)
    
    # Intro Paragraph (Replacing the logic)
    # Finding the paragraph with itemprop="description"
    page_html = re.sub(r'<p class="mt-4 text-lg text-gray-700 font-normal" itemprop="description">.*?</p>', f'<p class="mt-4 text-lg text-gray-700 font-normal" itemprop="description">{BLOG_DESC}</p>', page_html, flags=re.DOTALL)
    
    # Breaking News Badge removal/change
    page_html = page_html.replace('🚨 Breaking News', '📚 Study Resources')
    page_html = page_html.replace('bg-red-100 text-red-800', 'bg-blue-100 text-blue-800')
    
    # Replacing the entire <article> body content except the top image which we processed
    # We'll use a marker to splitting.
    # The template has <!-- Quick Navigation --> ... 
    
    # Let's replace everything from <!-- Quick Navigation --> down to before <!-- Share Section -->
    # This is risky with regex. Let's find specific unique strings.
    start_marker = '<!-- Quick Navigation -->'
    end_marker = '<!-- Related Articles -->' # Or share section
    
    if start_marker in page_html and end_marker in page_html:
        pre = page_html.split(start_marker)[0]
        post = page_html.split(end_marker)[1]
        
        # We need to keep share section, it might be inside the cut area?
        # In the template: Quick Nav -> Sections -> Ad -> FAQ -> Related Articles.
        # Share section is AFTER related articles in the template provided? 
        # No, "Share Section" is at the end of article. "Related Articles" is inside section?
        # Let's check template line 447: <section id="related-blogs" class="mt-16">
        # Share section is line 458: <div class="text-center mt-10">...
        
        # So we replace from Quick Nav to Related Blogs.
        # But wait, we want to Keep Related Blogs and Share Section.
        
        # Let's replace the middle content.
        # From <div class="highlight-box rounded-xl p-6 mb-8"> (Quick Nav)
        # To <section id="related-blogs"
        
        pattern = re.compile(r'<!-- Quick Navigation -->.*?<!-- Related Articles -->', re.DOTALL)
        page_html = pattern.sub(content_html + '\n<!-- Related Articles -->', page_html)
        
    else:
        print("Warning: Could not find content markers in template. Appending content.")
        # Fallback would be manually editing, but let's hope this works.
        # Alternative: Just replace the articleSection content if possible.
    
    # Ad cleanup (optional, user didn't say remove ads, but maybe irrelevant ads)
    
    # Save File
    with open(BLOG_OUTPUT_FILE, 'w', encoding='utf-8') as f:
        f.write(page_html)
    print(f"Generated blog post: {BLOG_OUTPUT_FILE}")
    
    return thumb_path, iso_date, date_str

def update_blogs_json(thumb_path, iso_date, date_str):
    with open(BLOG_JSON, 'r', encoding='utf-8') as f:
        posts = json.load(f)
    
    new_entry = {
        "id": BLOG_SLUG,
        "title": BLOG_TITLE,
        "image": thumb_path,
        "imageAlt": BLOG_TITLE,
        "dateAndReadTime": f"{date_str} · 10 min read",
        "shortTitle": "Comp. Engg. Notes",
        "description": BLOG_DESC,
        "url": f"/{BLOG_OUTPUT_FILE}"
    }
    
    # Prepend
    posts.insert(0, new_entry)
    
    with open(BLOG_JSON, 'w', encoding='utf-8') as f:
        json.dump(posts, f, indent=4)
    print("Updated blogs.json")

def main():
    if not os.path.exists(CSV_FILE):
        print("CSV file missing.")
        return
        
    thumb_path, iso_date, date_str = create_blog_page()
    update_blogs_json(thumb_path, iso_date, date_str)

if __name__ == "__main__":
    main()
