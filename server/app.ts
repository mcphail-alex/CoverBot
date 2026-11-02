import express, { ErrorRequestHandler } from 'express';
import cors from 'cors';
import 'dotenv/config';

import { parseNaturalLanguageQuery } from './controllers/naturalLanguageController.js';
import { attachCoverLetterPdf } from './controllers/coverLetterPdfController.js';
import { queryOpenAI } from './controllers/openaiController.js';

import { buildCoverLetterPdfFilename } from './companyName.js';
import { ServerError } from './types';

const app = express();

app.use(cors());
app.use(express.json());

app.post(
  '/api',
  parseNaturalLanguageQuery,
  queryOpenAI,
  attachCoverLetterPdf,
  (req, res) => {
    const jobDescription =
      res.locals.naturalLanguageQuery ?? req.body?.naturalLanguageQuery ?? '';
    res.status(200).json({
      coverLetter: res.locals.coverLetter,
      pdfBase64: res.locals.coverLetterPdfBase64,
      pdfFilename: buildCoverLetterPdfFilename(
        typeof jobDescription === 'string' ? jobDescription : '',
      ),
    });
  }
);

const errorHandler: ErrorRequestHandler = (
  err: ServerError,
  _req,
  res,
  _next
) => {
  const defaultErr: ServerError = {
    log: 'Express error handler caught unknown middleware error',
    status: 500,
    message: { err: 'An error occurred' },
  };
  const errorObj: ServerError = { ...defaultErr, ...err };
  console.log(errorObj.log);
  res.status(errorObj.status).json(errorObj.message);
};

app.use(errorHandler);

export default app;
