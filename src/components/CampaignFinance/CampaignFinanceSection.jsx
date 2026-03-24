import { useState, useEffect } from 'react';
import { useCampaignFinance } from './hooks/useCampaignFinance';
import SummaryCard from './SummaryCard';
import ExpandedView from './ExpandedView';

/**
 * CampaignFinanceSection — orchestrator component for campaign finance display.
 * Placed on the politician profile page below other profile content.
 *
 * Props:
 *   politicianId — politician UUID string
 */
export default function CampaignFinanceSection({ politicianId }) {
  const [expanded, setExpanded] = useState(false);
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
    setCycle(newCycle);
    // Reset expanded state and contributions when cycle changes
    setExpanded(false);
  }

  function handleExpand() {
    setExpanded((v) => !v);
  }

  // Don't render section if API errored (endpoint missing) or no data after loading
  if (!loading && !summary && error) return null;
  if (!loading && summary && !summary.available_cycles?.length) return null;

  return (
    <section className="mt-8" aria-label="Campaign Finance">
      <h2
        className="text-2xl font-bold mb-4"
        style={{ fontFamily: "'Manrope', sans-serif" }}
      >
        Transparent Motivations
      </h2>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
        <SummaryCard
          summary={summary}
          cycle={cycle}
          onCycleChange={handleCycleChange}
          onExpand={handleExpand}
          expanded={expanded}
          dataUpdatedAt={dataUpdatedAt}
          loading={loading}
        />

        {/* Expanded view with smooth max-height transition */}
        <div
          className={`overflow-hidden transition-all duration-300 ${
            expanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          {expanded && summary && (
            <ExpandedView
              summary={summary}
              contributions={contributions}
              onFetchContributions={() => fetchContributions()}
              onFetchMore={fetchMoreContributions}
            />
          )}
        </div>
      </div>
    </section>
  );
}

