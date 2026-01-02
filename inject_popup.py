import os

root_dir = r"c:\Users\bitbu\OneDrive\Documents\GitHub\MSBTE-NOTES-AND-INFO"
target_script = "whatsapp-popup.js"

for subdir, dirs, files in os.walk(root_dir):
    for file in files:
        if file.endswith(".html"):
            file_path = os.path.join(subdir, file)
            
            # Calculate relative path to the script
            rel_path = os.path.relpath(os.path.join(root_dir, target_script), subdir)
            # Ensure forward slashes for HTML
            rel_path = rel_path.replace("\\", "/")
            
            script_tag = f'<script src="{rel_path}" defer></script>'
            
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    content = f.read()
                
                # Check if script is already present (avoid duplicates)
                if "whatsapp-popup.js" in content:
                    print(f"Skipping {file}: Already has script.")
                    continue
                
                # Inject before </body>
                if "</body>" in content:
                    new_content = content.replace("</body>", f"{script_tag}\n</body>")
                    
                    with open(file_path, "w", encoding="utf-8") as f:
                        f.write(new_content)
                    print(f"Updated {file}")
                else:
                    print(f"Skipping {file}: No </body> tag found.")
                    
            except Exception as e:
                print(f"Error processing {file}: {e}")
