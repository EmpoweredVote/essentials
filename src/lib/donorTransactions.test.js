import { describe, it, expect } from 'vitest';
import {
  DONOR_PAGE_SIZE,
  donorContributionsQuery,
  isDonorFiltered,
  legacyDonorTransactions,
} from './donorTransactions';

describe('donorContributionsQuery', () => {
  it('encodes the exact donor name, the cycle and the page size', () => {
    const qs = new URLSearchParams(donorContributionsQuery('2026', 'A.B. DATA, LTD'));
    expect(qs.get('donor')).toBe('A.B. DATA, LTD');
    expect(qs.get('cycle')).toBe('2026');
    expect(qs.get('limit')).toBe(String(DONOR_PAGE_SIZE));
    expect(qs.has('cursor')).toBe(false);
  });

  it('adds the cursor for the next page', () => {
    const qs = new URLSearchParams(donorContributionsQuery('2026', 'Victor Syng', 'abc=='));
    expect(qs.get('cursor')).toBe('abc==');
  });
});

describe('isDonorFiltered', () => {
  it('is true only when the API echoes the same donor', () => {
    expect(isDonorFiltered({ results: [], filter: { donor: 'Victor Syng' } }, 'Victor Syng')).toBe(true);
    expect(isDonorFiltered({ results: [], filter: { donor: 'Someone Else' } }, 'Victor Syng')).toBe(false);
  });

  it('is false for an API that ignores ?donor= (no echo)', () => {
    expect(isDonorFiltered({ results: [{ donor_name: 'x' }], page_info: {} }, 'Victor Syng')).toBe(false);
    expect(isDonorFiltered(null, 'Victor Syng')).toBe(false);
  });
});

describe('legacyDonorTransactions', () => {
  it('filters the shared list by name, as before', () => {
    const contributions = { results: [{ donor_name: 'a', amount: 1 }, { donor_name: 'b', amount: 2 }] };
    expect(legacyDonorTransactions(contributions, 'b')).toEqual([{ donor_name: 'b', amount: 2 }]);
    expect(legacyDonorTransactions(null, 'b')).toEqual([]);
  });
});
