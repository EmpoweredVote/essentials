import { useMemo } from 'react';
import { CategorySection, PoliticianCard } from '@chrisandrewsedu/ev-ui';

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

/** Strip leading zeros from district numbers.
 *  "State Representative, District 060" → "State Representative, District 60" */
function cleanPositionName(name) {
  if (!name) return name;
  return name.replace(/District\s+0+(\d+)/gi, 'District $1');
}

/** Map district_type to tier name */
function getTier(districtType) {
  if (!districtType) return 'Other';
  if (districtType.startsWith('NATIONAL')) return 'Federal';
  if (districtType.startsWith('STATE')) return 'State';
  return 'Local';
}

const TIER_ORDER = ['Local', 'State', 'Federal', 'Other'];

export default function ElectionsView({
  elections,
  loading,
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

  // Pre-process elections: group races by tier, shuffle candidates
  const processedElections = useMemo(() => {
    if (!elections || elections.length === 0) return [];

    return elections.map((election) => {
      const isPrimary = election.election_type === 'primary';

      // Group races by tier — keep separate (primaries have distinct party ballots)
      const tierMap = {};
      for (const race of election.races) {
        const tier = getTier(race.district_type);
        if (!tierMap[tier]) tierMap[tier] = [];

        // Build display title: position name + party ballot label for primaries
        const cleaned = cleanPositionName(race.position_name);
        const ballotLabel =
          isPrimary && race.primary_party
            ? `${cleaned} — ${race.primary_party} Primary`
            : cleaned;

        tierMap[tier].push({
          ...race,
          displayTitle: ballotLabel,
          cleanedPosition: cleaned,
          shuffledCandidates: seededShuffle(race.candidates, sessionSeed),
        });
      }

      return { ...election, tierMap };
    });
  }, [elections, sessionSeed]);

  // Loading state — matches SkeletonSection from Results.jsx
  if (loading) {
    return (
      <div>
        {[0, 1].map((i) => (
          <div key={i} className="mb-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-24 mb-4" />
            <div className="flex items-center gap-3 py-2">
              <div className="w-16 h-16 rounded-full bg-gray-200 flex-shrink-0" />
              <div className="flex-1 flex flex-col gap-2">
                <div className="h-4 bg-gray-200 rounded w-2/3" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
            <div className="flex items-center gap-3 py-2">
              <div className="w-16 h-16 rounded-full bg-gray-200 flex-shrink-0" />
              <div className="flex-1 flex flex-col gap-2">
                <div className="h-4 bg-gray-200 rounded w-2/3" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
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
    <div>
      {processedElections.map((election) => {
        const days = daysUntil(election.election_date);
        const dateStr = formatDate(election.election_date);

        return (
          <div key={election.election_id} className="mb-8">
            {/* Election header — prominent date + countdown */}
            <div className="mb-6">
              <h2 className="text-[18px] font-semibold text-[#00657C] mb-1">
                {election.election_name}
              </h2>
              <p className="text-[15px]">
                <span className="font-semibold text-[#2D3748]">{dateStr}</span>
                {days > 0 && days < 60 && (
                  <span
                    className="ml-2 inline-block px-2 py-0.5 rounded-full text-[13px] font-semibold"
                    style={{ backgroundColor: '#FED12E', color: '#5A4B00' }}
                  >
                    {days} days away
                  </span>
                )}
              </p>
            </div>

            {/* Tier sections: Local > State > Federal */}
            {TIER_ORDER.map((tier) => {
              const positions = election.tierMap[tier];
              if (!positions || positions.length === 0) return null;

              return (
                <div key={tier}>
                  <div className="flex items-center gap-4 mb-4">
                    <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                      {tier}
                    </span>
                    <hr className="flex-1 border-gray-200" />
                  </div>

                  {positions.map((pos) => (
                    <CategorySection key={pos.race_id} title={pos.displayTitle}>
                      {pos.shuffledCandidates.map((candidate) => (
                        <div
                          key={candidate.candidate_id}
                          className={candidate.is_incumbent ? 'incumbent-card' : ''}
                        >
                          <PoliticianCard
                            id={candidate.politician_id || candidate.candidate_id}
                            imageSrc={candidate.photo_url || undefined}
                            name={candidate.full_name}
                            title={pos.cleanedPosition}
                            subtitle={
                              candidate.is_incumbent ? 'Incumbent' : undefined
                            }
                            onClick={() =>
                              onCandidateClick(
                                candidate.politician_id || candidate.candidate_id,
                                !!candidate.politician_id
                              )
                            }
                            variant="horizontal"
                          />
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
