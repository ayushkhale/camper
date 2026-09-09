const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const checkedExtensions = new Set(['.js', '.jsx', '.ts', '.tsx']);
const ignoredDirectories = new Set(['.git', 'android', 'ios', 'node_modules']);
const files = [];

const visit = (directory) => {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue;
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      visit(entryPath);
    } else if (checkedExtensions.has(path.extname(entry.name))) {
      files.push(entryPath);
    }
  }
};

visit(root);

const resolveSpecifier = (fromFile, specifier) => {
  const basePath = path.resolve(path.dirname(fromFile), specifier);
  const candidates = [
    basePath,
    `${basePath}.js`,
    `${basePath}.jsx`,
    `${basePath}.ts`,
    `${basePath}.tsx`,
    `${basePath}.json`,
    path.join(basePath, 'index.js'),
    path.join(basePath, 'index.jsx'),
    path.join(basePath, 'index.ts'),
    path.join(basePath, 'index.tsx'),
  ];
  return candidates.some((candidate) => {
    if (!fs.existsSync(candidate)) return false;
    return fs.statSync(candidate).isFile();
  });
};

const unresolved = [];
const relativeSpecifierPatterns = [
  /\bfrom\s+(['"])(\.{1,2}\/[^'"\r\n]+)\1/g,
  /\bimport\s+(['"])(\.{1,2}\/[^'"\r\n]+)\1/g,
  /\b(?:require|import)\(\s*(['"])(\.{1,2}\/[^'"\r\n]+)\1\s*\)/g,
];

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  for (const pattern of relativeSpecifierPatterns) {
    for (const match of content.matchAll(pattern)) {
      const specifier = match[2];
      if (!resolveSpecifier(file, specifier)) {
        const line = content.slice(0, match.index).split(/\r?\n/).length;
        unresolved.push(`${path.relative(root, file)}:${line} -> ${specifier}`);
      }
    }
  }
}

if (unresolved.length > 0) {
  console.error('Unresolved relative imports:');
  for (const issue of unresolved) console.error(`- ${issue}`);
  process.exitCode = 1;
} else {
  console.log(`Verified ${files.length} source files: all relative imports resolve.`);
}
