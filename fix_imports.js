const fs = require('fs');
const path = require('path');

const directory = 'c:\\Camper\\src\\Screens\\Main';

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
  });
}

walkDir(directory, function(filePath) {
  if (filePath.endsWith('.jsx') || filePath.endsWith('.js')) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Check if ArrowLeft is in the import
    const importRegex = /import\s+\{([^}]+)\}\s+from\s+['"]lucide-react-native['"]/;
    const match = content.match(importRegex);
    
    if (match) {
        let imports = match[1];
        if (!imports.includes('ArrowLeft') && content.includes('ArrowLeft')) {
            // Add ArrowLeft to the import block
            let newImports = imports + ', ArrowLeft';
            let newImportStatement = `import {${newImports}} from 'lucide-react-native'`;
            content = content.replace(importRegex, newImportStatement);
            
            fs.writeFileSync(filePath, content, 'utf8');
            console.log('Fixed import in: ' + filePath);
        }
    }
  }
});
