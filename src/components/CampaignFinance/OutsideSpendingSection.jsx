/**
 * OutsideSpendingSection — Renders IE committee / PAC outside spending for a politician's race.
 *
 * Shown below the donor breakdown when outside_spending.committees.length > 0.
 * Hidden (returns null) when committees array is empty or prop is absent.
 *
 * ── ADR 0008 §6 — DIRECTION IS NOT DECORATION ──────────────────────────────────────────────
 *
 * 🔴 A committee formed to ELECT someone and a committee formed to RECALL them are the same
 * shape in this payload, and so are their donor lists. One is people who funded them; the other
 * is people who funded a campaign AGAINST them. Rendered under one heading, in one list, with
 * one style, the list inverts its meaning while looking identical, and a reader scanning it has
 * no way to tell.
 *
 * This file used to say "Per plan: no FOR/AGAINST labels — those are deferred to a future quick
 * task", and rendered every committee under a neutral "Outside Spending in This Race" heading
 * with a neutral "Top Donors" list. That was safe only by luck: all three committees that
 * published happened to be support committees, because their names contained "for", "working
 * families for" and "supporting". The first oppose committee would have published silently as
 * the politician's own backing — and `CC_0225` evidenced one, the $33,172.80 raised to recall
 * Gavin Newsom.
 *
 * So: every card states its direction in WORDS as well as colour, and an oppose committee's
 * donors are labelled as funding the opposition. Cards are grouped support-then-oppose so the
 * two never interleave.
 *
 * ▶ A committee whose direction is unknown is NOT RENDERED. The API already withholds those
 * (`support_oppose IS NOT NULL`), so this should never fire — but a consumer that guessed would
 * reintroduce exactly the defect the field exists to prevent. There is no safe default.
 *
 * Props:
 *   outsideSpending — { committees: Array<{ cmt_id, cmt_nm, total_amount, contribution_count,
 *                       support_oppose: 'support' | 'oppose', top_donors }> }
 *   politicianName  — optional; used to name the person in each direction label.
 */

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

// Building icon — reused from DonorList pattern
function BuildingIcon({ className = '' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M4 3h16a1 1 0 011 1v16a1 1 0 01-1 1H4a1 1 0 01-1-1V4a1 1 0 011-1zm2 2v14h12V5H6zm2 2h2v2H8V7zm0 4h2v2H8v-2zm0 4h2v2H8v-2zm4-8h2v2h-2V7zm0 4h2v2h-2v-2zm0 4h4v2h-4v-2zm4-8h2v2h-2V7zm0 4h2v2h-2v-2z" />
    </svg>
  );
}

/** Arrow up — supporting. */
function SupportIcon({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M10 3a1 1 0 01.707.293l5 5a1 1 0 01-1.414 1.414L11 6.414V16a1 1 0 11-2 0V6.414L5.707 9.707a1 1 0 01-1.414-1.414l5-5A1 1 0 0110 3z" clipRule="evenodd" />
    </svg>
  );
}

/** Arrow down — opposing. */
function OpposeIcon({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M10 17a1 1 0 01-.707-.293l-5-5a1 1 0 011.414-1.414L9 13.586V4a1 1 0 112 0v9.586l3.293-3.293a1 1 0 011.414 1.414l-5 5A1 1 0 0110 17z" clipRule="evenodd" />
    </svg>
  );
}

/**
 * The two directions differ in colour, icon, border, badge wording, the label on the money and
 * the label on the donors. Colour is never the only carrier — ADR 0008 §6 requires the
 * distinction to be textual as well, and a reader who cannot see colour gets the same facts.
 */
const DIRECTION = {
  support: {
    Icon: SupportIcon,
    badge: (who) => `Supporting ${who}`,
    card: 'border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/40 dark:bg-emerald-900/10',
    rail: 'bg-emerald-500 dark:bg-emerald-400',
    chip: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900/50 dark:text-emerald-200',
    moneyLabel: 'Raised to support them:',
    donorsHeading: 'Top donors funding this support',
    donorsNote: (who) => `These donors gave to a committee campaigning FOR ${who}.`,
    noteClass: 'text-gray-600 dark:text-gray-300',
  },
  oppose: {
    Icon: OpposeIcon,
    badge: (who) => `Opposing ${who}`,
    card: 'border-rose-300 dark:border-rose-800/60 bg-rose-50/50 dark:bg-rose-900/10',
    rail: 'bg-rose-500 dark:bg-rose-400',
    chip: 'bg-rose-100 text-rose-900 dark:bg-rose-900/50 dark:text-rose-200',
    moneyLabel: 'Raised to oppose them:',
    donorsHeading: 'Top donors funding the opposition',
    donorsNote: (who) =>
      `These donors did NOT give to ${who}. They gave to a committee campaigning AGAINST them.`,
    // The one line a reader must not skim past, so it is not grey body text.
    noteClass: 'text-rose-800 dark:text-rose-300 font-medium',
  },
};

export default function OutsideSpendingSection({ outsideSpending, politicianName }) {
  // Guard: no data → no section
  if (!outsideSpending || !outsideSpending.committees || outsideSpending.committees.length === 0) {
    return null;
  }

  const who = politicianName?.trim() || 'this candidate';

  // ADR 0008: withhold anything whose direction we cannot state. Never default to 'support'.
  const committees = outsideSpending.committees.filter(
    (c) => c.support_oppose === 'support' || c.support_oppose === 'oppose'
  );
  if (committees.length === 0) return null;

  // Group so the two directions never interleave; support first, then oppose.
  const ordered = [
    ...committees.filter((c) => c.support_oppose === 'support'),
    ...committees.filter((c) => c.support_oppose === 'oppose'),
  ];
  const hasOppose = ordered.some((c) => c.support_oppose === 'oppose');

  return (
    <div className="border-t border-gray-100 dark:border-gray-700 px-5 pb-5 pt-4">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
        Outside Spending in This Race
      </h4>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 max-w-prose">
        {hasOppose ? (
          <>
            These committees are <strong>not controlled by {who}</strong>. Some spent money
            supporting {who}; others spent money <strong>opposing</strong> them. Each card says
            which.
          </>
        ) : (
          <>
            These committees are <strong>not controlled by {who}</strong>. Their money is not{' '}
            {who}&rsquo;s fundraising.
          </>
        )}
      </p>

      <div className="space-y-4">
        {ordered.map((committee) => {
          const dir = DIRECTION[committee.support_oppose];
          const { Icon } = dir;
          // Show top 5 donors in the UI (API returns up to 10)
          const topFiveDonors = (committee.top_donors || []).slice(0, 5);

          return (
            <div
              key={committee.cmt_id}
              className={`relative overflow-hidden border rounded-lg p-4 pl-5 ${dir.card}`}
            >
              {/* Direction rail — a second, non-textual cue; never the only one. */}
              <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${dir.rail}`} aria-hidden="true" />

              {/* Direction badge — stated in words, first thing in the card. */}
              <div
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 mb-2.5 text-xs font-bold uppercase tracking-wide ${dir.chip}`}
              >
                <Icon className="w-3.5 h-3.5" />
                {dir.badge(who)}
              </div>

              {/* Committee header */}
              <div className="flex items-start gap-2 mb-3">
                <BuildingIcon className="w-4 h-4 text-purple-400 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-tight">
                    {committee.cmt_nm || 'Unknown Committee'}
                  </p>
                </div>
              </div>

              {/* Totals row */}
              <div className="flex flex-wrap gap-x-5 gap-y-1 mb-3 pl-6">
                <div className="flex items-center gap-1.5 text-sm">
                  <span className="text-gray-600 dark:text-gray-300">{dir.moneyLabel}</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {formatCurrency(committee.total_amount)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-sm">
                  <span className="text-gray-600 dark:text-gray-300">Contributions:</span>
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {committee.contribution_count}
                  </span>
                </div>
              </div>

              {/* Top donors list */}
              {topFiveDonors.length > 0 && (
                <div className="pl-6">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300 mb-0.5">
                    {dir.donorsHeading}
                  </p>
                  <p className={`text-xs mb-1.5 max-w-prose ${dir.noteClass}`}>
                    {dir.donorsNote(who)}
                  </p>
                  <ul className="space-y-1">
                    {topFiveDonors.map((donor, idx) => (
                      <li
                        key={idx}
                        className="flex justify-between items-baseline text-sm"
                      >
                        <span className="text-gray-700 dark:text-gray-300 truncate pr-3 min-w-0">
                          {donor.donor_name || 'Unknown'}
                        </span>
                        <span className="font-medium text-gray-900 dark:text-gray-100 flex-shrink-0">
                          {formatCurrency(donor.amount)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
