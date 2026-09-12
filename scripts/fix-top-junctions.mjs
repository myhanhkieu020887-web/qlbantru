import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const topDir = 'node_modules';
const entries = fs.readdirSync(topDir, { withFileTypes: true });
let fixed = 0;

for (const entry of entries) {
  if (entry.isSymbolicLink()) continue;
  const full = path.join(topDir, entry.name);
  if (entry.isFile()) {
    try {
      const buf = fs.readFileSync(full);
      if (buf.length >= 7 && buf.toString('utf8', 0, 7) === 'IntxLNK') {
        let str = '';
        for (let i = 7; i < buf.length; i++) {
          if (buf[i] !== 0 && buf[i] >= 32 && buf[i] < 127) {
            str += String.fromCharCode(buf[i]);
          }
        }
        str = str.trim();
        const targetPath = path.resolve(topDir, str);
        fs.unlinkSync(full);
        if (fs.existsSync(targetPath)) {
          const stat = fs.statSync(targetPath);
          if (stat.isDirectory()) {
            execSync('cmd /c mklink /J ' + full + ' ' + targetPath + '', { stdio: 'ignore' });
            fixed++;
          } else {
            fs.copyFileSync(targetPath, full);
            fixed++;
          }
        }
      }
    } catch (e) {}
  }
}

console.log('Fixed IntxLNK symlinks in top node_modules:', fixed);
