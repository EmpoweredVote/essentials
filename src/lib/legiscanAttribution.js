// src/lib/legiscanAttribution.js
// Pure helpers — no React import. LegiScan data is licensed CC BY 4.0, so any page
// that shows LegiScan-sourced bills or votes must credit LegiScan.
// LegiScan rows are recognised by their legiscan.com bill URL (bills use `url`,
// votes use `bill_url`).

const LEGISCAN_URL = /^https?:\/\/(www\.)?legiscan\.com\//i;

function isLegiScanItem(item) {
  const url = item?.url || item?.bill_url;
  return typeof url === 'string' && LEGISCAN_URL.test(url);
}

/**
 * @param {...Array} lists bills and/or votes arrays
 * @returns {boolean} true when any item came from LegiScan
 */
export function hasLegiScanData(...lists) {
  return lists.some((list) => Array.isArray(list) && list.some(isLegiScanItem));
}

/**
 * Latest vote_date (ISO string) among LegiScan-sourced votes, or null.
 * @param {Array} votes
 * @returns {string|null}
 */
export function latestLegiScanVoteDate(votes) {
  if (!Array.isArray(votes)) return null;
  let latest = null;
  for (const v of votes) {
    if (!isLegiScanItem(v) || !v.vote_date) continue;
    if (latest === null || v.vote_date > latest) latest = v.vote_date;
  }
  return latest;
}
