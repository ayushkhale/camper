
import os, re

d = 'c:/Camper/src/Screens'
count = 0

for root, _, files in os.walk(d):
    for f in files:
        if f.endswith('.jsx'):
            p = os.path.join(root, f)
            with open(p, 'r', encoding='utf-8') as file:
                content = file.read()
            
            # Find all <CurvedHeader ... /> or <CurvedHeader ...>...</CurvedHeader>
            # We'll use a regex that matches <CurvedHeader and then anything until the next > or />.
            # But since CurvedHeader can have children, we might just want to replace '#0F172A' with '#0B409C' 
            # globally if it's safe? Let's check if #0F172A is used everywhere for text.
            # If so, replacing it everywhere might turn ALL black text into blue!
            # Let's be safer: only replace in lines containing 'leftIcon={', 'rightIcon={', or 'title={'
            
            lines = content.split('\n')
            new_lines = []
            changed = False
            in_header = False
            
            for line in lines:
                if '<CurvedHeader' in line:
                    in_header = True
                
                if in_header:
                    if 'leftIcon={' in line or 'rightIcon={' in line or 'title={' in line or 'color=' in line or 'color:' in line:
                        if '#0F172A' in line:
                            line = line.replace('#0F172A', '#0B409C')
                            changed = True
                    if '/>' in line or '</CurvedHeader>' in line:
                        # naive end check, might not be perfect if they are on same line as other things but usually they are on their own line
                        # Actually just replace it if we are roughly inside the header block
                        in_header = False
                
                new_lines.append(line)
                
            if changed:
                with open(p, 'w', encoding='utf-8') as file:
                    file.write('\n'.join(new_lines))
                count += 1
                print('Updated', f)

print('Total files updated:', count)

