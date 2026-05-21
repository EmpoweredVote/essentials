/**
 * OutsideSpendingSection — Renders IE committee / PAC outside spending for a politician's race.
 *
 * Shown below the donor breakdown when outside_spending.committees.length > 0.
 * Hidden (returns null) when committees array is empty or prop is absent.
 *
 * Per plan: no FOR/AGAINST labels — those are deferred to a future quick task.
 *
 * Props:
 *   outsideSpending — { committees: Array<{ cmt_id, cmt_nm, total_amount, contribution_count, top_donors }> }
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

export default function OutsideSpendingSection({ outsideSpending }) {
  // Guard: no data → no section
  if (!outsideSpending || !outsideSpending.committees || outsideSpending.committees.length === 0) {
    return null;
  }

  const { committees } = outsideSpending;

  return (
    <div className="border-t border-gray-100 dark:border-gray-700 px-5 pb-5 pt-4">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-4">
        Outside Spending in This Race
      </h4>

      <div className="space-y-4">
        {committees.map((committee) => {
          // Show top 5 donors in the UI (API returns up to 10)
          const topFiveDonors = (committee.top_donors || []).slice(0, 5);

          return (
            <div
              key={committee.cmt_id}
              className="border border-gray-100 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800/50"
            >
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
                  <span className="text-gray-500 dark:text-gray-400">Total raised:</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {formatCurrency(committee.total_amount)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Contributions:</span>
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {committee.contribution_count}
                  </span>
                </div>
              </div>

              {/* Top donors list */}
              {topFiveDonors.length > 0 && (
                <div className="pl-6">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-1.5">
                    Top Donors
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
