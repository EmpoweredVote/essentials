import { describe, it, expect } from 'vitest';
import { councilAttributionText, councilLayout } from './councilRecord';

describe('councilAttributionText', () => {
  it('uses the city before the first comma and drops "City of"', () => {
    expect(councilAttributionText('City of Testville, Somestate, US')).toBe(
      "From the clerk's records of the Testville Common Council.",
    );
  });
  it('handles a name with no comma', () => {
    expect(councilAttributionText('City of Testville')).toBe(
      "From the clerk's records of the Testville Common Council.",
    );
  });
  it('falls back when the name is missing or empty', () => {
    for (const v of [undefined, null, '', '  ']) {
      expect(councilAttributionText(v)).toBe("From the clerk's records of the city council.");
    }
  });
});

describe('councilLayout', () => {
  it('waits while loading, even when a total is known', () => {
    expect(councilLayout({ loading: true, total: 5 })).toBe('pending');
    expect(councilLayout({ loading: true, total: 0 })).toBe('pending');
  });
  it('picks the council layout when total > 0 after loading', () => {
    expect(councilLayout({ loading: false, total: 2 })).toBe('council');
  });
  it('picks the usual layout when total is 0 after loading', () => {
    expect(councilLayout({ loading: false, total: 0 })).toBe('legislative');
  });
});
