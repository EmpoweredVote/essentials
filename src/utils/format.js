// Shared money/number formatters for the app. Extracted from the several inline copies
// in the CampaignFinance components (quick-032) so the composition bar and its siblings
// format identically.

/** Full USD, no cents. e.g. $1,234,567 */
export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

/** Compact USD for tight labels. e.g. $1.5M, $300K, $850 */
export function formatCompactCurrency(amount) {
  const n = amount || 0;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${Math.round(n)}`;
}

/** Whole-number percent of a part over a total. e.g. 43% */
export function formatPercent(numerator, denominator) {
  if (!denominator || denominator === 0) return '0%';
  return `${Math.round((numerator / denominator) * 100)}%`;
}
