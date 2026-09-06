// Post-build: inject .js extensions into relative ESM imports
// Required because TypeScript with moduleResolution bundler strips extensions
const fs = require('fs');
const path = require('path');

function addExtensions(dir) {
  fs.readdirSync(dir, { withFileTypes: true }).forEach(dirent => {
    const fullPath = path.join(dir, dirent.name);
    if (dirent.isDirectory()) {
      addExtensions(fullPath);
    } else if (fullPath.endsWith('.js')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      const before = content;
      content = content.replace(
        /from\s+['"](\.\/[^'"]+?)['"]/g,
        (match, p1) => !p1.endsWith('.js') ? `from '${p1}.js'` : match
      );
      content = content.replace(
        /from\s+['"](\.\.\/[^'"]+?)['"]/g,
        (match, p1) => !p1.endsWith('.js') ? `from '${p1}.js'` : match
      );
      if (content !== before) {
        fs.writeFileSync(fullPath, content);
      }
    }
  });
}

addExtensions(path.resolve(__dirname, '../dist'));
console.log('ESM extensions injected successfully');
