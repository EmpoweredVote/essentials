import { useMemo, useState } from 'react';
import {
  useFloating, useHover, useFocus, useDismiss, useRole, useInteractions,
  FloatingPortal, offset, flip, shift, autoUpdate,
} from '@floating-ui/react';
import { GovernmentBodySection, SubGroupSection, PoliticianCard, tierColors, pillars } from '@empoweredvote/ev-ui';
import IconOverlay from './IconOverlay';
import { getBranch } from '../utils/branchType';
import { getOfficeDescription } from '../utils/officeDescriptions';

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

/** Derive card title and subtitle from a race position name.
 *  e.g., "Judge of the Monroe Circuit Court, 10th Judicial Circuit, No. 5"
 *    → title: "Indiana Circuit Court Judge", subtitle: "10th Circuit, Division 5"
 *  e.g., "State Representative, District 60"
 *    → title: "State Representative", subtitle: "District 60"
 */
function deriveCardTitleSubtitle(positionName, districtType) {
  const pos = positionName || '';

  // Judicial positions
  if (districtType === 'JUDICIAL') {
    const circuitMatch = pos.match(/(\d+)(?:st|nd|rd|th)\s+(?:Judicial\s+)?Circuit/i);
    const divMatch = pos.match(/No\.\s*(\d+)/i) || pos.match(/Division\s*(\d+)/i);
    const circuit = circuitMatch ? `${circuitMatch[1]}th Circuit` : '';
    const division = divMatch ? `Division ${divMatch[1]}` : '';
    const subtitle = [circuit, division].filter(Boolean).join(', ');
    return { title: 'Indiana Circuit Court Judge', subtitle: subtitle || undefined };
  }

  // Positions with comma-separated district: "State Representative, District 60"
  const commaIdx = pos.indexOf(', ');
  if (commaIdx > 0) {
    return { title: pos.slice(0, commaIdx), subtitle: pos.slice(commaIdx + 2) };
  }

  return { title: pos, subtitle: undefined };
}

/** Map district_type to tier name */
function getTier(districtType) {
  if (!districtType) return 'Other';
  if (districtType.startsWith('NATIONAL')) return 'Federal';
  if (districtType.startsWith('STATE')) return 'State';
  return 'Local';
}

/** Derive government body accordion key and sub-group label from a race's position and district type */
function deriveBodyAndSubGroup(positionName, districtType) {
  const pos = positionName || '';
  const dt = districtType || '';

  // Federal — each office is its own body (like Local) to enable per-office ordering
  if (dt.startsWith('NATIONAL')) {
    return { body: pos, subgroup: pos };
  }

  // State — each office is its own body to enable per-office ordering
  if (dt.startsWith('STATE')) {
    return { body: pos, subgroup: pos };
  }

  // Judicial - derive court name from position
  // e.g., "Judge of the Monroe Circuit Court, 10th Judicial Circuit, No. 5"
  //   → body: "Monroe Circuit Court", subgroup: "Judge, Division 5"
  if (dt === 'JUDICIAL') {
    const courtMatch = pos.match(/^(?:Judge of the\s+)?(.+?Court)/i);
    const divisionMatch = pos.match(/No\.\s*(\d+)/i) || pos.match(/Division\s*(\d+)/i) || pos.match(/Seat\s*(\d+)/i);
    const body = courtMatch ? courtMatch[1] : 'Courts';
    const subgroup = divisionMatch ? `Judge, Division ${divisionMatch[1]}` : 'Judge';
    return { body, subgroup };
  }

  // County
  if (dt === 'COUNTY') {
    const countyMatch = pos.match(/^(.+?\s+County)\s+(.+)$/i);
    if (countyMatch) {
      return { body: countyMatch[1], subgroup: countyMatch[2] };
    }
    return { body: pos, subgroup: pos };
  }

  // Local/Township
  if (dt === 'LOCAL' || dt === 'LOCAL_EXEC') {
    const townshipMatch = pos.match(/^(.+?\s+Township)\s+(.+)$/i);
    if (townshipMatch) {
      return { body: townshipMatch[1], subgroup: townshipMatch[2] };
    }
    return { body: pos, subgroup: pos };
  }

  // School
  if (dt === 'SCHOOL') {
    return { body: pos, subgroup: pos };
  }

  return { body: 'Other', subgroup: pos };
}

/** Small ⓘ icon that shows the office's responsibilities on hover */
function RoleInfoTooltip({ description }) {
  const [isOpen, setIsOpen] = useState(false);
  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    middleware: [offset(6), flip(), shift({ padding: 6 })],
    whileElementsMounted: autoUpdate,
  });
  const hover = useHover(context);
  const focus = useFocus(context);
  const dismiss = useDismiss(context);
  const role = useRole(context, { role: 'tooltip' });
  const { getReferenceProps, getFloatingProps } = useInteractions([hover, focus, dismiss, role]);

  return (
    <>
      <span
        ref={refs.setReference}
        tabIndex={0}
        aria-label="About this office"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          cursor: 'default',
          opacity: 0.5,
          textTransform: 'none',
          letterSpacing: 'normal',
          lineHeight: 1,
          marginLeft: '3px',
          verticalAlign: 'middle',
        }}
        {...getReferenceProps()}
      >
        <svg width="10" height="10" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
          <rect x="7.25" y="7" width="1.5" height="5" rx="0.75" fill="currentColor" />
          <rect x="7.25" y="4" width="1.5" height="1.5" rx="0.75" fill="currentColor" />
        </svg>
      </span>
      {isOpen && (
        <FloatingPortal>
          <div
            ref={refs.setFloating}
            style={{
              ...floatingStyles,
              zIndex: 70,
              background: '#2F3237',
              color: '#EBEDEF',
              padding: '8px 10px',
              borderRadius: '6px',
              fontSize: '13px',
              fontFamily: "'Manrope', sans-serif",
              pointerEvents: 'none',
              maxWidth: '260px',
              lineHeight: 1.45,
              textTransform: 'none',
              letterSpacing: 'normal',
              fontWeight: 400,
            }}
            {...getFloatingProps()}
          >
            {description}
          </div>
        </FloatingPortal>
      )}
    </>
  );
}

export default function ElectionsView({
  elections,
  loading,
  tierFilter = 'All',
  hideWithdrawn = false,
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

  // Pre-process elections: group races by tier → government body → sub-group (position + party)
  const processedElections = useMemo(() => {
    if (!elections || elections.length === 0) return [];

    return elections.map((election) => {
      const isPrimary = election.election_type === 'primary';

      // Build hierarchy: tier → body → subgroup (position + party)
      const tierMap = {}; // tier → { bodyKey → { races: [] } }

      for (const race of election.races) {
        const tier = getTier(race.district_type);
        const cleaned = cleanPositionName(race.position_name);
        const { body, subgroup } = deriveBodyAndSubGroup(cleaned, race.district_type);
        const party = isPrimary && race.primary_party ? race.primary_party : null;
        const subgroupKey = party ? `${subgroup}||${party}` : subgroup;
        const subgroupLabel = party ? `${subgroup} — ${party} Primary` : subgroup;

        if (!tierMap[tier]) tierMap[tier] = {};
        if (!tierMap[tier][body]) tierMap[tier][body] = { races: [] };

        tierMap[tier][body].races.push({
          key: subgroupKey,
          label: subgroupLabel,
          party,
          districtType: race.district_type,
          raceId: race.race_id,
          shuffledCandidates: seededShuffle(race.candidates, sessionSeed),
          cleanedPosition: cleaned,
        });
      }

      // Convert to ordered arrays
      const TIER_ORDER = ['Local', 'State', 'Federal', 'Other'];

      // Body ordering within tiers (same convention as representatives view)
      const bodyOrderScore = (bodyKey, tier) => {
        if (tier === 'Local') {
          const lower = bodyKey.toLowerCase();
          // City races first, ordered by importance to the voter
          if (lower.includes('mayor')) return 0;
          if (lower.includes('council') && !lower.includes('county')) return 1;
          // Other city offices (attorney, controller, clerk, etc.)
          if (!lower.includes('county') && !lower.includes('supervisors') &&
              !lower.includes('township') && !lower.includes('school') &&
              !lower.includes('education') && !lower.includes('court')) return 2;
          // Sub-city bodies
          if (lower.includes('township')) return 4;
          if (lower.includes('school') || lower.includes('education')) return 5;
          if ((lower.includes('county') || lower.includes('supervisors')) && !lower.includes('court')) return 6;
          if (lower.includes('court')) return 7;
          return 3;
        }
        if (tier === 'State') {
          const lower = bodyKey.toLowerCase();
          // Executive
          if (lower.includes('governor') && !lower.includes('lieutenant')) return 0;
          if (lower.includes('lieutenant governor')) return 1;
          if (lower.includes('attorney general')) return 4;
          if (lower.includes('secretary of state')) return 5;
          if (lower.includes('state treasurer')) return 6;
          if (lower.includes('state controller') || lower.includes('state comptroller')) return 7;
          if (lower.includes('state auditor')) return 8;
          if (lower.includes('insurance commissioner')) return 9;
          if (lower.includes('superintendent of public instruction') || lower.includes('superintendent of schools')) return 10;
          // Legislative
          if (lower.includes('state senate') || lower.includes('senate district')) return 2;
          if (lower.includes('assembly') || lower.includes('state house') || lower.includes('state representative')) return 3;
          // Judicial
          if (lower.includes('supreme court')) return 12;
          if (lower.includes('court of appeal') || lower.includes('appellate')) return 13;
          if (lower.includes('judge') || lower.includes('justice') || lower.includes('court')) return 14;
          return 11; // other statewide executive
        }
        if (tier === 'Federal') {
          const lower = bodyKey.toLowerCase();
          if (lower.includes('president')) return 0;
          if (lower.includes('senate') || lower.includes('senator')) return 1;
          if (lower.includes('representative') || lower.includes('house')) return 2;
          return 3;
        }
        return 0;
      };

      const BRANCH_ORDER = { Executive: 0, Legislative: 1, Judicial: 2 };

      const hierarchy = TIER_ORDER
        .filter(tier => tierMap[tier])
        .map(tier => ({
          tier,
          bodies: Object.entries(tierMap[tier])
            .map(([bodyKey, { races }]) => {
              const sortedRaces = races.sort((a, b) => {
                const branchA = getBranch(a.districtType, a.cleanedPosition) ?? 'Legislative';
                const branchB = getBranch(b.districtType, b.cleanedPosition) ?? 'Legislative';
                const bScore = (BRANCH_ORDER[branchA] ?? 1) - (BRANCH_ORDER[branchB] ?? 1);
                if (bScore !== 0) return bScore;
                return a.label.localeCompare(b.label);
              });
              const firstRace = sortedRaces[0];
              const branch = firstRace
                ? getBranch(firstRace.districtType, firstRace.cleanedPosition)
                : null;
              return { key: bodyKey, title: bodyKey, branch, races: sortedRaces };
            })
            .sort((a, b) => {
              // Sort by branch first (Executive → Legislative → Judicial)
              const ba = BRANCH_ORDER[a.branch] ?? 3;
              const bb = BRANCH_ORDER[b.branch] ?? 3;
              if (ba !== bb) return ba - bb;
              // Then by office priority within branch
              const sa = bodyOrderScore(a.key, tier);
              const sb = bodyOrderScore(b.key, tier);
              if (sa !== sb) return sa - sb;
              return a.key.localeCompare(b.key);
            }),
        }));

      return { ...election, hierarchy };
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
            {election.hierarchy
              .filter(({ tier }) => tierFilter === 'All' || tier === tierFilter)
              .map(({ tier, bodies }) => {
              const tierKey = tier.toLowerCase();
              const tierStyle = tierColors[tierKey];
              if (!tierStyle) return null;

              return (
                <div key={tier} className="-mx-4 md:-mx-8 px-4 md:px-8 py-3" style={{ backgroundColor: tierStyle.bg }}>
                  <div className="mb-3">
                    <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: tierStyle.text }}>{tier}</span>
                  </div>

                  {(() => {
                    // Group consecutive bodies by branch for visual separation
                    const branchGroups = [];
                    for (const body of bodies) {
                      const b = body.branch || 'Other';
                      const last = branchGroups[branchGroups.length - 1];
                      if (last && last.branch === b) {
                        last.bodies.push(body);
                      } else {
                        branchGroups.push({ branch: b, bodies: [body] });
                      }
                    }
                    const showBranchHeaders = branchGroups.length > 1;
                    return branchGroups.map(({ branch, bodies: branchBodies }, groupIdx) => (
                      <div key={branch}>
                        {showBranchHeaders && (
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginTop: groupIdx > 0 ? '16px' : '0',
                            marginBottom: '6px',
                          }}>
                            <span style={{
                              fontSize: '10px',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              letterSpacing: '0.6px',
                              color: tierStyle.text,
                              opacity: 0.75,
                            }}>
                              {branch}
                            </span>
                            <div style={{
                              flex: 1,
                              height: '1px',
                              backgroundColor: tierStyle.text,
                              opacity: 0.2,
                            }} />
                          </div>
                        )}
                        {branchBodies.map((body) => (
                          <GovernmentBodySection
                            key={body.key}
                            title={body.title}
                            tier={tierKey}
                          >
                      {body.races.map((race, raceIdx) => {
                        const activeCandidates = race.shuffledCandidates.filter(
                          (c) => c.candidate_status !== 'withdrawn'
                        );
                        const displayCandidates = hideWithdrawn
                          ? activeCandidates
                          : race.shuffledCandidates;
                        const isUnopposed = activeCandidates.length === 1;
                        const isEmpty = displayCandidates.length === 0;

                        return (
                          <div
                            key={race.key}
                            style={{
                              backgroundColor: raceIdx % 2 === 1 ? 'rgba(0,0,0,0.03)' : 'transparent',
                              borderRadius: '6px',
                              padding: raceIdx % 2 === 1 ? '4px 6px' : '0',
                            }}
                          >
                            <SubGroupSection
                              title={(() => {
                                const desc = getOfficeDescription(race.cleanedPosition);
                                if (!desc) return race.label;
                                return (
                                  <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                                    {race.label}
                                    <RoleInfoTooltip description={desc} />
                                  </span>
                                );
                              })()}
                            >
                              {isEmpty ? (
                                <div
                                  style={{
                                    backgroundColor: pillars.empower.light,
                                    borderLeft: `3px solid ${pillars.empower.textColor}`,
                                    borderRadius: '6px',
                                    padding: '12px 16px',
                                  }}
                                >
                                  <p style={{ fontSize: '14px', fontWeight: 600, color: '#1C1C1C', margin: 0 }}>
                                    No candidates have filed
                                  </p>
                                  <p style={{ fontSize: '13px', color: '#6B7280', marginTop: '4px', marginBottom: 0 }}>
                                    This seat is currently uncontested.
                                  </p>
                                </div>
                              ) : (
                                displayCandidates.map((candidate) => {
                                  const branch = getBranch(race.districtType, race.cleanedPosition);
                                  const elDate = new Date(election.election_date + 'T12:00:00');
                                  const ballot = {
                                    onBallot: true,
                                    termEndDate: elDate,
                                    electionDate: elDate,
                                    electionLabel: election.election_type === 'primary' ? 'Primary' : 'General',
                                  };
                                  const { title: cardTitle, subtitle: cardSubtitle } = deriveCardTitleSubtitle(race.cleanedPosition, race.districtType);

                                  return (
                                    <div key={candidate.candidate_id} style={{ position: 'relative' }}>
                                      <PoliticianCard
                                        id={candidate.candidate_id}
                                        imageSrc={candidate.photo_url || undefined}
                                        imageFocalPoint={candidate.focal_point || 'center 20%'}
                                        name={candidate.full_name}
                                        title={cardTitle}
                                        subtitle={cardSubtitle}
                                        onClick={() => onCandidateClick(candidate.candidate_id)}
                                        variant="horizontal"
                                        footer={<IconOverlay ballot={ballot} hasStances={false} branch={branch} />}
                                      />
                                      {candidate.candidate_status === 'withdrawn' && (
                                        <div
                                          style={{
                                            position: 'absolute',
                                            bottom: 0,
                                            left: '0',
                                            width: '64px',
                                            backgroundColor: 'rgba(120,0,0,0.78)',
                                            color: '#fff',
                                            fontSize: '8px',
                                            fontWeight: 700,
                                            letterSpacing: '0.4px',
                                            textAlign: 'center',
                                            textTransform: 'uppercase',
                                            padding: '3px 0',
                                            pointerEvents: 'none',
                                          }}
                                        >
                                          Withdrawn
                                        </div>
                                      )}
                                      {isUnopposed && candidate.candidate_status !== 'withdrawn' && (
                                        <div
                                          style={{
                                            position: 'absolute',
                                            bottom: '8px',
                                            left: '0',
                                            width: '64px',
                                            backgroundColor: 'rgba(0,0,0,0.55)',
                                            color: '#fff',
                                            fontSize: '8px',
                                            fontWeight: 700,
                                            letterSpacing: '0.4px',
                                            textAlign: 'center',
                                            textTransform: 'uppercase',
                                            padding: '3px 0',
                                            pointerEvents: 'none',
                                          }}
                                        >
                                          Unopposed
                                        </div>
                                      )}
                                    </div>
                                  );
                                })
                              )}
                            </SubGroupSection>
                          </div>
                        );
                      })}
                          </GovernmentBodySection>
                        ))}
                      </div>
                    ));
                  })()}
                </div>
              );
            })}
          </div>
        );
      })}

    </div>
  );
}
