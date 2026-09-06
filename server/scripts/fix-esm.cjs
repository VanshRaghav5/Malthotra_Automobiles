#!/usr/bin/env node
/**
 * Post-build script to add .js extensions to relative ESM imports.
 * TypeScript with moduleResolution: "bundler" strips extensions,
 * but Node.js ESM requires them.
 *
 * Also handles directory imports: ./routes -> ./routes/index.js
 */
const fs = require('fs');
const path = require('path');

function addExtensions(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const dirent of entries) {
    const fullPath = path.join(dir, dirent.name);
    if (dirent.isDirectory()) {
      addExtensions(fullPath);
    } else if (dirent.name.endsWith('.js') && !dirent.name.endsWith('.d.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      const before = content;

      // Fix all import/export statements
      // Pattern: from './something' or from '../something'
      content = content.replace(
        /(from\s+['"])(\.\/[^'"]+?)(['"])/g,
        (match, p1, p2, p3) => {
          // Already has .js extension - check if file exists
          if (p2.endsWith('.js')) {
            const resolvedPath = path.resolve(dir, p2);
            if (fs.existsSync(resolvedPath)) {
              return match; // File exists, no change needed
            }
            // File doesn't exist - might be a directory import
            const indexPath = path.join(path.resolve(dir, p2.slice(0, -3)), 'index.js');
            if (fs.existsSync(indexPath)) {
              return `${p1}${p2.slice(0, -3)}/index.js${p3}`;
            }
            return match;
          }

          // No extension - check if file or directory exists
          const basePath = path.resolve(dir, p2);
          const jsPath = basePath + '.js';
          const indexPath = path.join(basePath, 'index.js');

          if (fs.existsSync(jsPath)) {
            return `${p1}${p2}.js${p3}`;
          } else if (fs.existsSync(indexPath)) {
            return `${p1}${p2}/index.js${p3}`;
          }
          return match; // Leave as is if neither exists
        }
      );

      // Same for parent directory imports
      content = content.replace(
        /(from\s+['"])(\.\.\/[^'"]+?)(['"])/g,
        (match, p1, p2, p3) => {
          if (p2.endsWith('.js')) {
            const resolvedPath = path.resolve(dir, p2);
            if (fs.existsSync(resolvedPath)) {
              return match;
            }
            const indexPath = path.join(path.resolve(dir, p2.slice(0, -3)), 'index.js');
            if (fs.existsSync(indexPath)) {
              return `${p1}${p2.slice(0, -3)}/index.js${p3}`;
            }
            return match;
          }

          const basePath = path.resolve(dir, p2);
          const jsPath = basePath + '.js';
          const indexPath = path.join(basePath, 'index.js');

          if (fs.existsSync(jsPath)) {
            return `${p1}${p2}.js${p3}`;
          } else if (fs.existsSync(indexPath)) {
            return `${p1}${p2}/index.js${p3}`;
          }
          return match;
        }
      );

      if (content !== before) {
        fs.writeFileSync(fullPath, content);
        console.log(`Fixed: ${path.relative(dir, fullPath)}`);
      }
    }
  }
}

const distDir = path.resolve(__dirname, '../dist');
addExtensions(distDir);
console.log('ESM extension fix complete.');
