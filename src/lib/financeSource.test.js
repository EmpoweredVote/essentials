import { describe, it, expect } from 'vitest';
import { financeSourceName } from './financeSource';

describe('financeSourceName', () => {
  it.each([
    ['fec', 'FEC'],
    ['la_socrata', 'LA City Ethics Commission'],
    ['la_county_netfile', 'local filings via NetFile'],
    ['cal_access', 'California Secretary of State (Cal-Access)'],
    ['indiana', 'Indiana Election Division'],
    ['in_monroe_county_local', 'Monroe County, Indiana filings'],
    ['IN_MONROE_COUNTY_LOCAL', 'Monroe County, Indiana filings'],
    ['ocpf', 'Massachusetts OCPF'],
  ])('%s → %s', (source, name) => {
    expect(financeSourceName(source)).toBe(name);
  });

  it('names no source rather than a wrong one', () => {
    expect(financeSourceName('')).toBe('');
    expect(financeSourceName(undefined)).toBe('');
    expect(financeSourceName('some_new_source')).toBe('');
  });
});
