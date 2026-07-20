import os
import re

REGEX_MAPPINGS = [
    (re.compile(r'"rgba\([^)]+\)"'), "COLORS.prussianBlue"),
    (re.compile(r"'rgba\([^)]+\)'"), "COLORS.prussianBlue"),
    (re.compile(r'"#FFFFFF"'), "COLORS.prussianBlue"),
    (re.compile(r'"#FFF"'), "COLORS.prussianBlue")
]

def process_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    original_content = content

    for regex, new in REGEX_MAPPINGS:
        content = regex.sub(new, content)

    if content != original_content:
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"Updated {filepath}")

for root, _, files in os.walk('src'):
    for file in files:
        if file.endswith(('.js', '.jsx')):
            process_file(os.path.join(root, file))

