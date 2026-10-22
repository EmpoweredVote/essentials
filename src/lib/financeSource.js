// Where a campaign-finance summary's numbers come from, for the "Data from …" footer.
//
// The API's `data_source` is the source that holds most of the cycle's rows (ev-accounts getSummary). Each value
// is named for the agency that publishes the filings. An unknown or missing value returns '', so the footer
// names no source rather than a wrong one.

const SOURCE_NAMES = {
  fec: 'FEC',
  la_socrata: 'LA City Ethics Commission',
  la_county_netfile: 'local filings via NetFile',
  cal_access: 'California Secretary of State (Cal-Access)',
  indiana: 'Indiana Election Division',
  in_monroe_county_local: 'Monroe County, Indiana filings',
  ocpf: 'Massachusetts OCPF',
};

/** financeSourceName('la_socrata') → 'LA City Ethics Commission'; '' when the source is unknown. */
export function financeSourceName(dataSource) {
  return SOURCE_NAMES[String(dataSource ?? '').toLowerCase()] ?? '';
}

// Sources whose filings do not say whether a donor is a person or a committee. The API's individual/PAC split
// is always 0 / 0 for them, which would read as "no individual money", so the panel says the source does not
// report it instead. (cal_access, indiana, ocpf and the FEC all report a donor type.)
const NO_DONOR_TYPE = new Set(['la_socrata', 'la_county_netfile']);

/** sourceReportsDonorType('la_socrata') → false; true for every other source, including unknown ones. */
export function sourceReportsDonorType(dataSource) {
  return !NO_DONOR_TYPE.has(String(dataSource ?? '').toLowerCase());
}

/**
 * verifiedFilingText — the high-confidence wording, naming the source when it is known:
 * 'Verified filing: LA City Ethics Commission', or 'Verified filing' for an unknown or mixed source.
 */
export function verifiedFilingText(dataSource) {
  const name = financeSourceName(dataSource);
  return name ? `Verified filing: ${name}` : 'Verified filing';
}
