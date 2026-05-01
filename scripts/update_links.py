import csv
import os
import re

csv_file = 'msbte_k_scheme_subjects.csv'
branches_dir = 'Branches'

# 1. Parse CSV to get code -> link mapping
subject_links = {}
with open(csv_file, 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        code = row['Subject Code'].strip()
        link = row['PDF Link'].strip()
        if code and link:
            # We'll keep the first one we find.
            if code not in subject_links:
                subject_links[code] = link

# 2. Iterate through HTML files in Branches/
count = 0
for filename in os.listdir(branches_dir):
    if not filename.endswith('.html'):
        continue
    
    # Try to extract code from filename
    m = re.match(r'^([A-Z0-9]+)-', filename)
    code = None
    if m:
        code = m.group(1)
    else:
        m2 = re.match(r'^([A-Z0-9]+)\.html$', filename, re.IGNORECASE)
        if m2:
            code = m2.group(1).upper()
            
    if code and code in subject_links:
        filepath = os.path.join(branches_dir, filename)
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        new_link = subject_links[code]
        
        # Regex to update the syllabus link
        # It looks like:
        # <a href="..."
        #     target="_blank"
        #     class="...">
        #     Download Syllabus PDF ⬇
        # </a>
        # We can look forhref=\"[^\"]*\" and check if it's within 300 characters of 'Download Syllabus'
        # Let's use re.subn with a simpler pattern.
        new_content, num_subs = re.subn(
            r'(href=")([^"]*)("([^>]*>\s*Download Syllabus PDF ⬇))', 
            lambda match: match.group(1) + new_link + match.group(3), 
            content, 
            flags=re.IGNORECASE | re.DOTALL
        )
        
        # Fallback if text differs slightly
        if num_subs == 0:
            new_content, num_subs = re.subn(
                r'(href=")([^"]*)("([^>]*>\s*(?:Download )?Syllabus(?: PDF)?(?:\s*⬇|\s*&darr;)?\s*<))', 
                lambda match: match.group(1) + new_link + match.group(3), 
                content, 
                flags=re.IGNORECASE | re.DOTALL
            )
            
        if num_subs > 0 and new_content != content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            count += 1
            print(f'Updated {filename}')
        elif new_content == content and num_subs > 0:
            pass # Link was already correct
        else:
            print(f'Could not find Download Syllabus link to replace in {filename}')

print(f'Total updated: {count}')
