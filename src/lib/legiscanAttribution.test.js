import { describe, it, expect } from 'vitest';
import { hasLegiScanData, latestLegiScanVoteDate } from './legiscanAttribution';

const ls = 'https://legiscan.com/CA/bill/AB1/2023';

describe('hasLegiScanData', () => {
  it('detects LegiScan bill urls and vote bill_urls', () => {
    expect(hasLegiScanData([{ url: ls }])).toBe(true);
    expect(hasLegiScanData([], [{ bill_url: ls }])).toBe(true);
  });
  it('ignores other sources, empty and bad input', () => {
    expect(hasLegiScanData([{ url: 'https://congress.gov/bill/1' }])).toBe(false);
    expect(hasLegiScanData([{ url: 'https://example.com/legiscan.com/x' }])).toBe(false);
    expect(hasLegiScanData(null, undefined, [], [{}])).toBe(false);
  });
});

describe('latestLegiScanVoteDate', () => {
  it('returns the newest LegiScan vote date only', () => {
    const votes = [
      { bill_url: ls, vote_date: '2026-02-26T00:00:00+00:00' },
      { bill_url: ls, vote_date: '2025-05-01T00:00:00+00:00' },
      { bill_url: 'https://congress.gov/x', vote_date: '2026-09-01T00:00:00+00:00' },
    ];
    expect(latestLegiScanVoteDate(votes)).toBe('2026-02-26T00:00:00+00:00');
  });
  it('returns null with no LegiScan votes', () => {
    expect(latestLegiScanVoteDate([])).toBeNull();
    expect(latestLegiScanVoteDate(null)).toBeNull();
  });
});
