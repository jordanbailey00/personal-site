import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../dist/', import.meta.url));
const files = await readdir(root, { recursive: true });
let checked = 0;
const errors = [];
for (const file of files.filter(file => file.endsWith('.html'))) {
  const html = await readFile(path.join(root, file), 'utf8');
  if ((html.match(/<h1\b/g) || []).length !== 1) errors.push(`${file}: needs exactly one h1`);
  if (!html.includes('name="description"')) errors.push(`${file}: missing description`);
  for (const [kind, count] of [['style', 2], ['theme', 6]]) {
    if ((html.match(new RegExp(`data-${kind}-picker`, 'g')) || []).length !== 1 ||
        (html.match(new RegExp(`name="site-${kind}"`, 'g')) || []).length !== count) {
      errors.push(`${file}: missing or duplicate ${kind} choices`);
    }
  }
  if (!html.includes('href="/assets/fantasy.css"')) errors.push(`${file}: missing Fantasy style package`);
  if (!html.includes('href="/assets/callouts.css"')) errors.push(`${file}: missing callout styles`);
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(match => match[1]);
  if (new Set(ids).size !== ids.length) errors.push(`${file}: duplicate IDs`);
  for (const [, fragment] of html.matchAll(/href="#([^"]+)"/g)) {
    if (!ids.includes(decodeURIComponent(fragment))) errors.push(`${file}: missing fragment #${fragment}`);
  }
  if (/Insert screenshot|href="#"|Aeree Cho<\/h1>/.test(html)) errors.push(`${file}: unfinished content`);
  for (const image of html.matchAll(/<img\b[^>]*>/g)) if (!/alt="[^"]+"/.test(image[0])) errors.push(`${file}: image without alt text`);
  for (const match of html.matchAll(/(?:href|src)="(\/[^"#?]*)(?:[?#][^"]*)?"/g)) {
    const target = path.join(root, decodeURIComponent(match[1]));
    try { const info = await stat(target); if (info.isDirectory()) await stat(path.join(target, 'index.html')); checked++; }
    catch { errors.push(`${file}: missing ${match[1]}`); }
  }
}
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log(`Validated ${files.filter(f => f.endsWith('.html')).length} HTML files and ${checked} internal links/assets.`);
