const fs = require('fs');
const path = require('path');

const directory = 'c:\\Camper\\src';

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
    let original = content;
    
    // Fix Rupee Symbol
    content = content.replace(/â‚¹/g, '₹');
    // Fix Multiplication Sign
    content = content.replace(/Ã—/g, '×');
    
    if (original !== content) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Fixed encoding in: ' + filePath);
    }
  }
});
