import fs from 'fs';
import path from 'path';
import {
  buildCoverLetterPdf,
  letterBodyForPdf,
  plainTextCoverLetter,
} from './coverLetterPdf';
import { STANDARD_SIGN_OFF } from './signOff';

describe('plainTextCoverLetter', () => {
  it('strips markdown wrappers', () => {
    expect(plainTextCoverLetter('**Dear Team,**\n\nHello.')).toBe(
      'Dear Team,\n\nHello.',
    );
  });
});

describe('letterBodyForPdf', () => {
  it('removes the sign-off block for PDF body layout', () => {
    const letter = `Dear Team,

Body paragraph.

${STANDARD_SIGN_OFF}`;

    expect(letterBodyForPdf(letter)).toBe(`Dear Team,

Body paragraph.`);
  });
});

describe('buildCoverLetterPdf', () => {
  it('returns a single-page PDF using the letterhead template', async () => {
    const sample = `Dear Example Co Team,

I am excited to apply for this role.

All Best,
Alex McPhail
281-731-9656
mcphail.alex@gmail.com`;

    const bytes = await buildCoverLetterPdf(sample);
    expect(bytes[0]).toBe(0x25);
    expect(bytes[1]).toBe(0x50);
    expect(bytes[2]).toBe(0x44);
    expect(bytes[3]).toBe(0x46);

    const outPath = path.join(process.cwd(), 'server/data/test-output.pdf');
    fs.writeFileSync(outPath, bytes);
    fs.unlinkSync(outPath);
  });
});
