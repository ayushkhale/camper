
const fs = require('fs');
const path = require('path');

const dir = 'c:/Camper/src/Screens';
let count = 0;

function walkDir(d) {
    const files = fs.readdirSync(d);
    for (const f of files) {
        const p = path.join(d, f);
        const stat = fs.statSync(p);
        if (stat.isDirectory()) {
            walkDir(p);
        } else if (f.endsWith('.jsx')) {
            let content = fs.readFileSync(p, 'utf-8');
            let lines = content.split('\n');
            let changed = false;
            let inHeader = false;
            
            for (let i = 0; i < lines.length; i++) {
                if (lines[i].includes('<CurvedHeader')) {
                    inHeader = true;
                }
                
                if (inHeader) {
                    if (lines[i].includes('#0F172A')) {
                        lines[i] = lines[i].replace(/#0F172A/g, '#0B409C');
                        changed = true;
                    }
                    if (lines[i].includes('/>') || lines[i].includes('</CurvedHeader>')) {
                        inHeader = false;
                    }
                }
            }
            
            if (changed) {
                fs.writeFileSync(p, lines.join('\n'), 'utf-8');
                count++;
                console.log('Updated', f);
            }
        }
    }
}

walkDir(dir);
console.log('Total files updated:', count);

