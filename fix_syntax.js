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
    
    // Fix double comma issue created by previous script
    // E.g. "Plus,\n, ArrowLeft}" => "Plus,\nArrowLeft}"
    let original = content;
    
    // Replace trailing comma followed by newline and another comma
    // basically we have \n, ArrowLeft}
    // we want to just remove that extra comma.
    content = content.replace(/,\s*,\s*ArrowLeft/g, ',\n  ArrowLeft');
    
    // Also, if someone had "Plus\n, ArrowLeft" it's valid but ugly, let's fix that too
    content = content.replace(/([A-Za-z0-9]+)\s*\n\s*,\s*ArrowLeft/g, '$1,\n  ArrowLeft');
    
    // Just in case it generated "Plus,, ArrowLeft" inline
    content = content.replace(/,,\s*ArrowLeft/g, ', ArrowLeft');

    if (original !== content) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Fixed syntax in: ' + filePath);
    }
  }
});
