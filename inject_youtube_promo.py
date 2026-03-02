import os
import glob

promo_box_html = """
            <!-- Subscribe Promo Box -->
            <div class="bg-gradient-to-r from-red-50 to-white border border-red-100 p-5 rounded-xl shadow-sm mb-8 mt-6 flex flex-col md:flex-row items-center gap-4">
                <div class="bg-red-500 text-white rounded-full p-3 flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
                    </svg>
                </div>
                <div class="flex-grow text-center md:text-left">
                    <h3 class="font-bold text-gray-900 text-lg">Subscribe to Our YouTube Channel!</h3>
                    <p class="text-gray-600 text-sm mt-1">Get the latest MSBTE updates, video lectures, and exam tips directly on YouTube.</p>
                </div>
                <a href="https://www.youtube.com/@msbte-notes-and-info" target="_blank" class="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-full transition-colors flex-shrink-0 whitespace-nowrap">
                    Subscribe
                </a>
            </div>"""

blog_dir = r"c:\Users\bitbu\OneDrive\Documents\GitHub\MSBTE-NOTES-AND-INFO\Blog\*.html"
files = glob.glob(blog_dir)

count = 0
for file in files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Check if already has subscribe promo
    if "Subscribe to Our YouTube Channel!" in content:
        continue
    
    # Try to inject right after `<div class="prose prose-blue max-w-none">`
    target = '<div class="prose prose-blue max-w-none">'
    if target in content:
        parts = content.split(target, 1)
        new_content = parts[0] + target + promo_box_html + parts[1]
        
        with open(file, 'w', encoding='utf-8') as f:
            f.write(new_content)
        count += 1
        print(f"Updated {file}")
    else:
        # Fallback target
        target2 = '<div class="prose max-w-none">'
        if target2 in content:
            parts = content.split(target2, 1)
            new_content = parts[0] + target2 + promo_box_html + parts[1]
            
            with open(file, 'w', encoding='utf-8') as f:
                f.write(new_content)
            count += 1
            print(f"Updated {file}")

print(f"\nTotal updated: {count} files.")
