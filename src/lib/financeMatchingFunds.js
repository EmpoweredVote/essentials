// Public matching funds in the campaign-finance summary (ev-accounts fix/cf-la-schedule-i-matching-funds).
//
// LA City pays qualifying candidates public matching funds. They are public money, not a donation, so the API
// leaves them out of `total_raised` and the donor lists and reports them as `public_matching_funds`
// { total_amount, payment_count }. They are shown beside "raised", never added to it.
//
// An API that predates the field sends nothing; that reads as 0, so nothing new renders.

const formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

/**
 * matchingFundsSummary reads the matching-funds field off a summary.
 *   amount — public matching funds received this cycle (0 when none or when the field is absent)
 *   label  — "$902,686 in public matching funds", or '' when amount is 0
 */
export function matchingFundsSummary(summary) {
  const amount = Math.max(0, Number(summary?.public_matching_funds?.total_amount) || 0);
  return {
    amount,
    label: amount > 0 ? `${formatter.format(amount)} in public matching funds` : '',
  };
}
