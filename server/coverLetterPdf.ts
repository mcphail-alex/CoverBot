import fs from 'fs';
import path from 'path';
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib';
import {
  SIGN_OFF_TOP_BASELINE_Y,
  STANDARD_SIGN_OFF_LINES,
  stripSignOff,
} from './signOff.js';

/** US Letter (612×792), layout from letterhead.pdf text positions */
const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;

/** Body flows in the right column beside the fixed left letterhead block */
const BODY_LEFT = 184;
/** Slightly wider wrap — matches long lines in the reference letter */
const BODY_WIDTH = 388;
/** Start below the header rule (pushed down from the old 722 anchor) */
const BODY_TOP_BASELINE = 688;
/** One blank line above the sign-off block */
const BODY_MIN_BASELINE_Y = SIGN_OFF_TOP_BASELINE_Y + 16;
/** Wipe sample text; keep signature artwork below the contact block */
const WIPE_AREA_BOTTOM_Y = 218;

const FONT_SIZE = 10;
const LINE_HEIGHT = 13;
const PARAGRAPH_EXTRA = 14;

const defaultLetterheadPath = path.join(
  process.cwd(),
  'server/assets/letterhead.pdf',
);

const defaultSignaturePath = path.join(
  process.cwd(),
  'server/assets/signature.png',
);

export function getLetterheadPath(): string {
  const configured = process.env.LETTERHEAD_PATH?.trim();
  if (!configured) {
    return defaultLetterheadPath;
  }
  return path.isAbsolute(configured)
    ? configured
    : path.join(process.cwd(), configured);
}

function getSignatureImagePath(): string {
  const configured = process.env.SIGNATURE_IMAGE_PATH?.trim();
  if (!configured) {
    return defaultSignaturePath;
  }
  return path.isAbsolute(configured)
    ? configured
    : path.join(process.cwd(), configured);
}

export function plainTextCoverLetter(raw: string): string {
  return raw
    .replace(/\r\n/g, '\n')
    .replace(/^```(?:markdown|md)?\n?/i, '')
    .replace(/\n?```$/i, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/^#+\s+/gm, '')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\u00BD/g, '1/2')
    .trim();
}

/** Letter body only — sign-off is stamped at fixed coordinates on the PDF */
export function letterBodyForPdf(plain: string): string {
  return stripSignOff(plain);
}

function wrapParagraph(
  paragraph: string,
  font: PDFFont,
  fontSize: number,
  maxWidth: number,
): string[] {
  const words = paragraph.split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return [];
  }

  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    const width = font.widthOfTextAtSize(candidate, fontSize);
    if (width <= maxWidth) {
      current = candidate;
    } else {
      if (current) {
        lines.push(current);
      }
      current = word;
    }
  }

  if (current) {
    lines.push(current);
  }

  return lines;
}

function layoutLines(text: string, font: PDFFont): string[] {
  const lines: string[] = [];
  const blocks = text.split('\n');

  for (const block of blocks) {
    if (block.trim() === '') {
      lines.push('');
      continue;
    }
    lines.push(...wrapParagraph(block, font, FONT_SIZE, BODY_WIDTH));
  }

  return lines;
}

function drawBodyText(page: PDFPage, font: PDFFont, lines: string[]): void {
  let y = BODY_TOP_BASELINE;

  for (const line of lines) {
    if (y < BODY_MIN_BASELINE_Y) {
      break;
    }

    if (line === '') {
      y -= LINE_HEIGHT + PARAGRAPH_EXTRA;
      continue;
    }

    page.drawText(line, {
      x: BODY_LEFT,
      y,
      size: FONT_SIZE,
      font,
      color: rgb(0, 0, 0),
    });
    y -= LINE_HEIGHT;
  }
}

function drawSignOffBlock(page: PDFPage, font: PDFFont): void {
  for (const line of STANDARD_SIGN_OFF_LINES) {
    page.drawText(line.text, {
      x: BODY_LEFT,
      y: line.y,
      size: FONT_SIZE,
      font,
      color: rgb(0, 0, 0),
    });
  }
}

function clearSampleBodyColumn(page: PDFPage): void {
  page.drawRectangle({
    x: BODY_LEFT - 8,
    y: WIPE_AREA_BOTTOM_Y,
    width: PAGE_WIDTH - BODY_LEFT - 50,
    height: BODY_TOP_BASELINE - WIPE_AREA_BOTTOM_Y + 24,
    color: rgb(1, 1, 1),
  });
}

/** Handwritten signature stamp (optional PNG extracted from letterhead) */
const SIGNATURE_STAMP = {
  x: 185.25,
  y: 54,
  width: 313.5,
  height: 200,
} as const;

async function drawSignatureStamp(
  page: PDFPage,
  pdfDoc: PDFDocument,
): Promise<void> {
  const signaturePath = getSignatureImagePath();
  if (!fs.existsSync(signaturePath)) {
    return;
  }

  const pngBytes = fs.readFileSync(signaturePath);
  if (pngBytes.length < 500) {
    return;
  }

  const image = await pdfDoc.embedPng(pngBytes);
  page.drawImage(image, {
    x: SIGNATURE_STAMP.x,
    y: SIGNATURE_STAMP.y,
    width: SIGNATURE_STAMP.width,
    height: SIGNATURE_STAMP.height,
  });
}

export async function buildCoverLetterPdf(coverLetterText: string): Promise<Uint8Array> {
  const letterheadPath = getLetterheadPath();
  const templateBytes = fs.readFileSync(letterheadPath);
  const pdfDoc = await PDFDocument.load(templateBytes);
  const page = pdfDoc.getPages()[0];
  const { width, height } = page.getSize();

  if (width !== PAGE_WIDTH || height !== PAGE_HEIGHT) {
    throw new Error(
      `Letterhead must be US Letter (${PAGE_WIDTH}×${PAGE_HEIGHT} pt), got ${width}×${height}`,
    );
  }

  clearSampleBodyColumn(page);

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const plain = plainTextCoverLetter(coverLetterText);
  const body = letterBodyForPdf(plain);
  const lines = layoutLines(body, font);
  drawBodyText(page, font, lines);
  drawSignOffBlock(page, font);
  await drawSignatureStamp(page, pdfDoc);

  return pdfDoc.save();
}
