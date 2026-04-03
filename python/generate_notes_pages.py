import csv
import os
import re
import textwrap
from datetime import datetime
import random

# Configuration
CSV_FILE = 'notes_data.csv'
TEMPLATE_FILE = 'Notes/note_page_template.html'
OUTPUT_DIR = 'Notes'
THUMB_DIR = 'resourse/note-thumbs'

def create_slug(text):
    """Creates a URL-friendly slug from text."""
    slug = text.lower()
    slug = re.sub(r'[^a-z0-9\s-]', '', slug)
    slug = re.sub(r'\s+', '-', slug)
    return slug

def load_template():
    with open(TEMPLATE_FILE, 'r', encoding='utf-8') as f:
        return f.read()

def generate_resource_entry(resource):
    """Generates HTML for a single resource entry (View/Download) - EMBED REMOVED."""
    title = resource['Publication/Description']
    link = resource['Download Link']
    
    # Check if title is generic
    display_title = title if title and title != 'N/A' else "Study Resource"
    
    # Removed iframe embed as per user request due to connection issues
    html = f"""
    <div class="mb-4 border border-gray-100 rounded-lg p-4 bg-gray-50 flex justify-between items-center hover:bg-white hover:shadow-md transition duration-200">
        <div class="flex items-center gap-3">
            <div class="p-2 bg-blue-100 text-blue-600 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            </div>
            <div>
                <h4 class="text-md font-semibold text-gray-800">{display_title}</h4>
                <p class="text-xs text-gray-500">PDF Document</p>
            </div>
        </div>
        
        <a href="{link}" target="_blank" 
           class="inline-flex items-center gap-2 bg-white border border-blue-600 text-blue-600 font-semibold py-2 px-4 rounded-lg hover:bg-blue-600 hover:text-white transition text-sm">
            <span>Download</span>
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
        </a>
    </div>
    """
    return html

def generate_svg_thumbnail(subject, semester, slug):
    """Generates an SVG thumbnail for the note page."""
    
    # Ensure directory exists
    os.makedirs(THUMB_DIR, exist_ok=True)
    
    colors = [
        ("#EEF2FF", "#4F46E5"), # Indigo
        ("#ECFDF5", "#10B981"), # Emerald
        ("#EFF6FF", "#3B82F6"), # Blue
        ("#FAF5FF", "#A855F7"), # Purple
        ("#FFF1F2", "#F43F5E"), # Rose
        ("#FEF3C7", "#D97706"), # Amber
    ]
    
    bg_color, text_color = random.choice(colors)
    
    # Clean up text for display
    subject_text = subject[:25] + "..." if len(subject) > 25 else subject
    
    svg_content = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630">
    <rect width="1200" height="630" fill="{bg_color}"/>
    <g transform="translate(600, 315) scale(9) translate(-16, -16)">
        <path d="M27 6H5C3.34315 6 2 7.34315 2 9V23C2 24.6569 3.34315 26 5 26H27C28.6569 26 30 24.6569 30 23V9C30 7.34315 28.6569 6 27 6Z" fill="{text_color}"/>
        <path d="M16 6V26H5C4.20435 26 3.44129 25.6839 2.87868 25.1213C2.31607 24.5587 2 23.7956 2 23V9C2 8.20435 2.31607 7.44129 2.87868 6.87868C3.44129 6.31607 4.20435 6 5 6H16Z" fill="{text_color}" opacity="0.8"/>
        <path d="M12 6V20C12 20.2652 11.8946 20.5196 11.7071 20.7071C11.5196 20.8946 11.2652 21 11 21C10.7348 21 10.4804 20.8946 10.2929 20.7071C10.1054 20.5196 10 20.2652 10 20V6H12Z" fill="white"/>
        <path d="M25 13H20C19.7348 13 19.4804 12.8946 19.2929 12.7071C19.1054 12.5196 19 12.2652 19 12C19 11.7348 19.1054 11.4804 19.2929 11.2929C19.4804 11.1054 19.7348 11 20 11H25C25.2652 11 25.5196 11.1054 25.7071 11.2929C25.8946 11.4804 26 11.7348 26 12C26 12.2652 25.8946 12.5196 25.7071 12.7071C25.5196 12.8946 25.2652 13 25 13Z" fill="{text_color}" opacity="0.3"/>
        <path d="M25 17H22C21.7348 17 21.4804 16.8946 21.2929 16.7071C21.1054 16.5196 21 16.2652 21 16C21 15.7348 21.1054 15.4804 21.2929 15.2929C21.4804 15.1054 21.7348 15 22 15H25C25.2652 15 25.5196 15.1054 25.7071 15.2929C25.8946 15.4804 26 15.7348 26 16C26 16.2652 25.8946 16.5196 25.7071 16.7071C25.5196 16.8946 25.2652 17 25 17Z" fill="{text_color}" opacity="0.3"/>
        <path d="M25 21H20C19.7348 21 19.4804 20.8946 19.2929 20.7071C19.1054 20.5196 19 20.2652 19 20C19 19.7348 19.1054 19.4804 19.2929 19.2929C19.4804 19.1054 19.7348 19 20 19H25C25.2652 19 25.5196 19.1054 25.7071 19.2929C25.8946 19.4804 26 19.7348 26 20C26 20.2652 25.8946 20.5196 25.7071 20.7071C25.5196 20.8946 25.2652 21 25 21Z" fill="{text_color}" opacity="0.3"/>
    </g>
    <text x="600" y="470" font-family="Arial, sans-serif" font-size="60" font-weight="bold" fill="{text_color}" text-anchor="middle">{subject}</text>
    <text x="600" y="540" font-family="Arial, sans-serif" font-size="40" fill="{text_color}" opacity="0.8" text-anchor="middle">{semester}</text>
    <text x="600" y="150" font-family="Arial, sans-serif" font-size="24" fill="{text_color}" opacity="0.6" text-anchor="middle" letter-spacing="4">MSBTE NOTES</text>
</svg>"""

    filename = f"{slug}.svg"
    filepath = os.path.join(THUMB_DIR, filename)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(svg_content)
        
    return f"/{THUMB_DIR}/{filename}"

def main():
    if not os.path.exists(CSV_FILE):
        print(f"Error: {CSV_FILE} not found.")
        return

    # 1. Read and Group Data
    grouped_data = {} # Key: (Subject, Semester) -> List of rows
    
    with open(CSV_FILE, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            key = (row['Subject'].strip(), row['Semester'].strip())
            if key not in grouped_data:
                grouped_data[key] = []
            grouped_data[key].append(row)
            
    # 2. Generate Pages
    template_content = load_template()
    count = 0
    
    for (subject, semester), resources in grouped_data.items():
        # Determine Slug
        slug = create_slug(f"{subject} {semester}")
        filename = f"{slug}.html"
        filepath = os.path.join(OUTPUT_DIR, filename)
        
        # Determine Metadata
        year_level = resources[0]['Year Level']
        
        # Generate Thumbnail
        thumb_path = generate_svg_thumbnail(subject, semester, slug)
        
        # Build Resources Section
        resources_html = ""
        for res in resources:
            resources_html += generate_resource_entry(res)
            
        # Prepare Replacements
        final_html = template_content
        final_html = final_html.replace('{{TITLE_TAG}}', f"{subject} Notes {semester} | MSBTE Free PDF")
        final_html = final_html.replace('{{META_DESCRIPTION}}', f"Download free {subject} notes, manuals, and books for {semester}, {year_level}. MSBTE Diploma.")
        final_html = final_html.replace('{{META_KEYWORDS}}', f"{subject}, {subject} notes, {semester}, MSBTE notes, diploma notes, {year_level}")
        final_html = final_html.replace('{{SUBJECT}}', subject)
        final_html = final_html.replace('{{SEMESTER}}', semester)
        final_html = final_html.replace('{{YEAR_LEVEL}}', year_level)
        final_html = final_html.replace('{{SLUG}}', slug)
        final_html = final_html.replace('{{DATE_PUBLISHED}}', datetime.now().strftime("%Y-%m-%d"))
        
        # Replace Image - Handle both the src and the OG tags if possible. 
        # The template has a hardcoded generic image currently.
        # We need to replace that specific line in the template or use regex, 
        # OR we can assume the template variable {{IMAGE_URL}} is there (which isn't yet).
        # Let's check the template again. It has: src="https://msbtenotes-info.netlify.app/resourse/blog-resourse/advanced-java-notes.png"
        # We should REPLACE that string.
        
        default_img = "https://msbtenotes-info.netlify.app/resourse/blog-resourse/advanced-java-notes.png"
        final_html = final_html.replace(default_img, thumb_path)
        
        # Also replace any other occurrences (OG Image)
        final_html = final_html.replace(default_img, thumb_path) # doing it again just in case
        
        final_html = final_html.replace('{{RESOURCES_SECTION}}', resources_html)
        
        # Write File
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(final_html)
            
        print(f"Generated: {filepath}")
        count += 1
        
    print(f"Total pages generated: {count}")

if __name__ == "__main__":
    main()
