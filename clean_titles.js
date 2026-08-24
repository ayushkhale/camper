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
            
            const regex = /title=\{\s*<Text[^>]*>([\s\S]*?)<\/Text>\s*\}/g;
            let changed = false;
            
            let newContent = content.replace(regex, (match, inner) => {
                changed = true;
                inner = inner.trim();
                if (inner.startsWith('{') && inner.endsWith('}')) {
                    return 'title=' + inner; // e.g. title={t('hello')}
                } else {
                    return 'title={`' + inner + '`}'; // title={`Hello`}
                }
            });
            
            if (changed) {
                fs.writeFileSync(p, newContent, 'utf-8');
                count++;
                console.log('Updated', f);
            }
        }
    }
}

walkDir(dir);
console.log('Total files updated:', count);
