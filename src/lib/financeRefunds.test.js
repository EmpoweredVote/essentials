import { describe, it, expect } from 'vitest';
import { refundSummary, formatRefundAmount } from './financeRefunds';

describe('refundSummary', () => {
  it('a refunds-only cycle (Newsom 2024 shape) reads as no new contributions, with the refund named', () => {
    const r = refundSummary({ total_raised: 0, total_refunded: 338.76, refund_count: 2 });
    expect(r.onlyRefunds).toBe(true);
    expect(r.refunded).toBe(338.76);
    expect(r.label).toBe('$338.76 returned to donors (2 contributions)');
  });

  it('a mixed cycle keeps raised as the headline and adds the refund line', () => {
    const r = refundSummary({ total_raised: 17327941.18, total_refunded: 110077, refund_count: 91 });
    expect(r.onlyRefunds).toBe(false);
    expect(r.label).toBe('$110,077 returned to donors (91 contributions)');
  });

  it('one refund is singular', () => {
    expect(refundSummary({ total_raised: 50, total_refunded: 20, refund_count: 1 }).label)
      .toBe('$20.00 returned to donors (1 contribution)');
  });

  it('no refunds, or an API that predates the fields, renders nothing new', () => {
    for (const s of [{ total_raised: 100, total_refunded: 0, refund_count: 0 }, { total_raised: 100 }, null]) {
      const r = refundSummary(s);
      expect(r.refunded).toBe(0);
      expect(r.onlyRefunds).toBe(false);
      expect(r.label).toBe('');
    }
  });

  it('a $0 cycle with no refunds is not called a refunds-only cycle', () => {
    expect(refundSummary({ total_raised: 0, total_refunded: 0 }).onlyRefunds).toBe(false);
  });
});

describe('formatRefundAmount', () => {
  it('shows cents under $1,000 and whole dollars above', () => {
    expect(formatRefundAmount(104.4)).toBe('$104.40');
    expect(formatRefundAmount(1234.56)).toBe('$1,235');
  });
});
