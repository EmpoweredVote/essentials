import { describe, it, expect } from 'vitest';
import { financeSourceName, verifiedFilingText, sourceReportsDonorType } from './financeSource';

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

describe('verifiedFilingText', () => {
  it('names the known source', () => {
    expect(verifiedFilingText('fec')).toBe('Verified filing: FEC');
    expect(verifiedFilingText('la_socrata')).toBe('Verified filing: LA City Ethics Commission');
  });

  it('names no source when it is unknown or not given', () => {
    expect(verifiedFilingText(undefined)).toBe('Verified filing');
    expect(verifiedFilingText('some_new_source')).toBe('Verified filing');
  });
});

describe('sourceReportsDonorType', () => {
  it('is false only for the sources that file no donor type', () => {
    expect(sourceReportsDonorType('la_socrata')).toBe(false);
    expect(sourceReportsDonorType('la_county_netfile')).toBe(false);
    for (const s of ['fec', 'cal_access', 'indiana', 'ocpf', 'in_monroe_county_local', '', undefined]) {
      expect(sourceReportsDonorType(s)).toBe(true);
    }
  });
});
