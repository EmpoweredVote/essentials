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
  const [cycle, setCycle] = useState(null);

  const {
    summary,
    contributions,
    loading,
    dataUpdatedAt,
    fetchContributions,
    fetchMoreContributions,
  } = useCampaignFinance(politicianId, cycle);

  // Set initial cycle from first available cycle once summary loads
  useEffect(() => {
    if (summary?.available_cycles?.length > 0 && cycle === null) {
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

