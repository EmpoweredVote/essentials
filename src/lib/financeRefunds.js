// Returned contributions in the campaign-finance summary (ev-accounts CA_0255).
//
// The API reports `total_raised` as GROSS receipts and returned contributions separately, as a
// positive `total_refunded` with its `refund_count`. A refund never reduces "raised", so a cycle
// can hold refunds and no new money: that cycle reads "No new contributions", not a negative total.
//
// An API that predates CA_0255 sends neither field; both read as 0, so nothing new renders.

/** USD with cents under $1,000 (refunds are often small), whole dollars above. */
export function formatRefundAmount(amount) {
  const n = Math.abs(Number(amount) || 0);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: n < 1000 ? 2 : 0,
    maximumFractionDigits: n < 1000 ? 2 : 0,
  }).format(n);
}

/**
 * refundSummary reads the refund fields off a summary.
 *   refunded    — positive amount returned to donors (0 when none or when the field is absent)
 *   refundCount — number of returned contributions
 *   onlyRefunds — the cycle holds refunds and no new contributions (raised is 0)
 *   label       — "$338.76 returned to donors (2 contributions)", or '' when refunded is 0
 */
export function refundSummary(summary) {
  const refunded = Math.max(0, Number(summary?.total_refunded) || 0);
  const refundCount = Math.max(0, Number(summary?.refund_count) || 0);
  const raised = Number(summary?.total_raised) || 0;
  const countText = refundCount > 0
    ? ` (${refundCount} contribution${refundCount === 1 ? '' : 's'})`
    : '';
  return {
    refunded,
    refundCount,
    onlyRefunds: refunded > 0 && raised === 0,
    label: refunded > 0 ? `${formatRefundAmount(refunded)} returned to donors${countText}` : '',
  };
}
