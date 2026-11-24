// validate.mjs — bounding-box validator for entry.png (fresh build).
// Reads manifest.json (text blocks registered by render.mjs), re-measures every
// line with fontkit + the bundled Inter woff files, and checks:
//  - every block inside the 1024x1024 canvas
//  - every line fits its box width
//  - no two text blocks overlap
//  - story / region counts match the template (30-35 stories, 8-9 regions)
// Exits non-zero on any failure. No OCR: tesseract is not installed on this VM.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const fontkit = require('fontkit');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const m = JSON.parse(fs.readFileSync(path.join(__dirname, 'manifest.json'), 'utf8'));
const fk = {};
for (const w of [400, 700, 800, 900]) {
  fk[w] = fontkit.create(fs.readFileSync(path.join(__dirname, 'fonts', `inter-latin-${w}-normal.woff`)));
}
const widthOf = (text, size, weight) => {
  const f = fk[weight] || fk[400];
  return (f.layout(text).advanceWidth / f.unitsPerEm) * size;
};

const failures = [];
const notes = [];

// counts
if (m.stories < 30 || m.stories > 35) failures.push(`story count ${m.stories} outside 30-35`);
if (m.regions.length < 8 || m.regions.length > 9) failures.push(`region count ${m.regions.length} outside 8-9`);
if (m.leads !== 3) failures.push(`leads ${m.leads} != 3`);
if (m.pictured !== 10) failures.push(`pictured ${m.pictured} != 10`);
if (m.width !== 1024 || m.height !== 1024) failures.push(`size ${m.width}x${m.height} != 1024x1024`);
if (m.bytes > 1048576) failures.push(`bytes ${m.bytes} > 1 MiB`);

// per-block checks
for (const b of m.blocks) {
  if (b.x < 0 || b.y < 0 || b.x + b.w > 1024 || b.y + b.h > 1024) {
    failures.push(`OUT OF BOUNDS ${b.id}: x=${b.x} y=${b.y} w=${b.w} h=${b.h}`);
  }
  for (const line of b.lines) {
    const w = widthOf(line.text, b.size, b.weight);
    if (w > b.w + 1.0) failures.push(`LINE TOO WIDE ${b.id}: "${line.text}" ${w.toFixed(1)}px > ${b.w}px`);
  }
}
// pairwise overlap (text blocks only)
const bs = m.blocks;
for (let i = 0; i < bs.length; i++) {
  for (let j = i + 1; j < bs.length; j++) {
    const a = bs[i];
    const c = bs[j];
    const ox = Math.min(a.x + a.w, c.x + c.w) - Math.max(a.x, c.x);
    const oy = Math.min(a.y + a.h, c.y + c.h) - Math.max(a.y, c.y);
    if (ox > 0.5 && oy > 0.5) {
      failures.push(`OVERLAP ${a.id} x ${c.id}: ${ox.toFixed(1)}x${oy.toFixed(1)}px`);
    }
  }
}

console.log(`blocks checked: ${bs.length}`);
console.log(`stories=${m.stories} (leads ${m.leads}, pictured ${m.pictured}, also-on ${m.alsoOn}) regions=${m.regions.length} [${m.regions.join(', ')}]`);
console.log(`entry.png: ${m.bytes} bytes, sha256 ${m.sha256}`);
if (failures.length) {
  console.log(`FAIL (${failures.length}):`);
  for (const f of failures) console.log(`  - ${f}`);
  process.exit(1);
}
console.log('VALIDATOR: PASS — 0 overlaps, 0 out-of-bounds, all lines fit');
