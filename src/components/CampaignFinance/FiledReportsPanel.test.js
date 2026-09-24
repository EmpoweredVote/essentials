/**
 * Unit tests for FiledReportsPanel.jsx — pure-logic only (no jsdom, no React render),
 * following the SectionBanner.test.js pattern.
 *
 * The panel replaces a false "being processed" banner for politicians whose filed report shows no
 * itemized contributions (spec: ev-accounts docs/superpowers/specs/2026-09-24-filed-report-summaries-design.md).
 * A blank line on the sheet arrives as null and must never be shown as $0.
 */

import { describe, it, expect } from 'vitest';
import { formatMoney, formatReportDate, describeReport } from './FiledReportsPanel.jsx';

// Dorothy Granger's CFA-4 pre-primary 2026 as the API returns it: 15c and 17c blank, cash on hand 0.
const GRANGER = {
  form: 'CFA-4',
  report_type: 'pre_primary',
  is_amendment: false,
  period_start: '2026-01-01',
  period_end: '2026-04-10',
  filed_on: '2026-04-15',
  filed_with: 'Monroe Circuit Court Clerk',
  receipts_total: null,
  receipts_ytd: null,
  receipts_itemized: null,
  expenditures_total: null,
  expenditures_ytd: null,
  cash_end: 0,
  debts_owed_by: 0,
};

describe('formatMoney', () => {
  it('shows a blank line as a dash, never $0', () => {
    expect(formatMoney(null)).toBe('—');
    expect(formatMoney(undefined)).toBe('—');
  });

  it('shows a written zero as $0 and rounds to whole dollars with separators', () => {
    expect(formatMoney(0)).toBe('$0');
    expect(formatMoney(3268.4)).toBe('$3,268');
  });
});

describe('formatReportDate', () => {
  // A date column parsed as local midnight shifts a day west of UTC; the panel must read it as UTC.
  it('does not shift a date by a day', () => {
    expect(formatReportDate('2026-01-01')).toBe('Jan 1, 2026');
  });
});

describe('describeReport', () => {
  it('names the report, its period and who it was filed with', () => {
    const d = describeReport(GRANGER);
    expect(d.title).toBe('Pre-Primary report');
    expect(d.period).toBe('Jan 1 – Apr 10, 2026');
    expect(d.filed).toBe('filed Apr 15, 2026 with the Monroe Circuit Court Clerk');
  });

  it('lists raised, spent and cash on hand, keeping blanks as dashes', () => {
    const d = describeReport(GRANGER);
    expect(d.figures).toEqual([
      { label: 'Raised', value: '—' },
      { label: 'Spent', value: '—' },
      { label: 'Cash on hand', value: '$0' },
    ]);
  });

  it('marks an amendment and a period that spans two years', () => {
    const d = describeReport({ ...GRANGER, is_amendment: true, period_start: '2025-12-01' });
    expect(d.title).toBe('Pre-Primary report (amended)');
    expect(d.period).toBe('Dec 1, 2025 – Apr 10, 2026');
  });

  it('says the donor list is missing only when the sheet itemizes receipts', () => {
    expect(describeReport(GRANGER).itemizedNote).toBeNull();
    expect(describeReport({ ...GRANGER, receipts_itemized: 500 }).itemizedNote).toBe('Itemized donor list not yet available.');
  });

  it('omits "filed" when the stamp date is missing', () => {
    expect(describeReport({ ...GRANGER, filed_on: null }).filed).toBe('filed with the Monroe Circuit Court Clerk');
  });
});
