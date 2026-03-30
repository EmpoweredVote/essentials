import { useMemo } from 'react';
import { CategorySection, PoliticianCard } from '@chrisandrewsedu/ev-ui';
import {
  classifyCategory,
  LOCAL_ORDER,
  STATE_ORDER,
  FEDERAL_ORDER,
  orderedEntries,
} from '../lib/classify';

const TYPE_LABELS = {
  primary: 'Primary',
  general: 'General',
  retention: 'Retention',
  special: 'Special Election',
};

/** Timezone-safe days-until helper */
function daysUntil(dateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + 'T12:00:00');
  target.setHours(0, 0, 0, 0);
  return Math.round((target - today) / (1000 * 60 * 60 * 24));
}

/** Seeded shuffle for antipartisan candidate ordering */
function seededShuffle(candidates, seed) {
  const hash = (s) =>
    s.split('').reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 0);
  return [...candidates].sort(
    (a, b) => hash(seed + a.candidate_id) - hash(seed + b.candidate_id)
  );
}

/** Format election date: "May 6, 2026" */
function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

/** Tier ordering arrays in display order: Local first */
const TIER_CONFIG = [
  { tier: 'Local', order: LOCAL_ORDER },
  { tier: 'State', order: STATE_ORDER },
  { tier: 'Federal', order: FEDERAL_ORDER },
];

export default function ElectionsView({
  elections,
  loading,
  buildingImageMap,
  onCandidateClick,
}) {
  // Session seed for stable candidate randomization
  const sessionSeed = useMemo(() => {
    let seed = sessionStorage.getItem('ev:election-seed');
    if (!seed) {
      seed = Math.random().toString(36).substring(2);
      sessionStorage.setItem('ev:election-seed', seed);
    }
    return seed;
  }, []);

  // Pre-process elections: classify races by tier/group, shuffle candidates
  const processedElections = useMemo(() => {
    if (!elections || elections.length === 0) return [];

    return elections.map((election) => {
      // Group races by tier, then by group within tier
      const tierGroups = { Local: {}, State: {}, Federal: {} };

      for (const race of election.races) {
        const cat = classifyCategory({ district_type: race.district_type });
        const tier = tierGroups[cat.tier] ? cat.tier : 'Local';
        if (!tierGroups[tier][cat.group]) tierGroups[tier][cat.group] = [];
        tierGroups[tier][cat.group].push({
          ...race,
          shuffledCandidates: seededShuffle(race.candidates, sessionSeed),
        });
      }

      return { ...election, tierGroups };
    });
  }, [elections, sessionSeed]);

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        {[0, 1].map((i) => (
          <div key={i} className="mb-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-24 mb-4" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[0, 1, 2].map((j) => (
                <div key={j} className="flex flex-col items-center gap-2 p-4">
                  <div className="w-16 h-16 rounded-full bg-gray-200" />
                  <div className="h-4 bg-gray-200 rounded w-2/3" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Null state (not yet fetched)
  if (elections === null) return null;

  // Empty state
  if (elections.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[240px] text-center px-4">
        <p className="text-[16px] font-semibold text-[#00657C]">
          No upcoming elections found
        </p>
        <p className="text-[14px] text-[#4A5568] mt-2">
          We're expanding coverage — check back as election season approaches.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {processedElections.map((election) => {
        const days = daysUntil(election.election_date);
        const dateStr = formatDate(election.election_date);
        const typeLabel = TYPE_LABELS[election.election_type] || election.election_type;

        return (
          <div key={election.election_id}>
            {/* Election header */}
            <div className="bg-white border-b border-[#E2EBEF] py-4 px-6 mb-4 rounded-t-lg">
              <p className="text-[16px] font-semibold text-[#00657C]">
                {election.election_name}
                <span className="text-[#718096] font-normal"> · </span>
                {dateStr}
                {days > 0 && days < 60 && (
                  <>
                    <span className="text-[#718096] font-normal"> · </span>
                    <span className="text-[#00657C]">{days} days away</span>
                  </>
                )}
              </p>
            </div>

            {/* Tier sections: Local > State > Federal */}
            {TIER_CONFIG.map(({ tier, order }) => {
              const groups = election.tierGroups[tier];
              if (!groups || Object.keys(groups).length === 0) return null;

              return (
                <div key={tier} className="mb-6">
                  <div className="flex items-center gap-4 mb-4">
                    <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                      {tier}
                    </span>
                    <hr className="flex-1 border-gray-200" />
                  </div>

                  {orderedEntries(groups, order).map(([group, races]) => (
                    <CategorySection
                      key={group}
                      title={group}
                      style={{ marginBottom: '16px' }}
                    >
                      {races.map((race) => (
                        <div key={race.race_id} className="mb-4">
                          <p className="text-[14px] text-[#4A5568] mb-2">
                            {race.position_name}
                            {race.seats > 1 && (
                              <span className="text-[#718096]">
                                {' '}
                                · {race.seats} seats
                              </span>
                            )}
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {race.shuffledCandidates.map((candidate) => (
                              <div
                                key={candidate.candidate_id}
                                className={
                                  candidate.is_incumbent ? 'incumbent-card' : ''
                                }
                                style={
                                  candidate.is_incumbent
                                    ? {
                                        '--incumbent-color': '#00657C',
                                      }
                                    : undefined
                                }
                              >
                                <PoliticianCard
                                  id={candidate.candidate_id}
                                  imageSrc={candidate.photo_url || undefined}
                                  name={candidate.full_name}
                                  title={race.position_name}
                                  subtitle={
                                    candidate.is_incumbent
                                      ? 'Incumbent'
                                      : undefined
                                  }
                                  onClick={() =>
                                    onCandidateClick(candidate.candidate_id)
                                  }
                                  variant="vertical"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </CategorySection>
                  ))}
                </div>
              );
            })}
          </div>
        );
      })}

      {/* Incumbent badge color override */}
      <style>{`
        .incumbent-card .ev-politician-card p:last-child {
          color: #00657C;
        }
      `}</style>
    </div>
  );
}
