// scripts/copy-preload.js
import fs from 'fs';
import path from 'path';

const src = path.join('dist', 'preload', 'preload.mjs');
const dest = path.join('dist', 'main', 'preload.mjs');

fs.mkdirSync(path.dirname(dest), { recursive: true }); // assure que le dossier existe
fs.copyFileSync(src, dest);

console.log(`Copied preload.mjs to ${dest}`);
