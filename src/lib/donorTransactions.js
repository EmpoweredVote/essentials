// A Top Donors row opens that donor's own transactions (ev-accounts #1087).
//
// The contributions endpoint takes ?donor=<top_donors name> and returns exactly the rows behind
// that summary entry, refunds included. It echoes `filter.donor` back. An API that predates
// #1087 ignores ?donor= and returns the politician's most recent rows unfiltered, so a response
// without the echo must never be shown as the donor's transactions.

/** Transactions fetched per page when a donor is opened. */
export const DONOR_PAGE_SIZE = 10;

/** Query string for one page of a donor's transactions. */
export function donorContributionsQuery(cycle, donorName, cursor = null) {
  const params = new URLSearchParams({ cycle, donor: donorName, limit: String(DONOR_PAGE_SIZE) });
  if (cursor) params.set('cursor', cursor);
  return params.toString();
}

/** True when the API applied the donor filter (it echoes the name it matched). */
export function isDonorFiltered(data, donorName) {
  return data?.filter?.donor === donorName;
}

/**
 * Fallback for an API without ?donor=: filter the shared, already-loaded contributions list
 * by name, exactly as before #1087. It usually finds nothing; it is kept only until the API
 * deploys.
 */
export function legacyDonorTransactions(contributions, donorName) {
  return contributions?.results
    ? contributions.results.filter((tx) => tx.donor_name === donorName)
    : [];
}
