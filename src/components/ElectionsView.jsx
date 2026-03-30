import { useMemo } from 'react';
import { PoliticianCard } from '@chrisandrewsedu/ev-ui';
import { classifyCategory } from '../lib/classify';

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

/** Strip leading zeros from district numbers in position names.
 *  "State Representative, District 060" → "State Representative, District 60" */
function cleanPositionName(name) {
  if (!name) return name;
  return name.replace(/District\s+0+(\d+)/gi, 'District $1');
}

/**
 * Split a position name into title and district subtitle.
 * "State Representative, District 60" → { title: "State Representative", subtitle: "District 60" }
 * "United States Representative, Ninth District" → { title: "U.S. Representative", subtitle: "Ninth District" }
 */
function splitPosition(name) {
  if (!name) return { title: name, subtitle: undefined };
  const cleaned = cleanPositionName(name);

  // Try comma split: "State Representative, District 60"
  const commaIdx = cleaned.indexOf(',');
  if (commaIdx > 0) {
    return {
      title: cleaned.slice(0, commaIdx).trim(),
      subtitle: cleaned.slice(commaIdx + 1).trim(),
    };
  }

  return { title: cleaned, subtitle: undefined };
}

/** Map district_type to tier name for section headers */
function getTier(districtType) {
  if (!districtType) return 'Other';
  if (districtType.startsWith('NATIONAL')) return 'Federal';
  if (districtType.startsWith('STATE')) return 'State';
  return 'Local';
}

/** Tier display order */
const TIER_ORDER = ['Local', 'State', 'Federal', 'Other'];

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

  // Pre-process elections: group races by tier, shuffle candidates
  const processedElections = useMemo(() => {
    if (!elections || elections.length === 0) return [];

    return elections.map((election) => {
      // Group races by tier
      const tierMap = {};

      for (const race of election.races) {
        const tier = getTier(race.district_type);
        if (!tierMap[tier]) tierMap[tier] = [];
        tierMap[tier].push({
          ...race,
          shuffledCandidates: seededShuffle(race.candidates, sessionSeed),
        });
      }

      return { ...election, tierMap };
    });
  }, [elections, sessionSeed]);

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        {[0, 1].map((i) => (
          <div key={i} className="mb-6 animate-pulse">
            <div className="h-5 bg-gray-200 rounded w-48 mb-4" />
            <div className="space-y-3">
              {[0, 1, 2].map((j) => (
                <div key={j} className="flex items-center gap-3 py-2">
                  <div className="w-16 h-16 rounded-full bg-gray-200 flex-shrink-0" />
                  <div className="flex-1 flex flex-col gap-2">
                    <div className="h-4 bg-gray-200 rounded w-2/3" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                  </div>
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
            {TIER_ORDER.map((tier) => {
              const races = election.tierMap[tier];
              if (!races || races.length === 0) return null;

              return (
                <div key={tier} className="mb-6">
                  <div className="flex items-center gap-4 mb-4">
                    <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                      {tier}
                    </span>
                    <hr className="flex-1 border-gray-200" />
                  </div>

                  {races.map((race) => {
                    const { title, subtitle } = splitPosition(race.position_name);

                    return (
                      <div key={race.race_id} className="mb-6">
                        {/* Race position header */}
                        <p className="text-[14px] font-semibold text-[#4A5568] mb-1">
                          {title}
                          {subtitle && (
                            <span className="font-normal text-[#718096]">
                              {' '}
                              — {subtitle}
                            </span>
                          )}
                          {race.seats > 1 && (
                            <span className="font-normal text-[#718096]">
                              {' '}
                              · {race.seats} seats
                            </span>
                          )}
                        </p>

                        {/* Candidate cards — horizontal, same as Representatives tab */}
                        {race.shuffledCandidates.map((candidate) => (
                          <div
                            key={candidate.candidate_id}
                            className={
                              candidate.is_incumbent ? 'incumbent-card' : ''
                            }
                          >
                            <PoliticianCard
                              id={candidate.politician_id || candidate.candidate_id}
                              imageSrc={candidate.photo_url || undefined}
                              name={candidate.full_name}
                              title={title}
                              subtitle={
                                candidate.is_incumbent
                                  ? subtitle
                                    ? `${subtitle} · Incumbent`
                                    : 'Incumbent'
                                  : subtitle || undefined
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
                      </div>
                    );
                  })}
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
