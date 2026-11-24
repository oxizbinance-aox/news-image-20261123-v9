// main.ts — entrypoint for news-image-20261123-v9.
// Stdlib only: copies the pre-rendered entry.png to the output directory,
// verifies it meets the limits (<=1 MiB, <=1024x1024), and re-reads the copy
// to confirm its sha256 matches the source. Deterministic: two runs write
// byte-identical files.
import { copyFileSync, mkdirSync, readFileSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";

const outDir = process.env.MAKEFUN_OUTPUT_DIR || "out";
const src = "entry.png";
const dst = join(outDir, "entry.png");

const buf = readFileSync(src);
if (buf.length > 1048576) {
  throw new Error(`entry.png is ${buf.length} bytes, over the 1 MiB limit`);
}
// PNG header: width/height are big-endian uint32 at offsets 16/20.
const width = buf.readUInt32BE(16);
const height = buf.readUInt32BE(20);
if (width > 1024 || height > 1024) {
  throw new Error(`entry.png is ${width}x${height}, over the 1024x1024 limit`);
}
const sha = createHash("sha256").update(buf).digest("hex");
mkdirSync(outDir, { recursive: true });
copyFileSync(src, dst);
const copied = readFileSync(dst);
const sha2 = createHash("sha256").update(copied).digest("hex");
if (sha2 !== sha) {
  throw new Error(`sha256 mismatch after copy: ${sha2} != ${sha}`);
}
const size = statSync(dst).size;
console.log(`entry.png: ${width}x${height}, ${size} bytes, sha256 ${sha}`);
