import os
import glob

def replace_in_files(directory, old_str, new_str):
    for filepath in glob.glob(os.path.join(directory, "**", "*.py"), recursive=True):
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()
        
        if old_str in content:
            content = content.replace(old_str, new_str)
            with open(filepath, "w", encoding="utf-8") as f:
                f.write(content)
            print(f"Updated {filepath}")

replace_in_files("app/routers", 'result["records"]', 'result["items"]')
replace_in_files("app/routers", "result['records']", "result['items']")

