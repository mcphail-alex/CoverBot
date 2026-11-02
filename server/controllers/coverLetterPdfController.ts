import { RequestHandler } from 'express';
import { buildCoverLetterPdf } from '../coverLetterPdf.js';
import { ServerError } from '../types';

export const attachCoverLetterPdf: RequestHandler = async (_req, res, next) => {
  const { coverLetter } = res.locals;
  if (!coverLetter) {
    const error: ServerError = {
      log: 'PDF middleware did not receive cover letter text',
      status: 500,
      message: { err: 'An error occurred while building the cover letter PDF' },
    };
    return next(error);
  }

  try {
    const pdfBytes = await buildCoverLetterPdf(coverLetter);
    res.locals.coverLetterPdfBase64 = Buffer.from(pdfBytes).toString('base64');
    return next();
  } catch (err) {
    const error: ServerError = {
      log: `Cover letter PDF failed: ${(err as Error).message}`,
      status: 500,
      message: { err: 'An error occurred while building the cover letter PDF' },
    };
    return next(error);
  }
};
