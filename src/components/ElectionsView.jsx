import { useMemo } from 'react';
import { CategorySection, PoliticianCard } from '@chrisandrewsedu/ev-ui';
import IconOverlay from './IconOverlay';
import { getBranch } from '../utils/branchType';

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

/** Word-number mapping for ordinal district names */
const WORD_TO_NUM = {
  first: 1, second: 2, third: 3, fourth: 4, fifth: 5,
  sixth: 6, seventh: 7, eighth: 8, ninth: 9, tenth: 10,
  eleventh: 11, twelfth: 12, thirteenth: 13, fourteenth: 14, fifteenth: 15,
  sixteenth: 16, seventeenth: 17, eighteenth: 18, nineteenth: 19, twentieth: 20,
};

/** Normalize position names for consistent display.
 *  - Strips leading zeros: "District 060" → "District 60"
 *  - Abbreviates federal titles: "United States Representative" → "US Representative"
 *  - Converts ordinal words: "Ninth District" → "District 9"  */
export function cleanPositionName(name) {
  if (!name) return name;
  let cleaned = name;
  // Strip leading zeros from district numbers
  cleaned = cleaned.replace(/District\s+0+(\d+)/gi, 'District $1');
  // Abbreviate federal titles
  cleaned = cleaned.replace(/United States Representative/gi, 'US Representative');
  cleaned = cleaned.replace(/United States Senator/gi, 'US Senator');
  // Convert "Ninth District" → "District 9" (word-form ordinals)
  cleaned = cleaned.replace(
    /,?\s+(First|Second|Third|Fourth|Fifth|Sixth|Seventh|Eighth|Ninth|Tenth|Eleventh|Twelfth|Thirteenth|Fourteenth|Fifteenth|Sixteenth|Seventeenth|Eighteenth|Nineteenth|Twentieth)\s+District/gi,
    (_, word) => `, District ${WORD_TO_NUM[word.toLowerCase()]}`
  );
  return cleaned;
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

  // Pre-process elections: group races by tier then by position, shuffle candidates per party ballot
  const processedElections = useMemo(() => {
    if (!elections || elections.length === 0) return [];

    return elections.map((election) => {
      const isPrimary = election.election_type === 'primary';

      // Group races by tier, then by cleanedPosition within each tier
      const tierMap = {};
      for (const race of election.races) {
        const tier = getTier(race.district_type);
        if (!tierMap[tier]) tierMap[tier] = {};

        const cleaned = cleanPositionName(race.position_name);

        if (!tierMap[tier][cleaned]) {
          tierMap[tier][cleaned] = {
            cleanedPosition: cleaned,
            districtType: race.district_type,
            parties: [],
          };
        }

        // Each race entry is one party's ballot (for primaries) or the full field (for generals)
        tierMap[tier][cleaned].parties.push({
          party: isPrimary && race.primary_party ? race.primary_party : null,
          shuffledCandidates: seededShuffle(race.candidates, sessionSeed),
          raceId: race.race_id,
        });
      }

      // Convert nested objects to arrays for rendering
      const tierPositions = {};
      for (const [tier, positions] of Object.entries(tierMap)) {
        tierPositions[tier] = Object.values(positions);
      }

      return { ...election, tierPositions };
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
              const positions = election.tierPositions[tier];
              if (!positions || positions.length === 0) return null;

              // Map tier name to tier prop value for CategorySection hue differentiation
              const tierPropMap = { Federal: 'federal', State: 'state', Local: 'local' };
              const tierProp = tierPropMap[tier] || undefined;

              return (
                <div key={tier}>
                  <div className="flex items-center gap-4 mb-4">
                    <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                      {tier}
                    </span>
                    <hr className="flex-1 border-gray-200" />
                  </div>

                  {positions.map((posGroup) => (
                    <CategorySection
                      key={posGroup.cleanedPosition}
                      title={posGroup.cleanedPosition}
                      tier={tierProp}
                    >
                      {posGroup.parties.map((partyGroup) => (
                        <div key={partyGroup.raceId}>
                          {/* Party sub-label for primaries — lightweight gray text, not a section header */}
                          {partyGroup.party && (
                            <p
                              className="text-sm text-gray-500 mt-2 mb-1 ml-1"
                              style={{ fontFamily: "'Manrope', sans-serif" }}
                            >
                              {partyGroup.party} Primary
                            </p>
                          )}
                          {partyGroup.shuffledCandidates.map((candidate) => {
                            const branch = getBranch(posGroup.districtType, posGroup.cleanedPosition);
                            // All election candidates are on the ballot by definition
                            const elDate = new Date(election.election_date + 'T12:00:00');
                            const ballot = { onBallot: true, termEndDate: elDate, electionDate: elDate, electionLabel: election.election_type === 'primary' ? 'Primary' : 'General' };
                            const hasStances = false; // Candidates typically lack stances data

                            return (
                              <div key={candidate.candidate_id}>
                                <PoliticianCard
                                  id={candidate.candidate_id}
                                  imageSrc={candidate.photo_url || undefined}
                                  imageFocalPoint={candidate.focal_point || 'center 20%'} // TODO: wire focal_point when elections API includes it
                                  name={candidate.full_name}
                                  title={posGroup.cleanedPosition}
                                  onClick={() => onCandidateClick(candidate.candidate_id)}
                                  variant="horizontal"
                                  footer={<IconOverlay ballot={ballot} hasStances={hasStances} branch={branch} />}
                                />
                              </div>
                            );
                          })}
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

    </div>
  );
}
