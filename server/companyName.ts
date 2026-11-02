const INVALID_FILENAME_CHARS = /[\\/:*?"<>|]/g;

function cleanCompanyName(raw: string): string {
  return raw
    .replace(/\s+/g, ' ')
    .replace(INVALID_FILENAME_CHARS, '')
    .trim();
}

/**
 * Best-effort company name from a pasted job description (for download filenames).
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
    if (candidate.length >= 2 && candidate.length <= 50) {
      return candidate;
    }
  }

  return undefined;
}

export function buildCoverLetterPdfFilename(jobDescription: string): string {
  const company = extractCompanyName(jobDescription);
  if (!company) {
    return 'Cover Letter.pdf';
  }
  return `Cover Letter - ${company}.pdf`;
}
