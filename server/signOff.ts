/** Canonical closing block — always applied on the server */
export const STANDARD_SIGN_OFF = `All Best,
Alex McPhail
281-731-9656
mcphail.alex@gmail.com`;

/** Right-column baselines (PDF pts, origin bottom-left) — sits above signature artwork */
export const STANDARD_SIGN_OFF_LINES = [
  { y: 268, text: 'All Best,' },
  { y: 255, text: 'Alex McPhail' },
  { y: 242, text: '281-731-9656' },
  { y: 229, text: 'mcphail.alex@gmail.com' },
] as const;

/** First baseline allowed for the closing line (gap above "All Best,") */
export const SIGN_OFF_TOP_BASELINE_Y = 268;

const SIGN_OFF_START = /\n\s*All Best,?\s*\n/i;

/** Remove any model-generated sign-off so we can append the canonical block once */
export function stripSignOff(letter: string): string {
  const match = letter.match(SIGN_OFF_START);
  if (!match || match.index === undefined) {
    return letter.trimEnd();
  }
  return letter.slice(0, match.index).trimEnd();
}

/** Guarantee the full four-line signature block on every cover letter */
export function ensureFullSignOff(letter: string): string {
  const body = stripSignOff(letter);
  if (!body) {
    return STANDARD_SIGN_OFF;
  }
  return `${body}\n\n${STANDARD_SIGN_OFF}`;
}
