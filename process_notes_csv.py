import csv
import json
import os
import re
from datetime import datetime
import math

# File paths
CSV_FILE = r'c:\Users\bitbu\OneDrive\Documents\GitHub\MSBTE-NOTES-AND-INFO\Notes\notes - notes.csv'
JSON_FILE = r'c:\Users\bitbu\OneDrive\Documents\GitHub\MSBTE-NOTES-AND-INFO\Notes\resources.json'
TEMPLATE_FILE = r'c:\Users\bitbu\OneDrive\Documents\GitHub\MSBTE-NOTES-AND-INFO\Notes\note_page_template.html'
NOTES_DIR = r'c:\Users\bitbu\OneDrive\Documents\GitHub\MSBTE-NOTES-AND-INFO\Notes'
THUMBS_DIR = r'c:\Users\bitbu\OneDrive\Documents\GitHub\MSBTE-NOTES-AND-INFO\resourse\note-thumbs'

def create_slug(text):
    slug = str(text).lower()
    slug = re.sub(r'[^a-z0-9\s-]', '', slug)
    slug = re.sub(r'\s+', '-', slug).strip('-')
    return slug

def extract_core_subject(test_name):
    # Extracts "311305 - Basic Physics" from "311305 - Basic Physics - Unit Test - 1"
    parts = test_name.split(' - ')
    if len(parts) >= 2 and parts[0].isdigit():
        return f"{parts[0]} - {parts[1]}"
    # Fallback if no code
    if " - " in test_name:
        return " - ".join(test_name.split(' - ')[:2])
    return test_name

def extract_resource_type(test_name):
    parts = test_name.split(' - ')
    if len(parts) >= 3:
        return " - ".join(parts[2:])
    return "Resource"

def generate_svg(title, slug, index):
    # Colors for professional gradients
    palettes = [
        ['#4F46E5', '#3B82F6'], # Indigo to Blue
        ['#10B981', '#059669'], # Emerald
        ['#8B5CF6', '#6D28D9'], # Purple
        ['#EC4899', '#BE185D'], # Pink
        ['#F59E0B', '#D97706'], # Amber
        ['#06B6D4', '#0891B2']  # Cyan
    ]
    color = palettes[index % len(palettes)]
    
    parts = title.split(' - ')
    code = parts[0] if len(parts) > 1 and parts[0].isdigit() else "Notes"
    subj = parts[1] if len(parts) > 1 else title
    
    # 16:9 ratio SVG
    svg_content = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" width="100%" height="100%">
    <defs>
        <linearGradient id="bg-grad-{index}" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="{color[0]}" />
            <stop offset="100%" stop-color="{color[1]}" />
        </linearGradient>
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>
        </pattern>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="10" stdDeviation="15" flood-opacity="0.3"/>
        </filter>
    </defs>
    
    <rect width="1280" height="720" fill="url(#bg-grad-{index})" />
    <rect width="1280" height="720" fill="url(#grid)" />
    
    <!-- Abstract Tech Elements -->
    <circle cx="1100" cy="150" r="300" fill="white" opacity="0.05" />
    <circle cx="200" cy="600" r="200" fill="white" opacity="0.05" />
    <path d="M0,720 L1280,500 L1280,720 Z" fill="rgba(255,255,255,0.05)" />
    
    <!-- Content Box -->
    <rect x="140" y="160" width="1000" height="400" rx="30" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.2)" stroke-width="2" backdrop-filter="blur(10px)" filter="url(#shadow)" />
    
    <text x="640" y="270" font-family="'Inter', sans-serif" font-weight="900" font-size="50" fill="white" opacity="0.8" text-anchor="middle" letter-spacing="4">{code}</text>
    <text x="640" y="380" font-family="'Inter', -apple-system, sans-serif" font-weight="800" font-size="80" fill="white" text-anchor="middle">{subj[:30]}{'...' if len(subj)>30 else ''}</text>
    
    <rect x="520" y="440" width="240" height="6" rx="3" fill="white" opacity="0.5" />
    
    <text x="640" y="510" font-family="'Inter', sans-serif" font-weight="500" font-size="30" fill="white" opacity="0.9" text-anchor="middle">MSBTE DIPLOMA NOTES &amp; MANUALS</text>
    
    <text x="1150" y="670" font-family="sans-serif" font-weight="bold" font-size="24" fill="white" opacity="0.5" text-anchor="end">msbtenotes-info.netlify.app</text>
</svg>"""
    
    svg_path = os.path.join(THUMBS_DIR, f"{slug}.svg")
    os.makedirs(THUMBS_DIR, exist_ok=True)
    with open(svg_path, 'w', encoding='utf-8') as f:
        f.write(svg_content)
    return f"/resourse/note-thumbs/{slug}.svg"

def generate_seo_text(subject, branches_str, scheme, semester):
    return f'''
    <section class="mt-12 bg-white p-8 rounded-2xl shadow-sm border border-gray-100 prose prose-blue max-w-none">
        <h2 class="text-2xl font-bold font-display text-blue-600 mb-4">Mastering {subject} in MSBTE {scheme}</h2>
        <p>Studying <strong>{subject}</strong> can be a challenging yet highly rewarding experience for diploma students, particularly those enrolled in the MSBTE {scheme}. Whether you are in {branches_str} pursuing your {semester}, understanding the core concepts of {subject} is absolutely essential for your academic and professional growth. This page provides an exhaustive collection of study materials tailored specifically to fulfill the MSBTE curriculum requirements.</p>
        
        <h3 class="text-xl font-bold font-display text-gray-800 mt-6 mb-3">Why Quality Study Material Matters?</h3>
        <p>Preparing for MSBTE board exams demands clear concepts, persistent practice, and access to premium quality educational resources. The notes, question banks, and manuals provided here for {subject} are meticulously arranged to ensure you grasp complex theories effortlessly. It is not just about memorization; it's about deeply understanding the fundamentals that will empower you in your technical career. Earning top grades requires smart study plans, and our optimized PDFs act as your perfect companion.</p>
        
        <h3 class="text-xl font-bold font-display text-gray-800 mt-6 mb-3">What You Will Find Here</h3>
        <ul class="list-disc pl-5 space-y-2 mt-2">
            <li><strong>Comprehensive Notes:</strong> Detailed, easy-to-understand explanations of all units and chapters prescribed in the MSBTE syllabus.</li>
            <li><strong>Unit Tests &amp; Question Banks:</strong> Access previous unit tests and model question papers to anticipate exam patterns and secure higher marks.</li>
            <li><strong>Lab Manuals &amp; Practicals:</strong> Step-by-step guidance for practicals and experiments, ensuring you excel in your laboratory evaluations.</li>
            <li><strong>Downloadable PDFs:</strong> High-quality, mobile-friendly PDF files that you can access anytime, anywhere, or even download offline via Google Drive backup links.</li>
        </ul>
        
        <h3 class="text-xl font-bold font-display text-gray-800 mt-6 mb-3">Tips to Score Highest Marks</h3>
        <p>Consistent revision is the key. Make sure to download the Unit Test papers available above and solve them under timed conditions. Focus on the repeated questions and deeply review the step-by-step solutions. We highly recommend discussing these notes in your student forums and study groups. By fully leveraging these free educational resources, you are setting yourself on a clear path to extraordinary performance in your MSBTE examinations. Share these resources with your classmates and join our community to stay updated on the latest academic materials and trending technical topics!</p>
    </section>
    '''

def main():
    if not os.path.exists(CSV_FILE):
        print(f"Error: {CSV_FILE} not found.")
        return
        
    with open(TEMPLATE_FILE, 'r', encoding='utf-8') as f:
        template = f.read()
        
    # Group data by core subject
    subjects = {}
    with open(CSV_FILE, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            core_sub = extract_core_subject(row['Subject / Test Name'])
            if core_sub not in subjects:
                subjects[core_sub] = {
                    'scheme': row['Scheme'],
                    'semester': row['Semester'],
                    'branches': set(),
                    'resources': []
                }
            subjects[core_sub]['branches'].add(row['Branch'])
            
            res_type = extract_resource_type(row['Subject / Test Name'])
            subjects[core_sub]['resources'].append({
                'type': res_type,
                'pdf': row['PDF URL'],
                'drive': row.get('Drive Link', '')
            })

    # Read existing JSON
    try:
        with open(JSON_FILE, 'r', encoding='utf-8') as f:
            resources_json = json.load(f)
    except Exception:
        resources_json = []

    new_entries = []
    current_date = datetime.now().strftime("%Y-%m-%d")

    for i, (subject, data) in enumerate(subjects.items()):
        slug = create_slug(subject)
        
        branches_list = list(data['branches'])
        branches_str = ", ".join(branches_list[:3]) + (" and others" if len(branches_list) > 3 else "")
        year_level = "Diploma"
        if "First Year" in data['semester']: year_level = "First Year"
        elif "Second Year" in data['semester']: year_level = "Second Year"
        elif "Third Year" in data['semester']: year_level = "Third Year"

        # Generate SVG
        thumb_url = generate_svg(subject, slug, i)
        
        # Build resources HTML
        resources_html = '<div class="grid gap-6 mt-6">'
        for res in data['resources']:
            drive_btn = f'<a href="{res["drive"]}" target="_blank" class="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-lg font-semibold transition flex items-center justify-center gap-2">Backup (Drive)</a>' if res["drive"] else ''
            resources_html += f"""
            <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition">
                <h4 class="text-lg font-bold text-gray-900 mb-4">{res['type']}</h4>
                <div class="flex flex-wrap gap-3">
                    <a href="{res['pdf']}" target="_blank" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition flex items-center justify-center gap-2">
                        View/Download PDF
                    </a>
                    {drive_btn}
                </div>
            </div>
            """
        resources_html += '</div>'
        
        seo_text = generate_seo_text(subject, branches_str, data['scheme'], data['semester'])
        resources_html += seo_text

        # Prepare HTML placeholders
        html_content = template.replace('{{TITLE_TAG}}', f"{subject} Notes, Manuals & PDFs - MSBTE {data['scheme']}")
        html_content = html_content.replace('{{META_DESCRIPTION}}', f"Download {subject} notes, manuals, assignments, and study materials for MSBTE '{data['scheme']}'. Free PDF downloads for highest marks.")
        html_content = html_content.replace('{{META_KEYWORDS}}', f"{subject}, MSBTE notes, MSBTE {data['scheme']}, {year_level} notes, {branches_list[0]} notes")
        html_content = html_content.replace('{{SLUG}}', slug)
        html_content = html_content.replace('{{SUBJECT}}', subject)
        html_content = html_content.replace('{{DATE_PUBLISHED}}', current_date)
        html_content = html_content.replace('{{SEMESTER}}', data['semester'])
        html_content = html_content.replace('{{YEAR_LEVEL}}', year_level)
        html_content = html_content.replace('{{RESOURCES_SECTION}}', resources_html)
        
        # Update Open Graph image to our real thumb
        html_content = html_content.replace('content="https://msbtenotes-info.netlify.app/resourse/blog-resourse/advanced-java-notes.png"', f'content="https://msbtenotes-info.netlify.app{thumb_url}"')
        html_content = html_content.replace('src="https://msbtenotes-info.netlify.app/resourse/blog-resourse/advanced-java-notes.png"', f'src="{thumb_url}"')

        # Write HTML file
        page_url = f"/Notes/{slug}.html"
        html_path = os.path.join(NOTES_DIR, f"{slug}.html")
        with open(html_path, 'w', encoding='utf-8') as f:
            f.write(html_content)

        # JSON metadata
        entry_data = {
            "title": f"{subject} - {data['semester']}",
            "description": f"Download {subject} notes, manuals, and study materials for {data['semester']}, {year_level}.",
            "url": page_url,
            "thumbnail": thumb_url,
            "category": "notes",
            "tags": [subject, data['semester'], year_level, "MSBTE", data['scheme']],
            "dateAdded": current_date
        }

        existing_entry = next((item for item in resources_json if item["url"] == page_url), None)
        if existing_entry:
            existing_entry.update(entry_data)
        else:
            new_entries.append(entry_data)

    print(f"Generated {len(subjects)} pages and thumbnails.")
    
    # Save JSON
    if new_entries or resources_json:
        final_list = new_entries + resources_json
        with open(JSON_FILE, 'w', encoding='utf-8') as f:
            json.dump(final_list, f, indent=4)
        print(f"Updated JSON with {len(new_entries)} new entries.")

if __name__ == '__main__':
    main()
