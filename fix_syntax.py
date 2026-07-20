import os
import re

REGEX = re.compile(r'([a-zA-Z]+)=COLORS\.([a-zA-Z]+)')

def process_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    original_content = content
    content = REGEX.sub(r'\1={COLORS.\2}', content)

    if content != original_content:
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"Fixed {filepath}")

for root, _, files in os.walk('src'):
    for file in files:
        if file.endswith(('.js', '.jsx')):
            process_file(os.path.join(root, file))

