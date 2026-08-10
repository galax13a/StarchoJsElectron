import { readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const ignored = new Set(['node_modules', 'dist', '.git', '.claude']);

function collect(dir) {
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (ignored.has(entry.name)) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...collect(full));
    else if (entry.isFile() && full.endsWith('.js')) files.push(full);
  }
  return files;
}

const files = collect(root).sort();
const failures = [];
for (const file of files) {
  const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  if (result.status !== 0) failures.push({ file: relative(root, file), output: `${result.stdout || ''}${result.stderr || ''}`.trim() });
}

if (failures.length) {
  console.error(`JavaScript syntax check failed for ${failures.length} file(s):`);
  for (const failure of failures) console.error(`\n${failure.file}\n${failure.output}`);
  process.exit(1);
}

console.log(`JavaScript syntax check passed for ${files.length} file(s).`);
