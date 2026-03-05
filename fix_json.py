import json
import re

with open('blogs.json', 'r', encoding='utf-8') as f:
    content = f.read()

bad_str_pattern = r'\"keywords\": \[\s*\{\s*\"id\": \"msbte-summer-2026-exam-time-table\",\s*\"title\": \"MSBTE Summer 2026 Exam Time Table & Date \| Complete Schedule Guide\",\s*\"image\": \"/resourse/blog-resourse/msbte-summer-2026-exam-roadmap\.png\",\s*\"imageAlt\": \"MSBTE Summer 2026 Exam Time Table and Preparation Guide\",\s*\"dateAndReadTime\": \"March [^\"]+\",\s*\"shortTitle\": \"MSBTE Summer 2026 Exam Time Table\",\s*\"description\": \"[^\"]+\",\s*\"url\": \"/Blog/msbte-summer-2026-exam-time-table\.html\",\s*\"keywords\": \[\s*\"msbte summer 2026 exam time table\",\s*\"msbte time table\",\s*\"msbte time table summer 2026\",\s*\"msbte exam time table 2026\",\s*\"msbte summer exam date 2026\"\s*\]\s*\},'

content = re.sub(bad_str_pattern, '"keywords": [', content)

# Also fix encoding issues if any
content = content.replace('Â·', '·')

try:
    data = json.loads(content)
    # Validate the data looks good
    for item in data:
        if 'keywords' in item:
            for kw in item['keywords']:
                if isinstance(kw, dict):
                    print("Still has malformed keywords:", kw)
                    exit(1)
    
    with open('blogs.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=4)
        
    print("Fixed JSON successfully")
except Exception as e:
    print("Error:", e)
