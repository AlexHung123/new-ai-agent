const { cpSync, existsSync, mkdirSync } = require('node:fs');
const { join } = require('node:path');

const src = join(__dirname, '..', 'node_modules', 'tinymce');
const dest = join(__dirname, '..', 'public', 'tinymce');

if (!existsSync(src)) {
  console.warn('tinymce is not installed; skip public/tinymce copy');
  process.exit(0);
}

mkdirSync(dest, { recursive: true });
cpSync(src, dest, { recursive: true });
console.log('Copied tinymce to public/tinymce');
