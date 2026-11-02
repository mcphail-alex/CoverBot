/**
 * Builds server/assets/signature.png from the letterhead (handwritten ink only).
 * Requires macOS Quick Look: qlmanage
 *
 * Run: npm run extract-signature
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const letterheadPath =
  process.argv[2] ?? path.join(root, 'server/assets/letterhead.pdf');
const tmpDir = path.join(root, 'server/data');
const tmpPng = path.join(tmpDir, 'letterhead-thumbnail.png');
const outPath = path.join(root, 'server/assets/signature.png');

fs.mkdirSync(tmpDir, { recursive: true });
execSync(
  `qlmanage -t -s 2048 -o "${tmpDir}" "${letterheadPath}"`,
  { stdio: 'inherit' },
);

const generated = path.join(tmpDir, `${path.basename(letterheadPath)}.png`);
if (!fs.existsSync(generated)) {
  throw new Error(`Thumbnail not created at ${generated}`);
}

const meta = await sharp(generated).metadata();
const scale = meta.width / 612;
const cropLeft = Math.round(175 * scale);
const cropWidth = Math.round(345 * scale);
const cropHeight = Math.round(200 * scale);
const cropTop = meta.height - cropHeight;

await sharp(generated)
  .extract({ left: cropLeft, top: cropTop, width: cropWidth, height: cropHeight })
  .png()
  .toFile(outPath);

console.log('Wrote', outPath);
