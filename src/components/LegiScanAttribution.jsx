import { hasLegiScanData, latestLegiScanVoteDate } from '../lib/legiscanAttribution';

function formatLatest(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}

/**
 * Credit line required by LegiScan's CC BY 4.0 licence. Renders nothing unless
 * the bills/votes passed in include LegiScan-sourced rows.
 */
export default function LegiScanAttribution({ bills = [], votes = [] }) {
  if (!hasLegiScanData(bills, votes)) return null;
  const latest = formatLatest(latestLegiScanVoteDate(votes));
  return (
    <p className="mt-6 text-xs text-gray-500 dark:text-gray-400 font-[Manrope]">
      State legislative data: <a href="https://legiscan.com/" target="_blank" rel="noopener noreferrer" className="underline">LegiScan</a>,
      {' '}licensed{' '}
      <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer" className="underline">CC BY 4.0</a>.
      {latest ? ` Most recent vote on file: ${latest}. Data may lag the legislature.` : ' Data may lag the legislature.'}
    </p>
  );
}
