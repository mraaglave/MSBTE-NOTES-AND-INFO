
import json
import csv
import datetime
import os

# Configuration
BASE_URL = "https://msbtenotes-info.netlify.app"
BLOGS_JSON_PATH = "blogs.json"
OUTPUT_CSV_PATH = os.path.join("data", "pinterest_upload.csv")
PINTEREST_BOARD = "MSBTE Updates"

def parse_date(date_str_raw):
    # Format in JSON: "February 1, 2026 · 12 min read"
    clean_date_str = date_str_raw.split(' · ')[0].strip()
    for fmt in ("%B %d, %Y", "%b %d, %Y"):
        try:
            dt = datetime.datetime.strptime(clean_date_str, fmt)
            return dt.strftime("%Y-%m-%d")
        except ValueError:
            continue
    # Extra fallback: strip periods if any
    clean_date_str_no_dot = clean_date_str.replace('.', '')
    for fmt in ("%B %d, %Y", "%b %d, %Y"):
        try:
            dt = datetime.datetime.strptime(clean_date_str_no_dot, fmt)
            return dt.strftime("%Y-%m-%d")
        except ValueError:
            continue
    return datetime.datetime.now().strftime("%Y-%m-%d")

def generate_csv():
    print("Generating Pinterest CSV...")
    try:
        with open(BLOGS_JSON_PATH, 'r', encoding='utf-8') as f:
            blogs = json.load(f)
    except FileNotFoundError:
        print(f"Error: {BLOGS_JSON_PATH} not found.")
        return

    # CSV Headers based on user request
    headers = [
        "Title", 
        "Media URL", 
        "Pinterest board", 
        "Thumbnail", 
        "Description", 
        "Link", 
        "Publish date", 
        "Keywords"
    ]

    with open(OUTPUT_CSV_PATH, 'w', newline='', encoding='utf-8') as csvfile:
        writer = csv.writer(csvfile)
        writer.writerow(headers)

        for blog in blogs:
            title = blog.get('title', '')[:100] # Max 100 chars
            
            image_path = blog.get('image', '')
            if image_path.startswith('http'):
                 media_url = image_path
            else:
                 media_url = f"{BASE_URL}{image_path}"
            
            # Thumbnail is blank for image uploads
            thumbnail = ""
            
            description = blog.get('description', '')[:500] # Max 500 chars
            
            link = f"{BASE_URL}{blog.get('url', '')}"
            
            publish_date = parse_date(blog.get('dateAndReadTime', ''))
            
            keywords_list = blog.get('keywords', [])
            keywords = ", ".join(keywords_list)

            writer.writerow([
                title,
                media_url,
                PINTEREST_BOARD,
                thumbnail,
                description,
                link,
                publish_date,
                keywords
            ])
            
    print(f"Successfully generated {OUTPUT_CSV_PATH} with {len(blogs)} items.")

if __name__ == "__main__":
    generate_csv()
