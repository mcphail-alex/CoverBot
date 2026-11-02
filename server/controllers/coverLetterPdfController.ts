import { RequestHandler } from 'express';
import { buildCoverLetterPdfFilename } from '../companyName.js';
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

export const renderCoverLetterPdf: RequestHandler = async (req, res, next) => {
  const { coverLetter, naturalLanguageQuery } = req.body ?? {};

  if (typeof coverLetter !== 'string' || !coverLetter.trim()) {
    const error: ServerError = {
      log: 'PDF render request missing cover letter text',
      status: 400,
      message: { err: 'Cover letter text is required to build a PDF' },
    };
    return next(error);
  }

  try {
    const pdfBytes = await buildCoverLetterPdf(coverLetter);
    const jobDescription =
      typeof naturalLanguageQuery === 'string' ? naturalLanguageQuery : '';

    res.status(200).json({
      pdfBase64: Buffer.from(pdfBytes).toString('base64'),
      pdfFilename: buildCoverLetterPdfFilename(jobDescription, coverLetter),
    });
  } catch (err) {
    const error: ServerError = {
      log: `Cover letter PDF failed: ${(err as Error).message}`,
      status: 500,
      message: { err: 'An error occurred while building the cover letter PDF' },
    };
    return next(error);
  }
};
