const fs = require('fs');
const path = require('path');

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const issues = [];
  
  if (content.includes('COLORS.') && !content.includes('constants/colors')) {
    issues.push('COLORS');
  }
  if (content.includes('useNavigation(') && !content.includes('@react-navigation/native')) {
    issues.push('useNavigation');
  }
  if (content.includes('useTranslation(') && !content.includes('react-i18next')) {
    issues.push('useTranslation');
  }
  if (content.includes('api.') && !content.includes('services/api')) {
    issues.push('api');
  }
  if (content.includes('CurvedHeader') && !content.includes('CurvedHeader')) {
    issues.push('CurvedHeader');
  }
  
  if (issues.length > 0) {
    console.log(`${filePath} is missing: ${issues.join(', ')}`);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else if (fullPath.endsWith('.js') || fullPath.endsWith('.jsx')) {
      checkFile(fullPath);
    }
  }
}

walkDir('src');
console.log('Done scanning.');
