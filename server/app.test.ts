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
    res.locals.coverLetter =
      'Dear Acme Corp Hiring Team,\n\nExcited to apply.\n';
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
      coverLetter: 'Dear Acme Corp Hiring Team,\n\nExcited to apply.\n',
      pdfFilename: 'Cover Letter - Acme Corp.pdf',
    });
  });
});

describe('POST /api/pdf', () => {
  it('should return 400 when cover letter text is missing', async () => {
    const response = await request(app)
      .post('/api/pdf')
      .send({ naturalLanguageQuery: 'Role at Acme' })
      .set('Content-Type', 'application/json');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      err: 'Cover letter text is required to build a PDF',
    });
  });

  it('should return a PDF for cover letter text', async () => {
    const response = await request(app)
      .post('/api/pdf')
      .send({
        coverLetter: 'Dear Acme Corp Hiring Team,\n\nEdited body text.\n',
        naturalLanguageQuery: 'Senior engineer role at Acme Corp',
      })
      .set('Content-Type', 'application/json');

    expect(response.status).toBe(200);
    expect(response.body.pdfFilename).toBe('Cover Letter - Acme Corp.pdf');
    expect(typeof response.body.pdfBase64).toBe('string');
    expect(response.body.pdfBase64.length).toBeGreaterThan(100);
  });
});
