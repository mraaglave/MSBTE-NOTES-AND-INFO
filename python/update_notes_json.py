import json
import csv
import os
import re
from datetime import datetime

# Configuration
CSV_FILE = 'notes_data.csv'
JSON_FILE = 'Notes/resources.json'
OUTPUT_DIR = 'Notes'

def create_slug(text):
    """Creates a URL-friendly slug from text."""
    slug = text.lower()
    slug = re.sub(r'[^a-z0-9\s-]', '', slug)
    slug = re.sub(r'\s+', '-', slug)
    return slug

def main():
    if not os.path.exists(CSV_FILE):
        print(f"Error: {CSV_FILE} not found.")
        return
    
    if not os.path.exists(JSON_FILE):
        print(f"Error: {JSON_FILE} not found.")
        return

    # 1. Read CSV and Group Data
    grouped_data = {} # Key: (Subject, Semester) -> List of rows
    
    with open(CSV_FILE, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            key = (row['Subject'].strip(), row['Semester'].strip())
            if key not in grouped_data:
                grouped_data[key] = []
            grouped_data[key].append(row)

    # 2. Read Existing JSON
    try:
        with open(JSON_FILE, 'r', encoding='utf-8') as f:
            resources = json.load(f)
    except Exception as e:
        print(f"Error reading JSON: {e}")
        return

    # 3. Create New Entries
    new_resources = []
    existing_urls = {res['url'] for res in resources}
    current_date = datetime.now().strftime("%Y-%m-%d")

    for (subject, semester), data_rows in grouped_data.items():
        slug = create_slug(f"{subject} {semester}")
        url = f"/Notes/{slug}.html"
        
        # Check if URL already exists
        existing_entry = next((item for item in resources if item["url"] == url), None)

        year_level = data_rows[0]['Year Level']
        
        # Determine Category
        category = 'notes'
        
        # Create Title
        title = f"{subject} - {semester}"
        
        # Create Description
        description = f"Download {subject} notes, manuals, and study materials for {semester}, {year_level}."
        
        # Assign Tags
        tags = [subject, semester, year_level, "MSBTE", "K-Scheme"]
        
        # Thumbnail
        # Use the generated SVG thumbnail
        thumbnail = f"/resourse/note-thumbs/{slug}.svg"
        
        # Create Entry Data
        entry_data = {
            "title": title,
            "description": description,
            "url": url,
            "thumbnail": thumbnail,
            "category": category,
            "tags": tags,
            "dateAdded": current_date
        }
        
        if existing_entry:
            # Update existing entry
            existing_entry.update(entry_data)
            print(f"Updated existing: {url}")
        else:
            # Add new entry
            new_resources.append(entry_data)
            existing_urls.add(url)

    # 4. Append and Save
    if new_resources or resources:
        # Prepend new resources so they show up first
        updated_resources = new_resources + resources
        
        # Remove duplicates if any (just in case) - though logic above handles it mostly.
        # Actually, since we updated 'resources' in place for existing ones, and added to 'new_resources',
        # we just need to combine them carefully. 
        # But wait, 'resources' already contains the updated existing ones.
        # So we just prepend 'new_resources' to 'resources'.
        
        final_list = new_resources + resources
        
        with open(JSON_FILE, 'w', encoding='utf-8') as f:
            json.dump(final_list, f, indent=4)
            
        print(f"Processed resources. Added {len(new_resources)} new, updated others.")
    else:
        print("No changes.")

if __name__ == "__main__":
    main()
