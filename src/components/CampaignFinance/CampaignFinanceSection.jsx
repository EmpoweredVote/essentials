import { useState, useEffect } from 'react';
import { track } from '@empoweredvote/analytics';
import { useCampaignFinance } from './hooks/useCampaignFinance';
import SummaryCard from './SummaryCard';
import ExpandedView from './ExpandedView';
import DonorSearch from './DonorSearch';
import OutsideSpendingSection from './OutsideSpendingSection';

/**
 * LocalUnavailableBanner — shown when a local/county politician has no digital filings.
 * Satisfies COV-05: visitors are never shown a blank campaign finance section for local offices.
 */
function LocalUnavailableBanner() {
  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-5 flex gap-3">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="w-5 h-5 text-blue-500 dark:text-blue-400 mt-0.5 flex-shrink-0"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <div>
        <p className="text-sm text-blue-800 dark:text-blue-300">
          Campaign finance filings for this office may be held by a local or state election
          authority and are not yet available digitally on Empowered Vote.
        </p>
      </div>
    </div>
  );
}

/** DataPendingBanner - shown when politician has source rows but contributions not yet ingested. */
function DataPendingBanner() {
  return (
    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-5 flex gap-3">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="w-5 h-5 text-amber-500 dark:text-amber-400 mt-0.5 flex-shrink-0"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <div>
        <p className="text-sm text-amber-800 dark:text-amber-300">
          Campaign finance filings for this candidate have been sourced and are being processed.
          Check back soon for detailed contribution data.
        </p>
      </div>
    </div>
  );
}

/**
 * CampaignFinanceSection — orchestrator component for campaign finance display.
 * Placed on the politician profile page below other profile content.
 *
 * Props:
 *   politicianId — politician UUID string
 */
export default function CampaignFinanceSection({ politicianId }) {
  const currentYear = new Date().getFullYear();
  const defaultCycle = String(currentYear % 2 === 0 ? currentYear : currentYear - 1);
  const [cycle, setCycle] = useState(defaultCycle);

  const {
    summary,
    contributions,
    loading,
    error,
    dataUpdatedAt,
    fetchContributions,
    fetchMoreContributions,
  } = useCampaignFinance(politicianId, cycle);

  // Update cycle if current cycle is not in the politician's available cycles
  useEffect(() => {
    if (summary?.available_cycles?.length > 0 && !summary.available_cycles.includes(cycle)) {
      setCycle(summary.available_cycles[0]);
    }
  }, [summary, cycle]);

  function handleCycleChange(newCycle) {
    track('essentials_campaign_finance_cycle_changed', { cycle: newCycle });
    setCycle(newCycle);
  }

  // Initial (or new-politician) fetch in flight with no data yet — render nothing.
  // Prevents a flash of the section for candidates that turn out to have no finance data.
  // (On a cycle change the hook keeps the previous summary, so this won't hide the section.)
  if (loading && !summary) return null;

  // Don't render section if API errored (endpoint missing) or no data after loading
  if (!loading && !summary && error) return null;

  // Coverage gap banner for local offices with no digital data
  // Still render OutsideSpendingSection if IE/PAC committees exist for this race
  if (!loading && summary?.coverage_status === 'local_unavailable') {
    const hasOutsideSpending = summary?.outside_spending?.committees?.length > 0;
    return (
      <section className="mt-8" aria-label="Campaign Finance">
        <h2 className="text-2xl font-bold mb-4" style={{ fontFamily: "'Manrope', sans-serif" }}>
          Transparent Motivations
        </h2>
        <LocalUnavailableBanner />
        {hasOutsideSpending && (
          <OutsideSpendingSection outsideSpending={summary.outside_spending} />
        )}
      </section>
    );
  }

  // Data sourced but not yet ingested — show pending banner
  if (!loading && summary?.coverage_status === 'data_pending') {
    return (
      <section className="mt-8" aria-label="Campaign Finance">
        <h2 className="text-2xl font-bold mb-4" style={{ fontFamily: "'Manrope', sans-serif" }}>
          Transparent Motivations
        </h2>
        <DataPendingBanner />
      </section>
    );
  }

  // No data at all — suppress section entirely
  if (!loading && summary && !summary.available_cycles?.length) return null;

  return (
    <section className="mt-8" aria-label="Campaign Finance">
      <h2
        className="text-2xl font-bold mb-4"
        style={{ fontFamily: "'Manrope', sans-serif" }}
      >
        Transparent Motivations
      </h2>

      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm overflow-hidden border border-gray-200 dark:border-white/10">
        <SummaryCard
          summary={summary}
          cycle={cycle}
          onCycleChange={handleCycleChange}
          dataUpdatedAt={dataUpdatedAt}
          loading={loading}
        />

        <ExpandedView
          summary={summary}
          contributions={contributions}
          onFetchContributions={() => fetchContributions()}
          onFetchMore={fetchMoreContributions}
        />

        {/* Outside Spending — IE committees / PACs that spent in this race */}
        <OutsideSpendingSection outsideSpending={summary?.outside_spending} />

        {/* Donor search — lets visitors look up which politicians a donor funded */}
        <DonorSearch currentPoliticianId={politicianId} />
      </div>
    </section>
  );
}

