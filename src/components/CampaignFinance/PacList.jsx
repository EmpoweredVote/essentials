import InfoTooltip from './InfoTooltip';
import { formatCurrency } from '../../utils/format';

/**
 * PacList — the itemized "PACs & committees" list under the composition bar (quick-032). Shows the
 * real political action committees + party committees that gave to this candidate, with a link to
 * each one's full national record on FEC.gov ("see everywhere they donated"). Built from
 * summary.pac_contributions (entity_type IN 'PAC','PTY') — clean, no self-funding / victory-fund
 * double-count. Renders nothing when absent.
 */

const PAC_EXPLAINER = {
  title: 'What is a PAC?',
  paragraphs: [
    'A political action committee (PAC) is an organized group — an industry, union, advocacy organization, or political party — that pools many people’s money to give to candidates.',
    'Because a PAC represents an organized interest rather than one person, which PACs fund a candidate — and who else those PACs fund — is often the clearest window into influence.',
    'Each one links to its full national record on FEC.gov, so you can see everywhere it gave.',
  ],
};

/** FEC.gov committee search for a PAC name — its page lists everywhere the committee gave. */
function fecCommitteeSearchUrl(name) {
  return `https://www.fec.gov/data/committees/?q=${encodeURIComponent(name)}`;
}

export default function PacList({ pacList }) {
  if (!pacList || !pacList.pacs || pacList.pacs.length === 0) return null;

  const { pacs, total_amount, count } = pacList;
  const shown = pacs.length;

  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          PACs &amp; committees that gave
        </h4>
        <InfoTooltip content={PAC_EXPLAINER} label="What is a PAC?" />
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
        {formatCurrency(total_amount)} from {count.toLocaleString()} political action &amp; party committees
      </p>

      <ul className="divide-y divide-gray-100 dark:divide-gray-700 border border-gray-100 dark:border-gray-700 rounded-lg overflow-hidden">
        {pacs.map((pac) => (
          <li key={`${pac.name}-${pac.entity_type}`} className="flex items-center gap-3 px-3 py-2.5">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-purple-500 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <span className="block text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                {pac.name}
                {pac.entity_type === 'PTY' && (
                  <span className="ml-1.5 text-[10px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">party</span>
                )}
              </span>
            </div>
            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 tabular-nums whitespace-nowrap">
              {formatCurrency(pac.total_amount)}
            </span>
            <a
              href={fecCommitteeSearchUrl(pac.name)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline whitespace-nowrap flex-shrink-0"
            >
              See where they gave ↗
            </a>
          </li>
        ))}
      </ul>

      <p className="text-[11px] text-gray-400 dark:text-gray-500 leading-relaxed mt-2">
        {shown < count ? `Top ${shown} of ${count.toLocaleString()} committees on file. ` : ''}
        Real political action &amp; party committees only — self-funding and transfers between the
        candidate’s own committees are shown elsewhere, not counted here. “See where they gave”
        opens each committee’s complete national record on FEC.gov.
      </p>
    </div>
  );
}
