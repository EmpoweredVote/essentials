import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { SiteHeader, CategorySection, PoliticianCard, useMediaQuery } from '@chrisandrewsedu/ev-ui';
import useGooglePlacesAutocomplete from '../hooks/useGooglePlacesAutocomplete';
import LocalFilterSidebar from '../components/LocalFilterSidebar';
import { usePoliticianData } from '../hooks/usePoliticianData';
import {
  classifyCategory,
  STATE_ORDER,
  FEDERAL_ORDER,
  LOCAL_ORDER,
  orderedEntries,
  getDisplayName,
} from '../lib/classify';
import { GROUP_SORT_OPTIONS } from '../utils/sorters';
import { getBuildingImages } from '../lib/buildingImages';
import { fetchCandidates } from '../lib/api';

/** Sort a polList using the default (first) sort option for its category */
function defaultSort(category, polList) {
  const opts = GROUP_SORT_OPTIONS[category];
  if (!opts || opts.length === 0) return polList;
  return [...polList].sort(opts[0].cmp('asc'));
}

function getImageUrl(pol) {
  if (pol.images && pol.images.length > 0) {
    const defaultImg = pol.images.find((img) => img.type === 'default');
    return defaultImg ? defaultImg.url : pol.images[0].url;
  }
  return pol.photo_origin_url;
}

function formatElectionDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

/** Loading skeleton for a single politician card row */
function SkeletonCard() {
  return (
    <div className="flex items-center gap-3 py-2 animate-pulse">
      <div className="w-16 h-16 rounded-full bg-gray-200 flex-shrink-0" />
      <div className="flex-1 flex flex-col gap-2">
        <div className="h-4 bg-gray-200 rounded w-2/3" />
        <div className="h-3 bg-gray-200 rounded w-1/2" />
      </div>
    </div>
  );
}

/** Loading skeleton for a tier section with header + cards */
function SkeletonSection() {
  return (
    <div className="mb-6 animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-24 mb-4" />
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </div>
  );
}

/** Render a politician or candidate card with election date below for candidates */
function renderPoliticianCard(pol, handlePoliticianClick) {
  const isCandidate = pol.is_candidate;

  // Strip "(Retain Name?)" from BallotReady retention election artifacts
  const stripRetain = (s) => (s || '').replace(/\s*\(Retain\s+.+?\?\)/, '');
  const cleanTitle = stripRetain(pol.office_title);
  const cleanChamber = stripRetain(pol.chamber_name);

  // Split office_title on " - " to separate body from seat designation
  // e.g., "Bloomington City Common Council - At Large" → title: "...Council", subtitle: "At Large"
  // Always prefer the dash-split over chamber_name (which may equal office_title for LOCAL)
  const dashIdx = cleanTitle.lastIndexOf(' - ');

  const cardTitle = dashIdx > 0
    ? cleanTitle.slice(0, dashIdx)
    : (cleanChamber || cleanTitle);

  const subtitle = (() => {
    if (dashIdx > 0) return cleanTitle.slice(dashIdx + 3);
    // Only show "District N" for actual numbered districts;
    // suppress geographic names like "CA", "UNITED STATES", "Indiana"
    if (cleanChamber && pol.district_id && /^\d+$/.test(pol.district_id))
      return `District ${pol.district_id}`;
    return undefined;
  })();

  return (
    <div key={pol.id}>
      <PoliticianCard
        id={pol.id}
        imageSrc={getImageUrl(pol)}
        name={`${pol.first_name} ${pol.last_name}`}
        title={cardTitle}
        subtitle={subtitle}
        badge={isCandidate ? 'Candidate' : undefined}
        onClick={isCandidate ? undefined : () => handlePoliticianClick(pol.id)}
        variant="horizontal"
      />
      {isCandidate && pol.election_date && (
        <p style={{
          fontFamily: "'Manrope', sans-serif",
          fontSize: '12px',
          color: '#ff5740',
          fontWeight: 600,
          margin: '2px 0 0 92px',
          lineHeight: 1.2,
        }}>
          {formatElectionDate(pol.election_date)}
          {pol.election_name ? ` \u2014 ${pol.election_name}` : ''}
        </p>
      )}
    </div>
  );
}

export default function Results() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryFromUrl = searchParams.get('q') || '';

  // Address bar state
  const [addressInput, setAddressInput] = useState(
    queryFromUrl ? decodeURIComponent(queryFromUrl) : ''
  );
  const [hasValidSelection, setHasValidSelection] = useState(!!queryFromUrl);
  const [showSelectionHint, setShowSelectionHint] = useState(false);

  const addressInputRef = useRef(null);
  const mainRef = useRef(null);

  // Detect desktop breakpoint for two-panel layout
  const isDesktop = useMediaQuery('(min-width: 769px)');

  const { loadError } = useGooglePlacesAutocomplete(addressInputRef, {
    onPlaceSelected: (formattedAddress) => {
      setAddressInput(formattedAddress);
      setHasValidSelection(true);
      setShowSelectionHint(false);
      setCachedResult(null);
      sessionStorage.removeItem('ev:results');
      // Do NOT navigate yet — user must click Search
    },
  });

  // Attempt sessionStorage restore for back-navigation
  const [cachedResult, setCachedResult] = useState(() => {
    if (!queryFromUrl) return null;
    try {
      const cached = sessionStorage.getItem('ev:results');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.query === queryFromUrl && Date.now() - parsed.timestamp < 600000) {
          return parsed;
        }
      }
    } catch { /* ignore */ }
    return null;
  });

  // Wire up the hook with sessionStorage gating
  const activeQuery = queryFromUrl;
  const {
    data: hookData,
    phase: hookPhase,
    error,
    formattedAddress,
  } = usePoliticianData(activeQuery, {
    enabled: !!activeQuery && !cachedResult,
    initialData: [],
  });

  // Sync backend-validated formatted address into address bar
  useEffect(() => {
    if (formattedAddress) {
      setAddressInput(formattedAddress);
      setHasValidSelection(true);
    }
  }, [formattedAddress]);

  // Derive actual data and phase from cache or hook
  const list = cachedResult ? cachedResult.list : hookData;
  const phase = cachedResult ? 'fresh' : hookPhase;

  // Initialize selectedFilter from cache if available
  const [selectedFilter, setSelectedFilter] = useState(
    cachedResult?.filter || 'All'
  );

  const [searchQuery, setSearchQuery] = useState('');

  // Scroll-spy tier tracking for building image swap
  const [scrollActiveTier, setScrollActiveTier] = useState('Local');

  // Candidate toggle state
  const [showCandidates, setShowCandidates] = useState(false);
  const [candidateData, setCandidateData] = useState([]);
  const [candidatesLoading, setCandidatesLoading] = useState(false);

  // Save results to sessionStorage for back-navigation restoration
  useEffect(() => {
    if (list.length > 0 && phase === 'fresh') {
      if (queryFromUrl) {
        sessionStorage.setItem('ev:results', JSON.stringify({
          query: queryFromUrl,
          list,
          filter: selectedFilter,
          timestamp: Date.now(),
        }));
      }
    }
  }, [list, phase, selectedFilter, queryFromUrl]);

  // Fetch candidates only when toggle is on
  useEffect(() => {
    if (!showCandidates || !activeQuery) {
      setCandidateData([]);
      return;
    }

    let cancelled = false;
    setCandidatesLoading(true);

    fetchCandidates(activeQuery).then((data) => {
      if (!cancelled) {
        setCandidateData(data || []);
        setCandidatesLoading(false);
      }
    });

    return () => { cancelled = true; };
  }, [showCandidates, activeQuery]);

  // Address bar handlers
  const handleInputChange = (e) => {
    setAddressInput(e.target.value);
    setHasValidSelection(false);
    setShowSelectionHint(false);
  };

  const handleAddressSearch = () => {
    if (!hasValidSelection) {
      setShowSelectionHint(true);
      return;
    }
    setCachedResult(null);
    sessionStorage.removeItem('ev:results');
    setSearchParams({ q: addressInput });
  };

  // Filter and classify
  const filteredPols = useMemo(
    () => list.filter((p) => p?.first_name !== 'VACANT'),
    [list]
  );

  // Derive representing city for building image selection
  const representingCity = useMemo(() => {
    for (const p of filteredPols) {
      if (p.representing_city) return p.representing_city;
    }
    // Fallback: extract city name from local politicians' chamber_name
    for (const p of filteredPols) {
      const dt = p?.district_type || '';
      if (dt === 'LOCAL' && p.chamber_name) {
        const match = p.chamber_name.match(/^(\w[\w\s]+?)\s+City\b/);
        if (match) return match[1];
      }
    }
    return null;
  }, [filteredPols]);

  const buildingImageMap = useMemo(
    () => getBuildingImages(representingCity),
    [representingCity]
  );

  // Determine user's state from state or local politicians
  const userState = useMemo(() => {
    for (const p of filteredPols) {
      const dt = p?.district_type || '';
      if (dt.includes('STATE') || dt.includes('LOCAL') || dt === 'COUNTY' || dt === 'SCHOOL') {
        if (p.representing_state) return p.representing_state.toUpperCase();
      }
    }
    return null;
  }, [filteredPols]);

  // Filter federal politicians: only show senators/reps from user's state
  const federalFiltered = useMemo(() => {
    if (!userState) return filteredPols;
    return filteredPols.filter((p) => {
      const dt = p?.district_type;
      if (!dt?.includes('NATIONAL')) return true;
      if (dt === 'NATIONAL_EXEC') return true;
      if (dt === 'NATIONAL_UPPER' || dt === 'NATIONAL_LOWER') {
        return p.representing_state?.toUpperCase() === userState;
      }
      return true;
    });
  }, [filteredPols, userState]);

  const classified = useMemo(
    () => federalFiltered.map((p) => ({ pol: p, cat: classifyCategory(p) })),
    [federalFiltered]
  );

  // Classify candidates (only when toggle is on)
  const classifiedCandidates = useMemo(() => {
    if (!showCandidates || candidateData.length === 0) return [];
    return candidateData.map((c) => ({
      pol: { ...c, id: `candidate-${c.external_id}` },
      cat: classifyCategory(c),
    }));
  }, [showCandidates, candidateData]);

  const byTier = useMemo(() => {
    const map = { Local: {}, State: {}, Federal: {}, Unknown: {} };
    const seen = new Set();

    for (const { pol, cat } of classified) {
      // Deduplicate by name + office to handle same person with different external IDs
      const key = `${pol.first_name}-${pol.last_name}-${pol.office_title}-${cat.group}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const tier = map[cat.tier] ? cat.tier : 'Unknown';
      if (!map[tier][cat.group]) map[tier][cat.group] = [];
      map[tier][cat.group].push(pol);
    }

    for (const { pol, cat } of classifiedCandidates) {
      const key = `${pol.first_name}-${pol.last_name}-${pol.office_title}-${cat.group}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const tier = map[cat.tier] ? cat.tier : 'Unknown';
      if (!map[tier][cat.group]) map[tier][cat.group] = [];
      map[tier][cat.group].push(pol);
    }

    return map;
  }, [classified, classifiedCandidates]);

  // Filter by selected level
  const displayedPoliticians = useMemo(() => {
    if (selectedFilter === 'All') {
      return byTier;
    }
    return {
      [selectedFilter]: byTier[selectedFilter] || {},
    };
  }, [byTier, selectedFilter]);

  // Search filter
  const searchFilteredPoliticians = useMemo(() => {
    if (!searchQuery.trim()) return displayedPoliticians;

    const query = searchQuery.toLowerCase();
    const result = {};

    Object.entries(displayedPoliticians).forEach(([tier, groups]) => {
      result[tier] = {};
      Object.entries(groups).forEach(([group, pols]) => {
        const filtered = pols.filter(
          (p) =>
            p.first_name?.toLowerCase().includes(query) ||
            p.last_name?.toLowerCase().includes(query) ||
            p.office_title?.toLowerCase().includes(query)
        );
        if (filtered.length > 0) {
          result[tier][group] = filtered;
        }
      });
    });

    return result;
  }, [displayedPoliticians, searchQuery]);

  // Location label
  const locationLabel = useMemo(() => {
    if (!filteredPols.length) return null;
    const sample = filteredPols[0];
    const city = sample.representing_city;
    const state = sample.representing_state;

    if (selectedFilter === 'State') {
      return state ? `${state}, USA` : null;
    }
    return city && state ? `${city}, ${state}` : null;
  }, [filteredPols, selectedFilter]);

  // Derive active building image based on filter or scroll-spy
  const activeBuildingImage =
    selectedFilter === 'All'
      ? buildingImageMap[scrollActiveTier] || buildingImageMap.Local
      : buildingImageMap[selectedFilter] || buildingImageMap.Federal;

  // Scroll-spy: swap building image as user scrolls between tier sections
  useEffect(() => {
    if (selectedFilter !== 'All') return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setScrollActiveTier(entry.target.dataset.tier);
          }
        }
      },
      {
        root: isDesktop ? mainRef.current : null,
        rootMargin: '-40% 0px -60% 0px',
        threshold: 0,
      }
    );

    const sections = document.querySelectorAll('[data-tier]');
    sections.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [selectedFilter, isDesktop, mainRef.current]);

  const handlePoliticianClick = (id) => {
    navigate(`/politician/${id}`);
  };

  return (
    <div className="min-h-screen bg-[var(--ev-bg-light)]">
      <SiteHeader logoSrc="/EVLogo.svg" />

      {/* Page body: two-panel layout filling viewport below SiteHeader */}
      <div
        style={{ height: 'calc(100vh - 75px)' }}
        className={isDesktop ? 'flex overflow-hidden' : 'flex flex-col'}
      >
        {/* Filter Sidebar — desktop only */}
        {isDesktop && (
          <LocalFilterSidebar
            selectedFilter={selectedFilter}
            onFilterChange={setSelectedFilter}
            locationLabel={locationLabel}
            buildingImageSrc={activeBuildingImage}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            showCandidates={showCandidates}
            onShowCandidatesChange={setShowCandidates}
            candidatesLoading={candidatesLoading}
          />
        )}

        {/* Main Content — independently scrollable on desktop */}
        <main
          ref={mainRef}
          className="flex-1"
          style={isDesktop ? { overflowY: 'auto', minWidth: 0 } : { overflowY: 'auto' }}
        >
          {/* Address Bar — inside scrollable content, not sticky */}
          <div className="px-4 sm:px-8 py-3 border-t border-gray-200 bg-[var(--ev-bg-light)]">
            <div className="flex gap-3">
              <input
                ref={addressInputRef}
                type="text"
                value={addressInput}
                onChange={handleInputChange}
                placeholder="Enter your address"
                disabled={loadError}
                className="flex-1 min-w-0 px-4 py-2 border border-gray-300 rounded-lg
                           focus:outline-none focus:ring-2 focus:ring-[var(--ev-teal)]
                           disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              <button
                onClick={handleAddressSearch}
                disabled={!addressInput.trim() || loadError}
                className="px-6 py-2 font-bold text-white bg-[var(--ev-teal)] rounded-lg
                           hover:bg-[var(--ev-teal-dark)] disabled:opacity-50 transition-colors"
              >
                Search
              </button>
            </div>

            {loadError && (
              <p className="mt-1 text-sm text-red-600">
                Address search is temporarily unavailable. Please try again later.
              </p>
            )}
            {showSelectionHint && !loadError && (
              <p className="mt-1 text-sm text-amber-700">
                Please select an address from the suggestions.
              </p>
            )}
          </div>

          {/* Mobile filter controls — shown only on mobile */}
          {!isDesktop && (
            <div className="px-4 py-3 bg-white border-b border-gray-200">
              {/* Tier filter pills */}
              <div className="flex gap-2 mb-3">
                {['All', 'Local', 'State', 'Federal'].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setSelectedFilter(filter)}
                    className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                      selectedFilter === filter
                        ? 'bg-[#00657c] text-white border-[#00657c]'
                        : 'bg-white text-gray-600 border-gray-300'
                    }`}
                    style={{ fontFamily: "'Manrope', sans-serif" }}
                  >
                    {filter}
                  </button>
                ))}
              </div>
              {/* Name search + Candidates toggle row */}
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <svg
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search representative"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg
                               focus:outline-none focus:ring-2 focus:ring-[var(--ev-teal)]"
                    style={{ fontFamily: "'Manrope', sans-serif" }}
                  />
                </div>
                <label
                  className="flex items-center gap-1.5 cursor-pointer select-none whitespace-nowrap"
                  style={{ fontFamily: "'Manrope', sans-serif", fontSize: '13px', color: '#718096' }}
                >
                  <input
                    type="checkbox"
                    checked={showCandidates}
                    onChange={(e) => setShowCandidates(e.target.checked)}
                    style={{ accentColor: '#00657c', width: '14px', height: '14px' }}
                  />
                  Candidates
                  {candidatesLoading && (
                    <span style={{ fontSize: '11px', color: '#a0aec0' }}>...</span>
                  )}
                </label>
              </div>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="mx-8 mt-4 mb-4 text-center text-red-600 bg-red-50 border border-red-200 rounded p-4">
              {error}
            </div>
          )}

          {/* Loading skeletons */}
          {(phase === 'loading' || phase === 'warming') && (
            <div className="px-4 md:px-8 pt-6">
              <SkeletonSection />
              <SkeletonSection />
              <SkeletonSection />
            </div>
          )}

          {/* Results */}
          {phase !== 'loading' && phase !== 'warming' && (
              <div className="px-4 md:px-8 pt-6 pb-8">
                {Object.entries(searchFilteredPoliticians).map(([tier, groups]) => {
                  const hasGroups = Object.keys(groups).length > 0;

                  // Empty-state for Local/State: when no data but search is active
                  if (!hasGroups && (tier === 'Local' || tier === 'State') && activeQuery) {
                    const isFirst = tier === 'Local';
                    return (
                      <div key={tier} data-tier={tier}>
                        {selectedFilter === 'All' && (
                          <div className={`flex items-center gap-4 ${isFirst ? 'mb-4' : 'mt-10 mb-4'}`}>
                            <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">{tier}</span>
                            <hr className="flex-1 border-gray-200" />
                          </div>
                        )}
                        <p className="mt-4 text-gray-500">
                          {tier} representative data is not yet available for this area.
                        </p>
                      </div>
                    );
                  }

                  if (!hasGroups) return null;

                  return (
                    <div key={tier}>
                      {tier === 'Local' && (
                        <div data-tier="Local">
                          {selectedFilter === 'All' && (
                            <div className="flex items-center gap-4 mb-4">
                              <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">Local</span>
                              <hr className="flex-1 border-gray-200" />
                            </div>
                          )}
                          {orderedEntries(groups, LOCAL_ORDER).map(([category, polList]) => (
                            <CategorySection key={category} title={getDisplayName(category)}>
                              {defaultSort(category, polList).map((pol) =>
                                renderPoliticianCard(pol, handlePoliticianClick)
                              )}
                            </CategorySection>
                          ))}
                        </div>
                      )}

                      {tier === 'State' && (
                        <div data-tier="State">
                          {selectedFilter === 'All' && (
                            <div className="flex items-center gap-4 mt-10 mb-4">
                              <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">State</span>
                              <hr className="flex-1 border-gray-200" />
                            </div>
                          )}
                          {orderedEntries(groups, STATE_ORDER).map(([category, polList]) => (
                            <CategorySection key={category} title={getDisplayName(category)}>
                              {defaultSort(category, polList).map((pol) =>
                                renderPoliticianCard(pol, handlePoliticianClick)
                              )}
                            </CategorySection>
                          ))}
                        </div>
                      )}

                      {tier === 'Federal' && (
                        <div data-tier="Federal">
                          {selectedFilter === 'All' && (
                            <div className="flex items-center gap-4 mt-10 mb-4">
                              <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">Federal</span>
                              <hr className="flex-1 border-gray-200" />
                            </div>
                          )}
                          {orderedEntries(groups, FEDERAL_ORDER).map(([category, polList]) => (
                            <CategorySection key={category} title={getDisplayName(category)}>
                              {defaultSort(category, polList).map((pol) =>
                                renderPoliticianCard(pol, handlePoliticianClick)
                              )}
                            </CategorySection>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}

                {federalFiltered.length === 0 && phase !== 'loading' && activeQuery && (
                  <p className="text-center text-gray-600 mt-8">
                    No results found for this location.
                  </p>
                )}
              </div>
            )}
        </main>
      </div>
    </div>
  );
}
