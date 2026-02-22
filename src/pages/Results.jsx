import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { SiteHeader, FilterSidebar, CategorySection, PoliticianCard, useMediaQuery } from '@chrisandrewsedu/ev-ui';
import useGooglePlacesAutocomplete from '../hooks/useGooglePlacesAutocomplete';
import ResultsHeader from '../components/ResultsHeader';
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

function Spinner() {
  return (
    <div className="flex items-center justify-center gap-2 text-gray-600 mt-4">
      <div className="h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
      <span>Loading results…</span>
    </div>
  );
}

/** Render a politician or candidate card with election date below for candidates */
function renderPoliticianCard(pol, handlePoliticianClick) {
  const isCandidate = pol.is_candidate;

  return (
    <div key={pol.id}>
      <PoliticianCard
        id={pol.id}
        imageSrc={getImageUrl(pol)}
        name={`${pol.first_name} ${pol.last_name}`}
        title={pol.office_title}
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
  const zipFromUrl = searchParams.get('zip') || '';
  const queryFromUrl = searchParams.get('q') || '';

  const [zip, setZip] = useState(zipFromUrl || queryFromUrl);
  const [searchQuery, setSearchQuery] = useState('');
  const zipInputRef = useRef(null);
  const mainRef = useRef(null);

  // Detect desktop breakpoint for two-panel layout
  const isDesktop = useMediaQuery('(min-width: 769px)');

  useGooglePlacesAutocomplete(zipInputRef, {
    onPlaceSelected: (formattedAddress) => {
      setZip(formattedAddress);
      setCachedResult(null);
      sessionStorage.removeItem('ev:results');
      setSearchParams({ q: formattedAddress });
    },
  });

  // Attempt sessionStorage restore for back-navigation
  const [cachedResult, setCachedResult] = useState(() => {
    const initial = zipFromUrl || queryFromUrl;
    if (!initial) return null;
    try {
      const cached = sessionStorage.getItem('ev:results');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.query === initial && Date.now() - parsed.timestamp < 600000) {
          return parsed;
        }
      }
    } catch { /* ignore */ }
    return null;
  });

  // Wire up the hook with sessionStorage gating
  const activeQuery = zipFromUrl || queryFromUrl || '';
  const {
    data: hookData,
    phase: hookPhase,
    error,
  } = usePoliticianData(activeQuery, {
    enabled: !!activeQuery && !cachedResult,
    initialData: [],
  });

  // Derive actual data and phase from cache or hook
  const list = cachedResult ? cachedResult.list : hookData;
  const phase = cachedResult ? 'fresh' : hookPhase;

  // Initialize selectedFilter from cache if available
  const [selectedFilter, setSelectedFilter] = useState(
    cachedResult?.filter || 'All'
  );

  // Scroll-spy tier tracking for building image swap
  const [scrollActiveTier, setScrollActiveTier] = useState('Local');

  // Candidate toggle state
  const [showCandidates, setShowCandidates] = useState(false);
  const [candidateData, setCandidateData] = useState([]);
  const [candidatesLoading, setCandidatesLoading] = useState(false);

  // Save results to sessionStorage for back-navigation restoration
  useEffect(() => {
    if (list.length > 0 && phase === 'fresh') {
      const query = zipFromUrl || queryFromUrl;
      if (query) {
        sessionStorage.setItem('ev:results', JSON.stringify({
          query,
          list,
          filter: selectedFilter,
          timestamp: Date.now(),
        }));
      }
    }
  }, [list, phase, selectedFilter, zipFromUrl, queryFromUrl]);

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

  const handleZipChange = (newZip) => {
    setZip(newZip);
  };

  const handleZipClear = () => {
    setZip('');
  };

  const handleZipSubmit = () => {
    const normalized = zip.trim();
    if (!normalized) return;
    // Clear sessionStorage cache so hook runs fresh
    setCachedResult(null);
    sessionStorage.removeItem('ev:results');
    if (/^\d{5}$/.test(normalized)) {
      setSearchParams({ zip: normalized });
    } else {
      setSearchParams({ q: normalized });
    }
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
    // (BallotReady data stores city in chamber_name but not representing_city)
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
      // Non-federal politicians pass through
      if (!dt?.includes('NATIONAL')) return true;
      // NATIONAL_EXEC (President, VP, Cabinet) - show all
      if (dt === 'NATIONAL_EXEC') return true;
      // NATIONAL_UPPER (Senate) and NATIONAL_LOWER (House) - only user's state
      if (dt === 'NATIONAL_UPPER' || dt === 'NATIONAL_LOWER') {
        return p.representing_state?.toUpperCase() === userState;
      }
      // Other federal (if any) - show all
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

    // Officials first
    for (const { pol, cat } of classified) {
      const tier = map[cat.tier] ? cat.tier : 'Unknown';
      if (!map[tier][cat.group]) map[tier][cat.group] = [];
      map[tier][cat.group].push(pol);
    }

    // Candidates after officials (within same groups)
    for (const { pol, cat } of classifiedCandidates) {
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
  // On desktop, observe within the scrolling main panel (not the viewport)
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

      {/* Two-panel layout: height-constrained on desktop, flex-col on mobile */}
      <div
        className={isDesktop ? '' : 'flex flex-col'}
        style={isDesktop ? {
          display: 'flex',
          flexDirection: 'row',
          height: 'calc(100vh - 75px)',
          overflow: 'hidden',
        } : undefined}
      >
        {/* Filter Sidebar */}
        <FilterSidebar
          zipCode={zip}
          onZipChange={handleZipChange}
          onZipClear={handleZipClear}
          onZipSubmit={handleZipSubmit}
          selectedFilter={selectedFilter}
          onFilterChange={setSelectedFilter}
          locationLabel={locationLabel}
          buildingImageSrc={activeBuildingImage}
          zipInputRef={zipInputRef}
        />

        {/* Main Content — independently scrollable on desktop */}
        <main
          ref={mainRef}
          className="flex-1"
          style={isDesktop ? { overflowY: 'auto', minWidth: 0 } : undefined}
        >
          {/* Candidate Toggle - subtle secondary placement */}
          {activeQuery && (
            <div style={{
              padding: '8px 32px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              borderBottom: '1px solid #e2ebef',
            }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontFamily: "'Manrope', sans-serif",
                fontSize: '13px',
                color: '#718096',
                cursor: 'pointer',
                userSelect: 'none',
              }}>
                <input
                  type="checkbox"
                  checked={showCandidates}
                  onChange={(e) => setShowCandidates(e.target.checked)}
                  style={{ accentColor: '#00657c', width: '14px', height: '14px' }}
                />
                Show Candidates
                {candidatesLoading && (
                  <span style={{ fontSize: '11px', color: '#a0aec0' }}>(loading...)</span>
                )}
              </label>
            </div>
          )}

          {/* Results Header */}
          <ResultsHeader
            resultsCount={federalFiltered.length}
            onSearch={setSearchQuery}
          />

          {/* Error message */}
          {error && (
            <div className="mx-8 mb-4 text-center text-red-600 bg-red-50 border border-red-200 rounded p-4">
              {error}
            </div>
          )}

          {/* Spinner */}
          {(phase === 'warming' || phase === 'loading') && <Spinner />}

          {/* Results */}
          <div className="px-4 md:px-8 pb-8">
            {Object.entries(searchFilteredPoliticians).map(([tier, groups]) => {
              const hasGroups = Object.keys(groups).length > 0;

              // Empty-state for Local/State: when no data but search is active
              if (!hasGroups && (tier === 'Local' || tier === 'State') && activeQuery && phase !== 'loading' && phase !== 'warming') {
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

            {federalFiltered.length === 0 && phase !== 'loading' && zip && (
              <p className="text-center text-gray-600 mt-8">
                No results found for this location.
              </p>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
