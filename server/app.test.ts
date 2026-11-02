import app from './app';
import request from 'supertest';

jest.mock('./controllers/naturalLanguageController', () => ({
  parseNaturalLanguageQuery: jest.fn((req, res, next) => {
    res.locals.naturalLanguageQuery = req.body.naturalLanguageQuery;
    next();
  }),
}));

jest.mock('./controllers/openaiController', () => ({
  queryOpenAI: jest.fn((_req, res, next) => {
    res.locals.coverLetter = 'Dear Hiring Manager,\n\nExcited to apply.\n';
    next();
  }),
}));

jest.mock('./controllers/coverLetterPdfController', () => ({
  attachCoverLetterPdf: jest.fn((_req, res, next) => {
    res.locals.coverLetterPdfBase64 = 'cGRm';
    next();
  }),
}));

describe('POST /api', () => {
  it('should return 200 and the generated cover letter', async () => {
    const response = await request(app)
      .post('/api')
      .send({
        naturalLanguageQuery: 'Senior engineer role at Acme Corp',
      })
      .set('Content-Type', 'application/json');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      coverLetter: 'Dear Hiring Manager,\n\nExcited to apply.\n',
      pdfBase64: 'cGRm',
      pdfFilename: 'Cover Letter - Acme Corp.pdf',
    });
  });
});
