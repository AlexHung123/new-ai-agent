const { spawnSync } = require('node:child_process');
const { existsSync } = require('node:fs');
const { join } = require('node:path');

if (process.env.FILE_VIEWER_SKIP_ASSET_COPY === '1') {
  process.exit(0);
}

const root = join(__dirname, '..');
const bin = join(root, 'node_modules', '.bin', 'file-viewer-copy-assets');
const dest = join(root, 'public', 'file-viewer');
const renderers = [
  'pdf',
  'office-word-openxml',
  'office-presentation-binary',
  'office-presentation',
  'spreadsheet-openxml',
].join(',');

if (!existsSync(bin)) {
  console.warn(
    'file-viewer-copy-assets is not installed; skip public/file-viewer copy',
  );
  process.exit(0);
}

const result = spawnSync(bin, [dest, '--renderers', renderers], {
  stdio: 'inherit',
  cwd: root,
  shell: process.platform === 'win32',
});
if (result.status !== 0) {
  process.exit(result.status || 1);
}
console.log('Copied file-viewer assets to public/file-viewer');
