import {
  buildCoverLetterPdfFilename,
  extractCompanyFromSalutation,
  extractCompanyName,
} from './companyName';

describe('extractCompanyFromSalutation', () => {
  it('extracts company from a standard salutation', () => {
    const letter = `Dear SSL Store Hiring Team,

I am excited to apply.`;

    expect(extractCompanyFromSalutation(letter)).toBe('SSL Store');
  });

  it('extracts company from an engineering team salutation', () => {
    const letter = `Dear Lattice Engineering Team,

Hello.`;

    expect(extractCompanyFromSalutation(letter)).toBe('Lattice');
  });

  it('does not treat URL fragments as company names', () => {
    expect(extractCompanyFromSalutation('Dear www,\n\nBody')).toBeUndefined();
  });
});

describe('extractCompanyName', () => {
  it('extracts company from "role at Company" phrasing', () => {
    const job = `Senior Software Engineer at the SSL Store, powered by DigiCert.
We are looking for...`;
    expect(extractCompanyName(job)).toBe('SSL Store');
  });

  it('extracts company from "Company is hiring" phrasing', () => {
    expect(extractCompanyName('Lattice is hiring a Software Engineer.')).toBe(
      'Lattice',
    );
  });

  it('ignores www from job posts', () => {
    expect(
      extractCompanyName('Apply at www.sslstore.com for this role'),
    ).toBeUndefined();
  });
});

describe('buildCoverLetterPdfFilename', () => {
  it('prefers the salutation over the job description', () => {
    expect(
      buildCoverLetterPdfFilename(
        'Apply at www.sslstore.com',
        'Dear SSL Store Hiring Team,\n\nBody',
      ),
    ).toBe('Cover Letter - SSL Store.pdf');
  });

  it('includes the company name from the job description when salutation is missing', () => {
    expect(
      buildCoverLetterPdfFilename(
        'Senior Software Engineer at the SSL Store, powered by DigiCert.',
      ),
    ).toBe('Cover Letter - SSL Store.pdf');
  });

  it('falls back when company is unknown', () => {
    expect(buildCoverLetterPdfFilename('generic job post')).toBe(
      'Cover Letter.pdf',
    );
  });
});
