import { readFileSync, writeFileSync } from 'fs';
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
if (!pkg.scripts.postinstall) {
  pkg.scripts.postinstall = 'bash scripts/patch-vite-chokidar.sh';
  writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
  console.log('Added postinstall script to package.json');
} else {
  console.log('postinstall already exists:', pkg.scripts.postinstall);
}
