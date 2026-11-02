const INVALID_FILENAME_CHARS = /[\\/:*?"<>|]/g;

const SALUTATION_SUFFIXES = [
  ' hiring committee',
  ' hiring team',
  ' engineering team',
  ' recruiting team',
  ' recruitment team',
  ' team',
];

function cleanCompanyName(raw: string): string {
  return raw
    .replace(/\s+/g, ' ')
    .replace(INVALID_FILENAME_CHARS, '')
    .trim();
}

function isPlausibleCompanyName(name: string): boolean {
  if (name.length < 2 || name.length > 50) {
    return false;
  }
  if (/^www\.?/i.test(name) || /^https?:/i.test(name)) {
    return false;
  }
  if (/\.(com|org|net|io|co)\b/i.test(name)) {
    return false;
  }
  if (!/[A-Za-z]/.test(name)) {
    return false;
  }
  return true;
}

function normalizeSalutationAudience(audience: string): string | undefined {
  let name = cleanCompanyName(audience.replace(/^the\s+/i, ''));

  for (const suffix of SALUTATION_SUFFIXES) {
    if (name.toLowerCase().endsWith(suffix)) {
      name = name.slice(0, -suffix.length).trim();
      break;
    }
  }

  name = cleanCompanyName(name);
  return isPlausibleCompanyName(name) ? name : undefined;
}

/**
 * Company name from the model salutation, e.g. "Dear SSL Store Hiring Team,".
 */
export function extractCompanyFromSalutation(coverLetter: string): string | undefined {
  const text = coverLetter.replace(/\r\n/g, '\n').trim();
  if (!text) {
    return undefined;
  }

  const patterns = [
    /^Dear\s+(.+?)\s*,\s*(?:\n|$)/im,
    /^Dear\s+(.+?)\s*,/im,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    const audience = match?.[1]?.trim();
    if (!audience) {
      continue;
    }
    const company = normalizeSalutationAudience(audience);
    if (company) {
      return company;
    }
  }

  return undefined;
}

/**
 * Fallback: best-effort company name from a pasted job description.
 */
export function extractCompanyName(jobDescription: string): string | undefined {
  const text = jobDescription.replace(/\r\n/g, '\n').trim();
  if (!text) {
    return undefined;
  }

  const patterns = [
    /\bat\s+(?:the\s+)?([A-Z][A-Za-z0-9&.'\- ]{1,48}?)(?=\s*(?:,|\.|!|\n| powered by| -|$))/i,
    /(?:join|about)\s+(?:the\s+)?([A-Z][A-Za-z0-9&.'\- ]{1,48}?)(?=\s*(?:,|\.|!|\n| team| as | -|$))/i,
    /(?:^|\n)([A-Z][A-Za-z0-9&.'\- ]{2,48}?)\s+is\s+(?:hiring|looking|seeking)/im,
    /(?:position|role|opportunity)\s+(?:at|with)\s+(?:the\s+)?([A-Z][A-Za-z0-9&.'\- ]{1,48}?)(?=\s*(?:,|\.|!|\n| -|$))/i,
    /(?:^|\n)([A-Z][A-Za-z0-9&.'\- ]{2,48}?)\s*\|\s*[A-Za-z]/m,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    const candidate = match?.[1] ? cleanCompanyName(match[1]) : '';
    if (isPlausibleCompanyName(candidate)) {
      return candidate;
    }
  }

  return undefined;
}

export function buildCoverLetterPdfFilename(
  jobDescription: string,
  coverLetter?: string,
): string {
  const fromSalutation =
    coverLetter !== undefined
      ? extractCompanyFromSalutation(coverLetter)
      : undefined;
  const company =
    fromSalutation ?? extractCompanyName(jobDescription ?? '');

  if (!company) {
    return 'Cover Letter.pdf';
  }
  return `Cover Letter - ${company}.pdf`;
}
