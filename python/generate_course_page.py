
import json
import re

# The user provided data (truncated in prompt, so I'm taking the valid parts)
# I will simulate the reading of the data or just put the list here.
# Since the data is large, I'll paste the valid JSON objects I extracted.

raw_data = """
[
    {
        "Title": "1.LOGARITHM | FIRST YEAR DIPLOMA|POLYTECHNIClLogarithmic Form |Exponential Form|K Scheme|Lecture 01",
        "Video url": "https://www.youtube.com/watch?v=jjEH9QOYzGk",
        "Duration": "12 Minutes, 4 Seconds"
    },
    {
        "Title": "1.LOGARITHM | FIRST YEAR DIPLOMA|POLYTECHNIC|K Scheme|Lecture 02|BASIC MATHEMATICS",
        "Video url": "https://www.youtube.com/watch?v=VyiXHIhWilA",
        "Duration": "14 Minutes, 19 Seconds"
    },
    {
        "Title": "1.LOGARITHM | FIRST YEAR DIPLOMA|POLYTECHNIC|K Scheme|Lecture 03|BASIC MATHEMATICS",
        "Video url": "https://www.youtube.com/watch?v=iVk9Vyc4ev0",
        "Duration": "13 Minutes, 46 Seconds"
    },
    {
        "Title": "2.Matrices |Determinants|FIRST YEAR DIPLOMA|POLYTECHNIC|K Scheme|Lecture 01|BASIC MATHEMATICS",
        "Video url": "https://www.youtube.com/watch?v=8RPicbNxNAk",
        "Duration": "11 Minutes, 59 Seconds"
    },
    {
        "Title": "Matrices |Types of Matrices |FIRST YEAR DIPLOMA|POLYTECHNIC|K Scheme|Lecture 02",
        "Video url": "https://www.youtube.com/watch?v=TerHGvcnh48",
        "Duration": "11 Minutes, 41 Seconds"
    },
    {
        "Title": "Matrices |Addition and Substraction of Matrix |FIRST YEAR DIPLOMA|POLYTECHNIC|K Scheme|Lecture 03",
        "Video url": "https://www.youtube.com/watch?v=pVNqsLdfuDg",
        "Duration": "14 Minutes, 13 Seconds"
    },
    {
        "Title": "Matrices|Multiplication of Matrices |FIRST YEAR DIPLOMA|POLYTECHNIC|K Scheme|Lecture 04",
        "Video url": "https://www.youtube.com/watch?v=45d3wf5K1_0",
        "Duration": "19 Minutes, 8 Seconds"
    },
    {
        "Title": "Matrices|Transpose of a Matrix |FIRST YEAR DIPLOMA|POLYTECHNIC|K Scheme|Lecture 05",
        "Video url": "https://www.youtube.com/watch?v=bxBSlHa_jQo",
        "Duration": "11 Minutes, 3 Seconds"
    },
    {
        "Title": "Matrices|Inverse of Matrix |FIRST YEAR DIPLOMA|POLYTECHNIC|K Scheme|Lecture 06",
        "Video url": "https://www.youtube.com/watch?v=jYbi8P9sGfc",
        "Duration": "15 Minutes, 43 Seconds"
    },
    {
        "Title": "PARTIAL FRACTIONS|LETURE 01|DIPLOMA|BASIC MATHEMATICS|PRADEEP GIRI SIR",
        "Video url": "https://www.youtube.com/watch?v=RBDg8MflUmA",
        "Duration": "18 Minutes, 5 Seconds"
    },
    {
        "Title": "PARTIAL FRACTIONS|LETURE 02|DIPLOMA|BASIC MATHEMATICS|PRADEEP GIRI SIR",
        "Video url": "https://www.youtube.com/watch?v=rpb_WBmPwn4",
        "Duration": "11 Minutes, 59 Seconds"
    },
    {
        "Title": "PARTIAL FRACTIONS|LETURE 03|DIPLOMA|BASIC MATHEMATICS|PRADEEP GIRI SIR",
        "Video url": "https://www.youtube.com/watch?v=beU5lh9Ig90",
        "Duration": "10 Minutes, 37 Seconds"
    },
    {
        "Title": "PARTIAL FRACTIONS|IMPROPER FRACTIONS|LETURE 04|DIPLOMA|BASIC MATHEMATICS|PRADEEP GIRI SIR",
        "Video url": "https://www.youtube.com/watch?v=u0xaOvWt7eA",
        "Duration": "14 Minutes, 19 Seconds"
    },
    {
        "Title": "Straight Line | Slope of Straight Line|Lecture 01|First Year Diploma & Polytechnic | Pradeep Giri",
        "Video url": "https://www.youtube.com/watch?v=ffJmYKgFpac",
        "Duration": "15 Minutes, 28 Seconds"
    },
    {
        "Title": "Straight Line | Lecture 02 | First Year Diploma & Polytechnic | Pradeep Giri Sir",
        "Video url": "https://www.youtube.com/watch?v=tSAiWAjy9IU",
        "Duration": "19 Minutes, 10 Seconds"
    },
    {
        "Title": "Straight Line | Lecture 03 | First Year Diploma & Polytechnic|Equation of Line | Pradeep Giri Sir",
        "Video url": "https://www.youtube.com/watch?v=gwVKHr8CHnk",
        "Duration": "12 Minutes, 32 Seconds"
    },
    {
        "Title": "Straight Line | Lecture 04 | First Year Diploma & Polytechnic | Pradeep Giri Sir",
        "Video url": "https://www.youtube.com/watch?v=OhFQUlcEk9U",
        "Duration": "43 Minutes, 36 Seconds"
    },
    {
        "Title": "Straight Line|Angles between  two lines | Lecture 05|First Year Diploma & Polytechnic",
        "Video url": "https://www.youtube.com/watch?v=YEIBda-HhvU",
        "Duration": "18 Minutes, 2 Seconds"
    },
    {
        "Title": "Derivatives|Easy Trick to Learn Important Formulae|Lecture01|First Year Diploma & Polytechnic",
        "Video url": "https://www.youtube.com/watch?v=-296435dMfk",
        "Duration": "13 Minutes, 20 Seconds"
    },
    {
        "Title": "Derivatives|Derivatives of sum or difference of functions|Lecture02|First Year Diploma & Polytechnic",
        "Video url": "https://www.youtube.com/watch?v=GMa_cT2k24A",
        "Duration": "17 Minutes, 9 Seconds"
    },
     {
        "Title": "Derivatives|Derivation of composite functions|Chain Rule|Lecture03|First Year Diploma & Polytechnic",
        "Video url": "https://www.youtube.com/watch?v=6amTET0VGNg",
        "Duration": "24 Minutes, 51 Seconds"
    }
]
"""

videos = json.loads(raw_data)

# Read Template
with open('video-course/topic-template.html', 'r', encoding='utf-8') as f:
    template = f.read()

# Generate Video List HTML
video_list_html = ""
first_video_id = ""

for index, video in enumerate(videos):
    # Extract ID
    # URL format: https://www.youtube.com/watch?v=jjEH9QOYzGk
    vid_id = video['Video url'].split('v=')[1].split('&')[0]
    
    if index == 0:
        first_video_id = vid_id

    # Clean Title (Remove redundant info often found in these scrape titles)
    # Remove | FIRST YEAR... etc to keep it clean if possible, but regex might be risky. 
    # Let's keep title as is but maybe truncate if too long.
    title = video['Title'].split('|')[0] + " - " + (video['Title'].split('|')[3] if len(video['Title'].split('|')) > 3 else "")
    # Fallback to simple title if split fails or produces weird result
    if len(title) < 5: 
        title = video['Title']
        
    duration = video['Duration'].split(',')[0] # "12 Minutes"

    active_class = "active-video" if index == 0 else ""
    badge_color = "bg-blue-100 text-blue-600" if index == 0 else "bg-gray-100 text-gray-600"

    video_list_html += f"""
                <button onclick="changeVideo('{vid_id}', this)" class="w-full text-left p-4 hover:bg-gray-50 border-b border-gray-100 transition duration-150 group {active_class}">
                    <div class="flex gap-3">
                        <div class="flex-shrink-0 mt-1">
                             <div class="w-6 h-6 rounded-full {badge_color} flex items-center justify-center text-xs font-bold ring-2 ring-transparent group-hover:ring-blue-200 transition">{index + 1}</div>
                        </div>
                        <div>
                            <h4 class="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition">{title}</h4>
                            <p class="text-xs text-gray-500 mt-1">{duration}</p>
                        </div>
                    </div>
                </button>
    """

# Replace Placeholders
output_html = template.replace('VIDEO_ID', first_video_id)
output_html = output_html.replace('Course Title', 'Basic Mathematics (K-Scheme)')
# Clean up the sample video items in template first
# Find the video-list container in template and replace contents
# We can use a marker or just replace the specific block if we know it.
# Since I created the template, I know the structure.
# I will replace:
# <!-- Video Item --> ... <!-- Add more buttons dynamically here -->
# with my generated html.

# A simple way is to use a placeholder in the template or regex.
# I'll just do a rough replace of the sample content.
# The sample content starts after <div class="video-list overflow-y-auto flex-1">
# And ends before <div class="p-4 border-t border-gray-200 bg-gray-50">

start_marker = '<div class="video-list overflow-y-auto flex-1">'
end_marker = '<div class="p-4 border-t border-gray-200 bg-gray-50">'

start_idx = template.find(start_marker) + len(start_marker)
end_idx = template.find(end_marker)

final_html = template[:start_idx] + "\n" + video_list_html + "\n" + template[end_idx:]

# Also update Meta Tags
final_html = final_html.replace('Topic Name', 'Basic Mathematics')
final_html = final_html.replace('Watch Topic Name', 'Watch Basic Mathematics')

# Write to file
with open('video-course/basic-mathematics.html', 'w', encoding='utf-8') as f:
    f.write(final_html)

print("Generated basic-mathematics.html")
