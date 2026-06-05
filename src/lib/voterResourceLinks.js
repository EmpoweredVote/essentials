/**
 * Official state election / "how to vote" links, keyed by 2-letter state code.
 *
 * Used by VoterResourcesCard as the always-available fallback when the Google
 * Civic API has no live election for an address (off-cycle). These point to each
 * state's official election division / voter-information site (.gov where
 * possible). National fallback is vote.gov.
 *
 * Verified to resolve (2xx/3xx) on 2026-06-05. If a state changes domains,
 * update it here.
 */
export const STATE_VOTER_LINKS = {
  AL: 'https://www.sos.alabama.gov/alabama-votes',
  AK: 'https://www.elections.alaska.gov/',
  AZ: 'https://azsos.gov/elections',
  AR: 'https://www.sos.arkansas.gov/elections',
  CA: 'https://www.sos.ca.gov/elections',
  CO: 'https://www.coloradosos.gov/',
  CT: 'https://portal.ct.gov/sots',
  DE: 'https://elections.delaware.gov/',
  FL: 'https://dos.fl.gov/elections/',
  GA: 'https://sos.ga.gov/',
  HI: 'https://elections.hawaii.gov/',
  ID: 'https://idahovotes.gov/',
  IL: 'https://www.elections.il.gov/',
  IN: 'https://www.in.gov/sos/elections/',
  IA: 'https://sos.iowa.gov/elections/voterinformation/',
  KS: 'https://sos.ks.gov/elections/elections.html',
  KY: 'https://elect.ky.gov/',
  LA: 'https://www.sos.la.gov/ElectionsAndVoting/Pages/default.aspx',
  ME: 'https://www.maine.gov/sos/cec/elec/',
  MD: 'https://elections.maryland.gov/',
  MA: 'https://www.sec.state.ma.us/divisions/elections/elections-and-voting.htm',
  MI: 'https://www.michigan.gov/sos/elections',
  MN: 'https://www.sos.state.mn.us/elections-voting/',
  MS: 'https://www.sos.ms.gov/elections-voting',
  MO: 'https://www.sos.mo.gov/elections',
  MT: 'https://sosmt.gov/elections/',
  NE: 'https://sos.nebraska.gov/elections',
  NV: 'https://www.nvsos.gov/sos/elections',
  NH: 'https://www.sos.nh.gov/elections',
  NJ: 'https://www.nj.gov/state/elections/index.shtml',
  NM: 'https://www.sos.nm.gov/voting-and-elections/',
  NY: 'https://elections.ny.gov/',
  NC: 'https://www.ncsbe.gov/',
  ND: 'https://www.sos.nd.gov/elections',
  OH: 'https://www.ohiosos.gov/elections/',
  OK: 'https://oklahoma.gov/elections.html',
  OR: 'https://sos.oregon.gov/voting-elections/Pages/default.aspx',
  PA: 'https://www.vote.pa.gov/',
  RI: 'https://elections.ri.gov/',
  SC: 'https://scvotes.gov/',
  SD: 'https://sdsos.gov/elections-voting/',
  TN: 'https://sos.tn.gov/elections',
  TX: 'https://www.votetexas.gov/',
  UT: 'https://vote.utah.gov/',
  VT: 'https://sos.vermont.gov/elections/',
  VA: 'https://www.elections.virginia.gov/',
  WA: 'https://www.sos.wa.gov/elections',
  WV: 'https://sos.wv.gov/elections/',
  WI: 'https://elections.wi.gov/',
  WY: 'https://sos.wyo.gov/Elections/',
  DC: 'https://www.dcboe.org/',
};

export const NATIONAL_VOTER_LINK = 'https://www.vote.gov/';

/**
 * Resolve the best official "how to vote" link for a state code.
 * Falls back to vote.gov when the state is unknown/unmapped.
 */
export function getOfficialVoterLink(stateCode) {
  return (stateCode && STATE_VOTER_LINKS[stateCode]) || NATIONAL_VOTER_LINK;
}
