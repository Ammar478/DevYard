import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

function copyDir(srcDir: string, destDir: string): void {
  const files = readdirSync(srcDir);
  for (const file of files) {
    const src = join(srcDir, file);
    const dest = join(destDir, file);
    const srcContent = readFileSync(src);
    let skip = false;
    try {
      const destContent = readFileSync(dest);
      if (srcContent.equals(destContent)) {
        skip = true;
      }
    } catch {
      skip = false;
    }
    if (skip) {
      console.log('  skipped:', file);
    } else {
      writeFileSync(dest, srcContent);
      console.log('  copied:', file);
    }
  }
}

export function copyTemplates(vaultPath: string, assetsDir: string): void {
  copyDir(join(assetsDir, 'schemas'), join(vaultPath, '_System', 'schemas'));
  copyDir(join(assetsDir, 'templates'), join(vaultPath, '_System', 'templates'));
}
