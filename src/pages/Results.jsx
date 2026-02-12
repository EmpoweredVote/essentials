import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { SiteHeader, FilterSidebar, CategorySection, PoliticianCard } from '@chrisandrewsedu/ev-ui';
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

function getImageUrl(pol) {
  if (pol.images && pol.images.length > 0) {
    const defaultImg = pol.images.find((img) => img.type === 'default');
    return defaultImg ? defaultImg.url : pol.images[0].url;
  }
  return pol.photo_origin_url;
}

function Spinner() {
  return (
    <div className="flex items-center justify-center gap-2 text-gray-600 mt-4">
      <div className="h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
      <span>Loading results…</span>
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

  // Building images mapping
  const buildingImages = {
    All: '/images/us-landmarks.jpg',
    Federal: '/images/us-landmarks.jpg',
    State: '/images/state-capitol.jpg',
    Local: '/images/city-hall.jpg',
  };

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

  const byTier = useMemo(() => {
    const map = { Local: {}, State: {}, Federal: {}, Unknown: {} };
    for (const { pol, cat } of classified) {
      const tier = map[cat.tier] ? cat.tier : 'Unknown';
      if (!map[tier][cat.group]) map[tier][cat.group] = [];
      map[tier][cat.group].push(pol);
    }
    return map;
  }, [classified]);

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

  const handlePoliticianClick = (id) => {
    navigate(`/politician/${id}`);
  };

  return (
    <div className="min-h-screen bg-[var(--ev-bg-light)]">
      <SiteHeader logoSrc="/EVLogo.svg" />

      <div className="flex">
        {/* Filter Sidebar */}
        <FilterSidebar
          zipCode={zip}
          onZipChange={handleZipChange}
          onZipClear={handleZipClear}
          onZipSubmit={handleZipSubmit}
          selectedFilter={selectedFilter}
          onFilterChange={setSelectedFilter}
          locationLabel={locationLabel}
          buildingImageSrc={buildingImages[selectedFilter]}
        />

        {/* Main Content */}
        <main className="flex-1">
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
          <div className="px-8 pb-8">
            {Object.entries(searchFilteredPoliticians).map(([tier, groups]) =>
              Object.keys(groups).length > 0 ? (
                <div key={tier}>
                  {tier === 'Local' && (
                    <>
                      {selectedFilter === 'All' && (
                        <div className="flex items-center gap-4 mb-4">
                          <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">Local</span>
                          <hr className="flex-1 border-gray-200" />
                        </div>
                      )}
                      {orderedEntries(groups, LOCAL_ORDER).map(([category, polList]) => (
                        <CategorySection key={category} title={getDisplayName(category)}>
                          {polList.map((pol) => (
                            <PoliticianCard
                              key={pol.id}
                              id={pol.id}
                              imageSrc={getImageUrl(pol)}
                              name={`${pol.first_name} ${pol.last_name}`}
                              title={pol.office_title}
                              onClick={() => handlePoliticianClick(pol.id)}
                              variant="horizontal"
                            />
                          ))}
                        </CategorySection>
                      ))}
                    </>
                  )}

                  {tier === 'State' && (
                    <>
                      {selectedFilter === 'All' && (
                        <div className="flex items-center gap-4 mt-10 mb-4">
                          <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">State</span>
                          <hr className="flex-1 border-gray-200" />
                        </div>
                      )}
                      {orderedEntries(groups, STATE_ORDER).map(([category, polList]) => (
                        <CategorySection key={category} title={getDisplayName(category)}>
                          {polList.map((pol) => (
                            <PoliticianCard
                              key={pol.id}
                              id={pol.id}
                              imageSrc={getImageUrl(pol)}
                              name={`${pol.first_name} ${pol.last_name}`}
                              title={pol.office_title}
                              onClick={() => handlePoliticianClick(pol.id)}
                              variant="horizontal"
                            />
                          ))}
                        </CategorySection>
                      ))}
                    </>
                  )}

                  {tier === 'Federal' && (
                    <>
                      {selectedFilter === 'All' && (
                        <div className="flex items-center gap-4 mt-10 mb-4">
                          <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">Federal</span>
                          <hr className="flex-1 border-gray-200" />
                        </div>
                      )}
                      {orderedEntries(groups, FEDERAL_ORDER).map(([category, polList]) => (
                        <CategorySection key={category} title={getDisplayName(category)}>
                          {polList.map((pol) => (
                            <PoliticianCard
                              key={pol.id}
                              id={pol.id}
                              imageSrc={getImageUrl(pol)}
                              name={`${pol.first_name} ${pol.last_name}`}
                              title={pol.office_title}
                              onClick={() => handlePoliticianClick(pol.id)}
                              variant="horizontal"
                            />
                          ))}
                        </CategorySection>
                      ))}
                    </>
                  )}
                </div>
              ) : null
            )}

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
