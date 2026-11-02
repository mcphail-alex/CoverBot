import { buildCoverLetterPdfFilename, extractCompanyName } from './companyName';

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
});

describe('buildCoverLetterPdfFilename', () => {
  it('includes the company name when found', () => {
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
