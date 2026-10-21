import { describe, it, expect } from 'vitest';
import { matchingFundsSummary } from './financeMatchingFunds';

describe('matchingFundsSummary', () => {
  it('labels public matching funds in whole dollars', () => {
    const s = matchingFundsSummary({ public_matching_funds: { total_amount: 902686.32, payment_count: 3 } });
    expect(s.amount).toBe(902686.32);
    expect(s.label).toBe('$902,686 in public matching funds');
  });

  it('renders nothing when the field is absent (older API) or zero', () => {
    expect(matchingFundsSummary({ total_raised: 1000 })).toEqual({ amount: 0, label: '' });
    expect(matchingFundsSummary({ public_matching_funds: { total_amount: 0 } }).label).toBe('');
    expect(matchingFundsSummary(null).label).toBe('');
  });
});
