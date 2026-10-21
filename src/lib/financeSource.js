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
