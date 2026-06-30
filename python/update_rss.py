
import json
import datetime
from email.utils import formatdate
import os

# Configuration
BASE_URL = "https://msbtenotes-info.netlify.app"
BLOGS_JSON_PATH = "blogs.json"
RSS_FEED_PATH = "rss.xml"

def generate_rss_item(blog_post):
    title = blog_post.get('title', 'No Title')
    link = f"{BASE_URL}{blog_post.get('url', '')}"
    description = blog_post.get('description', '')
    image_url = f"{BASE_URL}{blog_post.get('image', '')}"
    
    # pubDate should be RFC 822 format. 
    # The JSON has "February 1, 2026 · 10 min read". We need to parse this or use current time if parsing fails.
    date_str_raw = blog_post.get('dateAndReadTime', '').split(' · ')[0].strip()
    dt = None
    for fmt in ("%B %d, %Y", "%b %d, %Y"):
        try:
            dt = datetime.datetime.strptime(date_str_raw, fmt)
            break
        except ValueError:
            continue
    if dt is None:
        # Extra fallback: strip periods if any
        date_str_raw_no_dot = date_str_raw.replace('.', '')
        for fmt in ("%B %d, %Y", "%b %d, %Y"):
            try:
                dt = datetime.datetime.strptime(date_str_raw_no_dot, fmt)
                break
            except ValueError:
                continue

    if dt is not None:
        pub_date = formatdate(float(dt.timestamp()))
    else:
        # Fallback to current time if parsing fails
        pub_date = formatdate(float(datetime.datetime.now().timestamp()))

    # Determine mime type based on extension
    mime_type = "image/jpeg"
    if image_url.lower().endswith(".png"):
        mime_type = "image/png"
    elif image_url.lower().endswith(".gif"):
        mime_type = "image/gif"
    elif image_url.lower().endswith(".webp"):
        mime_type = "image/webp"

    return f"""    <item>
      <title>{title}</title>
      <link>{link}</link>
      <description>{description}</description>
      <pubDate>{pub_date}</pubDate>
      <guid>{link}</guid>
      <media:content url="{image_url}" medium="image" />
      <enclosure url="{image_url}" type="{mime_type}" length="0" />
    </item>"""

def generate_rss():
    print("Generating RSS feed...")
    try:
        with open(BLOGS_JSON_PATH, 'r', encoding='utf-8') as f:
            blogs = json.load(f)
    except FileNotFoundError:
        print(f"Error: {BLOGS_JSON_PATH} not found.")
        return

    rss_items = []
    for blog in blogs:
        rss_items.append(generate_rss_item(blog))

    last_build_date = formatdate(float(datetime.datetime.now().timestamp()))

    rss_content = f"""<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>MSBTE Notes & Info Blog</title>
    <link>{BASE_URL}</link>
    <description>Latest updates, scholarship guides, and academic news for MSBTE students.</description>
    <language>en-us</language>
    <lastBuildDate>{last_build_date}</lastBuildDate>
    <image>
      <url>{BASE_URL}/resourse/favicon-32x32.png</url>
      <title>MSBTE Notes & Info</title>
      <link>{BASE_URL}</link>
    </image>
{chr(10).join(rss_items)}
  </channel>
</rss>
"""

    with open(RSS_FEED_PATH, 'w', encoding='utf-8') as f:
        f.write(rss_content)
    
    print(f"Successfully generated {RSS_FEED_PATH} with {len(blogs)} items.")

if __name__ == "__main__":
    generate_rss()
