import {
  STANDARD_SIGN_OFF,
  ensureFullSignOff,
  stripSignOff,
} from './signOff';

describe('ensureFullSignOff', () => {
  it('appends the full signature block when missing', () => {
    expect(ensureFullSignOff('Dear Team,\n\nBody text.')).toBe(
      `Dear Team,\n\nBody text.\n\n${STANDARD_SIGN_OFF}`,
    );
  });

  it('replaces a partial sign-off with the full block', () => {
    expect(
      ensureFullSignOff(`Dear Team,\n\nBody.\n\nAll Best,\nAlex McPhail`),
    ).toBe(`Dear Team,\n\nBody.\n\n${STANDARD_SIGN_OFF}`);
  });

  it('replaces an incomplete sign-off missing phone and email', () => {
    const input = `Dear Team,\n\nBody.\n\nAll Best,\nAlex McPhail\n281-731-9656`;
    expect(ensureFullSignOff(input)).toBe(
      `Dear Team,\n\nBody.\n\n${STANDARD_SIGN_OFF}`,
    );
  });
});

describe('stripSignOff', () => {
  it('handles All Best without comma', () => {
    expect(stripSignOff('Dear Team,\n\nAll Best\nAlex')).toBe('Dear Team,');
  });
});
