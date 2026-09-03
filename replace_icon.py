import os
import re

directory = r'c:\Camper\src\Screens\Main'
chevron_pattern = re.compile(r'<ChevronLeft[^>]*>')

for root, _, files in os.walk(directory):
    for file in files:
        if file.endswith('.jsx'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            if 'ChevronLeft' in content:
                new_content = chevron_pattern.sub('<ArrowLeft size={24} color="#0B409C" />', content)
                
                if 'ArrowLeft' not in new_content:
                    new_content = re.sub(r'import\s+\{([^}]+)\}\s+from\s+[\'"]lucide-react-native[\'"]', lambda m: f"import {{{m.group(1)}, ArrowLeft}} from 'lucide-react-native'", new_content)
                
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f'Updated {file}')
