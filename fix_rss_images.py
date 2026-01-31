import os
import xml.etree.ElementTree as ET
from bs4 import BeautifulSoup
import urllib.parse
import re

# Configuration
RSS_FILE = 'rss.xml'
BASE_URL = 'https://msbtenotes-info.netlify.app'
LOCAL_ROOT = os.getcwd()

# Namespace map (crucial for valid RSS)
NAMESPACES = {
    'media': 'http://search.yahoo.com/mrss/',
    'atom': 'http://www.w3.org/2005/Atom'
}

def register_namespaces():
    for prefix, uri in NAMESPACES.items():
        ET.register_namespace(prefix, uri)

def get_local_path(url):
    """Converts a full URL to a local file path."""
    parsed = urllib.parse.urlparse(url)
    path = parsed.path
    if path.startswith('/'):
        path = path[1:]
    return os.path.join(LOCAL_ROOT, path.replace('/', os.sep))

def get_og_image(html_path):
    """Extracts og:image content from a local HTML file."""
    try:
        with open(html_path, 'r', encoding='utf-8') as f:
            soup = BeautifulSoup(f, 'html.parser')
            og_image = soup.find('meta', property='og:image')
            if og_image and og_image.get('content'):
                return og_image['content']
    except Exception as e:
        print(f"Error reading {html_path}: {e}")
    return None

def clean_xml_content(content):
    """Fixes common XML errors like unescaped ampersands."""
    # Specific fix for the known title issue: "& Info" -> "&amp; Info"
    content = content.replace("Notes & Info", "Notes &amp; Info")
    return content

def update_rss():
    register_namespaces()
    
    try:
        # Read file content as string first to fix validity issues
        with open(RSS_FILE, 'r', encoding='utf-8') as f:
            raw_content = f.read()
        
        clean_content = clean_xml_content(raw_content)
        
        # Parse the cleaned string
        root = ET.fromstring(clean_content)
        channel = root.find('channel')
        
        updated_count = 0
        
        for item in channel.findall('item'):
            link = item.find('link').text
            local_path = get_local_path(link)
            
            if os.path.exists(local_path):
                image_url = get_og_image(local_path)
                
                if image_url:
                    # Check if media:content already exists to avoid duplicates
                    existing_media = item.findall(f"{{{NAMESPACES['media']}}}content")
                    if not existing_media:
                        # Add <media:content>
                        media_content = ET.SubElement(item, f"{{{NAMESPACES['media']}}}content")
                        media_content.set('url', image_url)
                        media_content.set('medium', 'image')
                        
                        # Add <enclosure> (Pinterest likes this too)
                        # Identify mime type loosely
                        mime_type = 'image/jpeg'
                        if image_url.lower().endswith('.png'):
                            mime_type = 'image/png'
                        
                        enclosure = ET.SubElement(item, 'enclosure')
                        enclosure.set('url', image_url)
                        enclosure.set('type', mime_type)
                        enclosure.set('length', '0')
                        
                        updated_count += 1
                        print(f"Updated: {link} -> {image_url}")
            else:
                 print(f"File not found: {local_path}")

        # Write back to file
        tree = ET.ElementTree(root)
        tree.write(RSS_FILE, encoding='UTF-8', xml_declaration=True)
        print(f"Successfully updated {updated_count} items in {RSS_FILE}")

    except Exception as e:
        print(f"Failed to update RSS: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    update_rss()
