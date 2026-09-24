/**
 * FiledReportsPanel — shown when coverage_status === 'filed_reports': the politician's committee filed a
 * report whose summary sheet we hold, but no itemized contributions are loaded (typically a $0 report).
 * It states what the report says instead of the old "being processed" banner, which was false for them.
 *
 * A blank line on the sheet arrives as null and renders as "—", never "$0".
 * Spec: ev-accounts docs/superpowers/specs/2026-09-24-filed-report-summaries-design.md
 *
 * Props:
 *   reports — summary.filed_reports (newest first, max 4)
 */

const REPORT_TYPE_LABELS = {
  pre_primary: 'Pre-Primary',
  pre_election: 'Pre-Election',
  annual: 'Annual',
  nomination: 'Nomination',
  final: 'Final',
  other: 'Other',
};

const moneyFormat = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

/** null/undefined = the line was blank on the sheet. */
export function formatMoney(value) {
  return value == null ? '—' : moneyFormat.format(value);
}

// UTC so a YYYY-MM-DD date never shifts a day for a viewer west of Greenwich.
function parts(iso) {
  const d = new Date(`${iso}T00:00:00Z`);
  return {
    md: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }),
    year: d.getUTCFullYear(),
  };
}

export function formatReportDate(iso) {
  const p = parts(iso);
  return `${p.md}, ${p.year}`;
}

function formatPeriod(start, end) {
  const s = parts(start);
  const e = parts(end);
  return s.year === e.year ? `${s.md} – ${e.md}, ${e.year}` : `${s.md}, ${s.year} – ${e.md}, ${e.year}`;
}

export function describeReport(r) {
  const label = REPORT_TYPE_LABELS[r.report_type] ?? 'Campaign finance';
  return {
    title: `${label} report${r.is_amendment ? ' (amended)' : ''}`,
    period: formatPeriod(r.period_start, r.period_end),
    filed: r.filed_on
      ? `filed ${formatReportDate(r.filed_on)} with the ${r.filed_with}`
      : `filed with the ${r.filed_with}`,
    // A derived figure was calculated by the backend from the sheet's own totals because the filer left
    // that line blank (line 16 − 13 for raised, 16 − 18 for spent); it is marked, not presented as written.
    figures: [
      { label: 'Raised', value: formatMoney(r.receipts_total), derived: r.receipts_total_derived === true },
      { label: 'Spent', value: formatMoney(r.expenditures_total), derived: r.expenditures_total_derived === true },
      { label: 'Cash on hand', value: formatMoney(r.cash_end), derived: false },
    ],
    itemizedNote: r.receipts_itemized > 0 ? 'Itemized donor list not yet available.' : null,
    derivedNote:
      r.receipts_total_derived === true || r.expenditures_total_derived === true
        ? '* Calculated from the report’s totals; the filer left that line blank.'
        : null,
  };
}

export default function FiledReportsPanel({ reports }) {
  if (!reports?.length) return null;
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-white/10 p-5">
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        No itemized contributions are on file. This is what the campaign&apos;s filed reports show.
      </p>
      <ul className="space-y-4">
        {reports.map((r) => {
          const d = describeReport(r);
          return (
            <li key={`${r.form}-${r.report_type}-${r.period_start}-${r.period_end}`}>
              <p className="text-sm text-gray-900 dark:text-gray-100">
                <span className="font-semibold">{d.title}</span>
                {' · '}
                {d.period}
                {' · '}
                <span className="text-gray-600 dark:text-gray-400">{d.filed}</span>
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                {d.figures.map((f, i) => (
                  <span key={f.label}>
                    {i > 0 && ' · '}
                    {f.label} <span className="font-semibold">{f.value}{f.derived && '*'}</span>
                  </span>
                ))}
              </p>
              {d.derivedNote && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{d.derivedNote}</p>
              )}
              {d.itemizedNote && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{d.itemizedNote}</p>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
