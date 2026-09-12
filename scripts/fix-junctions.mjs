import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const pnpmDir = 'node_modules/.pnpm';
if (!fs.existsSync(pnpmDir)) process.exit(0);

let fixed = 0;

function checkAndFix(dir, name) {
  const full = path.join(dir, name);
  let stat;
  try {
    stat = fs.lstatSync(full);
  } catch (e) { return; }

  if (stat.isSymbolicLink()) return;

  if (stat.isDirectory() && name.startsWith('@')) {
    // Scoped package folder
    let subEntries;
    try {
      subEntries = fs.readdirSync(full);
    } catch (e) { return; }
    for (const sub of subEntries) {
      checkAndFix(full, sub);
    }
    return;
  }

  if (stat.isFile()) {
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
        const targetPath = path.resolve(dir, str);
        fs.unlinkSync(full);
        if (fs.existsSync(targetPath)) {
          const targetStat = fs.statSync(targetPath);
          if (targetStat.isDirectory()) {
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

// 1. Check all packages in node_modules/.pnpm/*/node_modules
const pkgs = fs.readdirSync(pnpmDir);
for (const pkg of pkgs) {
  const innerNodeModules = path.join(pnpmDir, pkg, 'node_modules');
  if (!fs.existsSync(innerNodeModules)) continue;

  let entries;
  try {
    entries = fs.readdirSync(innerNodeModules);
  } catch (e) { continue; }

  for (const entry of entries) {
    checkAndFix(innerNodeModules, entry);
  }
}

// 2. Check node_modules/.pnpm/node_modules
const pnpmNodeModules = path.join(pnpmDir, 'node_modules');
if (fs.existsSync(pnpmNodeModules)) {
  const entries = fs.readdirSync(pnpmNodeModules);
  for (const entry of entries) {
    checkAndFix(pnpmNodeModules, entry);
  }
}

// 3. Also check top-level node_modules
const topEntries = fs.readdirSync('node_modules');
for (const entry of topEntries) {
  checkAndFix('node_modules', entry);
}

console.log('Fixed IntxLNK symlinks total:', fixed);
