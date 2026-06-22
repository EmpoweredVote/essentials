import { useState, useEffect, useRef } from 'react';
import { usePostHog } from 'posthog-js/react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { useCompass } from '../contexts/CompassContext';
import { searchPoliticiansByName } from '../lib/api';
import useGooglePlacesAutocomplete from '../hooks/useGooglePlacesAutocomplete';
import { COVERAGE_STATES } from '../lib/coverage';
import { resolveLocalityRoute } from '../lib/localitySearch';


const STEPS = [
  { n: '01', heading: 'Choose Your Area', body: 'Pick an Alpha Area or enter your address — we\'ll find everyone who represents you.', active: true },
  { n: '02', heading: 'See Their Stances', body: 'Browse each official\'s verified positions on the issues that shape your community.' },
  { n: '03', heading: 'Vote with Confidence', body: 'Know every name on your ballot before you step into the booth.' },
];

const SearchIcon = () => (
  <svg
    width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400"
    aria-hidden="true"
  >
    <circle cx="11" cy="11" r="7" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

export default function Landing() {
  const [addressInput, setAddressInput] = useState('');
  const [searching, setSearching] = useState(false);
  const addressInputRef = useRef(null);
  const coverageRef = useRef(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isLoggedIn, myRepresentatives, myLocationNotSet, compassLoading } = useCompass();
  const posthog = usePostHog();

  // ADR-0001 locality fallback: when a city/county/state search couldn't resolve to
  // covered reps, the user lands here with a hint about what we cover.
  const fromSearch = searchParams.get('from_search');
  const coverageStateParam = searchParams.get('coverage_state');
  const isUncovered = searchParams.get('uncovered') === '1';

  // Bind Google Places autocomplete to the address input (same hook the results
  // page uses). Selecting a suggestion navigates straight to the results page.
  useGooglePlacesAutocomplete(addressInputRef, {
    onPlaceSelected: (addr) => {
      setAddressInput(addr);
      posthog?.capture('essentials_address_searched', { method: 'autocomplete' });
      navigate(`/results?q=${encodeURIComponent(addr)}`);
    },
  });

  useEffect(() => {
    if (!compassLoading && isLoggedIn && myRepresentatives && myRepresentatives.length > 0) {
      navigate('/results?prefilled=true', { replace: true });
    }
  }, [compassLoading, isLoggedIn, myRepresentatives, navigate]);

  useEffect(() => {
    if (!myLocationNotSet) return;
    const handleVisible = () => {
      if (document.visibilityState === 'visible') window.location.reload();
    };
    document.addEventListener('visibilitychange', handleVisible);
    return () => document.removeEventListener('visibilitychange', handleVisible);
  }, [myLocationNotSet]);

  const handleSearch = async () => {
    // Read the live DOM value, not React state: Google Places Autocomplete writes
    // directly to the input element, and not every write fires React's onChange, so
    // `addressInput` state can lag/truncate behind what's actually in the box (the
    // dropdown matches the full text but state may be stale). The ref is the source
    // of truth; fall back to state only if the ref isn't mounted.
    const q = (addressInputRef.current?.value ?? addressInput).trim();
    if (!q || searching) return;
    posthog?.capture('essentials_address_searched', { method: 'manual' });
    setSearching(true);
    try {
      // ADR-0001: classify the query — a covered city/state/county routes to
      // Browse-by-Location; a street address (or anything we can't classify)
      // falls through to the normal address search.
      const route = await resolveLocalityRoute(q);
      navigate(route.kind === 'address' ? `/results?q=${encodeURIComponent(q)}` : route.to);
    } finally {
      setSearching(false);
    }
  };

  // The active "Choose Your Area" step reads as a button — make it act like one
  // by focusing the address input (scrolling it into view on mobile, where the
  // step cards sit below the search).
  const handleAreaStepClick = () => {
    addressInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    addressInputRef.current?.focus({ preventScroll: true });
  };

  const handleAreaClick = (area) => {
    const areaType = area.browseGovernmentList ? 'government_list' : area.browseGeoId ? 'geo' : 'address';
    posthog?.capture('essentials_browse_area_clicked', {
      label: area.label,
      type: areaType,
      state: area.browseStateAbbrev || area.state || null,
    });
    if (area.browseGovernmentList) {
      const params = new URLSearchParams({
        browse_government_list: area.browseGovernmentList.join(','),
        browse_label: area.label,
      });
      if (area.browseStateAbbrev) params.set('browse_state', area.browseStateAbbrev);
      if (area.browseCountyGeoId) params.set('browse_county_geo_id', area.browseCountyGeoId);
      navigate(`/results?${params}`);
    } else if (area.browseGeoId) {
      const params = new URLSearchParams({
        browse_geo_id: area.browseGeoId,
        browse_mtfcc: area.browseMtfcc,
        browse_label: area.label,
      });
      if (area.browseCityFilter) params.set('browse_city_filter', area.browseCityFilter);
      if (area.browseSchoolFilter) params.set('browse_school_filter', area.browseSchoolFilter);
      navigate(`/results?${params}`);
    } else {
      navigate(`/results?q=${encodeURIComponent(area.address)}`);
    }
  };

  const [expandedStates, setExpandedStates] = useState(
    () => (coverageStateParam ? new Set([coverageStateParam.toUpperCase()]) : new Set())
  );
  const toggleState = (abbrev) => {
    setExpandedStates(prev => {
      const next = new Set(prev);
      if (next.has(abbrev)) next.delete(abbrev); else next.add(abbrev);
      return next;
    });
  };

  // Locality fallback: expand the matched state and scroll to the covered-areas
  // list when we arrived from a city/state/county search we couldn't pin to exact
  // reps. Runs on param change too (the search often fires from this same page,
  // so the component doesn't remount).
  useEffect(() => {
    if (coverageStateParam) {
      setExpandedStates((prev) => new Set(prev).add(coverageStateParam.toUpperCase()));
    }
    if ((coverageStateParam || isUncovered) && coverageRef.current) {
      coverageRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [coverageStateParam, isUncovered]);

  const [nameQuery, setNameQuery] = useState('');
  const [nameResults, setNameResults] = useState([]);
  const [nameStatus, setNameStatus] = useState('idle');
  const debounceRef = useRef(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = nameQuery.trim();
    if (q.length < 2) {
      setNameResults([]);
      setNameStatus('idle');
      return;
    }
    setNameStatus('loading');
    debounceRef.current = setTimeout(async () => {
      const { status, data } = await searchPoliticiansByName(q);
      setNameResults(Array.isArray(data) ? data : []);
      setNameStatus(status === 'fresh' ? 'fresh' : 'error');
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [nameQuery]);

  const nameSearchResults = (
    <>
      {nameQuery.trim().length >= 2 && (
        <div className="mt-2">
          {nameStatus === 'loading' && (
            <p className="text-sm text-gray-500 dark:text-gray-400 py-2">Searching&hellip;</p>
          )}
          {nameStatus === 'fresh' && nameResults.length === 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400 py-2">No candidates match &ldquo;{nameQuery.trim()}&rdquo;.</p>
          )}
          {nameStatus === 'error' && (
            <p className="text-sm text-red-500 py-2">Search failed. Try again.</p>
          )}
          {nameStatus === 'fresh' && nameResults.length > 0 && (
            <ul className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-md overflow-hidden">
              {nameResults.map((pol) => (
                <li key={pol.id}>
                  <Link
                    to={`/politician/${pol.id}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--ev-bg-light)] dark:hover:bg-gray-800 transition-colors"
                  >
                    {pol.photo_origin_url && (
                      <img
                        src={pol.photo_origin_url}
                        alt=""
                        className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    )}
                    <div className="min-w-0">
                      <div className="font-semibold text-[var(--ev-teal)] dark:text-ev-teal-light truncate">{pol.full_name}</div>
                      {(pol.office_title || pol.government_name || pol.representing_state) && (
                        <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                          {[pol.office_title, (pol.government_name?.replace(/, US$/, '') || pol.representing_state)].filter(Boolean).join(' · ')}
                        </div>
                      )}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      {nameQuery.trim().length < 2 && nameQuery.trim().length > 0 && (
        <p className="mt-2 text-sm text-gray-400 dark:text-gray-500">Type at least 2 letters to search.</p>
      )}
    </>
  );

  return (
    <Layout>

      {/* ── Hero ── */}
      <section className="bg-[var(--ev-bg-light)] dark:bg-ev-navy flex items-center">
        <div className="w-full px-12 sm:px-16 lg:px-24 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-16 lg:gap-24 items-start">

            {/* Left: headline + copy + name search */}
            <div>
              <p className="text-[var(--ev-teal)] dark:text-ev-teal-light text-xs font-bold uppercase tracking-widest mb-5">
                Empowered Essentials
              </p>
              <h1 className="text-5xl sm:text-6xl font-bold leading-tight text-gray-900 dark:text-white">
                Meet everyone<br />who represents you,
              </h1>
              <p className="text-5xl sm:text-6xl font-bold text-[var(--ev-teal)] dark:text-ev-teal-light leading-tight mt-1 mb-8">
                at every level.
              </p>
              <p className="text-gray-500 dark:text-gray-400 text-lg leading-relaxed mb-3">
                Most voters can't name half the people on their ballot — let alone where they stand on the issues.
              </p>
              <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed mb-6">
                Our Alpha Communities show exactly where we're headed: your full government, from city hall to Congress, all in one place.
              </p>
              {/* width constrained so right edge aligns with Berkeley column below */}
              <div className="lg:max-w-[calc(50vw-5rem)]">
                <div className="relative">
                  <SearchIcon />
                  <input
                    type="text"
                    value={nameQuery}
                    onChange={(e) => setNameQuery(e.target.value)}
                    placeholder="Search candidates by name…"
                    aria-label="Search candidates by name"
                    className="w-full pl-12 pr-4 py-4 text-lg border-2 border-ev-yellow rounded-xl focus:outline-none focus:ring-2 focus:ring-ev-yellow bg-white dark:bg-gray-900 dark:text-white dark:placeholder-gray-500 shadow-sm"
                  />
                </div>
                {nameSearchResults}

                {/* Address search — input takes the row; the Search button collapses to a
                    magnifying-glass icon on mobile so the full address stays readable. */}
                <div className="flex gap-2 mt-3">
                  <input
                    ref={addressInputRef}
                    type="text"
                    value={addressInput}
                    onChange={(e) => setAddressInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="If you reside in an Alpha Community, enter your street address"
                    className="flex-1 min-w-0 px-3 py-4 text-sm border-2 border-ev-yellow rounded-xl focus:outline-none focus:ring-2 focus:ring-ev-yellow bg-white dark:bg-gray-900 dark:text-white dark:placeholder-gray-400 shadow-sm"
                  />
                  <button
                    onClick={handleSearch}
                    disabled={!addressInput.trim() || searching}
                    aria-label="Search"
                    className="shrink-0 flex items-center justify-center min-w-[52px] px-4 sm:px-5 py-4 text-base font-bold text-black bg-ev-yellow rounded-xl hover:bg-ev-yellow-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                  >
                    <svg
                      className="w-5 h-5 sm:hidden" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <circle cx="11" cy="11" r="7" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <span className="hidden sm:inline">Search</span>
                  </button>
                </div>
              </div>
              {!compassLoading && isLoggedIn && myLocationNotSet && (
                <div className="mt-3 px-4 py-3 bg-white dark:bg-gray-900 border border-[var(--ev-teal)] dark:border-ev-teal-light rounded-lg shadow-sm text-sm">
                  <a
                    href="https://app.empowered.vote/settings/location"
                    className="font-semibold text-[var(--ev-teal)] dark:text-ev-teal-light hover:underline"
                  >
                    Set your home location in your profile
                  </a>
                  {' '}<span className="text-gray-700 dark:text-gray-300">to get taken straight to your elected leaders on every visit.</span>
                </div>
              )}
            </div>

            {/* Right: step cards */}
            <div className="space-y-3">
              {STEPS.map(({ n, heading, body, active }) => (
                <div
                  key={n}
                  onClick={active ? handleAreaStepClick : undefined}
                  onKeyDown={active ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleAreaStepClick(); } } : undefined}
                  role={active ? 'button' : undefined}
                  tabIndex={active ? 0 : undefined}
                  className={`flex items-start gap-4 p-5 rounded-2xl border transition-colors ${
                    active
                      ? 'bg-white dark:bg-ev-navy-card border-[var(--ev-teal)] dark:border-ev-teal-light cursor-pointer hover:border-[var(--ev-teal)]/70 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-ev-yellow'
                      : 'bg-gray-50 dark:bg-ev-navy-elevated border-gray-200 dark:border-white/10'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    active
                      ? 'bg-[var(--ev-teal)]/10 dark:bg-ev-teal-light/20 text-[var(--ev-teal)] dark:text-ev-teal-light'
                      : 'bg-gray-100 dark:bg-white/10 text-gray-400 dark:text-gray-500'
                  }`}>
                    {n}
                  </div>
                  <div>
                    <p className={`font-bold mb-1 ${active ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'}`}>{heading}</p>
                    <p className={`text-sm leading-relaxed ${active ? 'text-gray-600 dark:text-gray-300' : 'text-gray-500 dark:text-gray-400'}`}>{body}</p>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* ── Alpha Communities Section ── */}
      <section ref={coverageRef} id="coverage" className="w-full px-8 sm:px-12 lg:px-24 py-16 scroll-mt-20">
        {fromSearch && (
          <div className="mb-6 px-4 py-3 rounded-lg border border-[var(--ev-teal)] dark:border-ev-teal-light bg-white dark:bg-ev-navy-card text-sm text-gray-700 dark:text-gray-200">
            {isUncovered ? (
              <>We don't cover <span className="font-semibold">{fromSearch}</span> yet. Here are the Alpha Communities we currently cover — or enter a full street address inside one of them.</>
            ) : (
              <>We don't have an exact match for <span className="font-semibold">{fromSearch}</span>. Here are the areas we cover{coverageStateParam ? ` in ${COVERAGE_STATES.find(s => s.abbrev === coverageStateParam.toUpperCase())?.name || 'your state'}` : ''} — pick one, or enter your full street address for your specific representatives.</>
            )}
          </div>
        )}
        <h2 className="text-2xl sm:text-3xl font-semibold text-[var(--ev-teal)] dark:text-ev-teal-light mb-2">
          Choose an Alpha Community
        </h2>
        <p className="text-base text-gray-500 dark:text-gray-400 mb-2">
          Each one is a preview of the full Essentials experience. Click a state to browse its covered areas.
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
          <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 mr-1">Purple Cities</span>
          have stances.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-start">
          {COVERAGE_STATES.map((state) => {
            const isExpanded = expandedStates.has(state.abbrev);
            return (
              <div
                key={state.abbrev}
                className="bg-white dark:bg-gray-900 border-2 border-[var(--ev-teal)] dark:border-ev-teal-light rounded-xl shadow-sm overflow-hidden"
              >
                {/* Card header — click to expand/collapse */}
                <button
                  onClick={() => toggleState(state.abbrev)}
                  aria-expanded={isExpanded}
                  className="w-full text-left px-4 pt-4 pb-3 flex items-start justify-between gap-2 hover:bg-[var(--ev-bg-light)] dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[var(--ev-teal)]"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="font-bold text-[var(--ev-teal)] dark:text-ev-teal-light">{state.name}</span>
                      <span className="text-xs text-gray-400 dark:text-gray-500 font-mono shrink-0">{state.abbrev}</span>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {state.areas.length} {state.areas.length === 1 ? 'area' : 'areas'}
                    </div>
                  </div>
                  {/* Chevron */}
                  <svg
                    width="16" height="16" viewBox="0 0 16 16" fill="none"
                    className={`shrink-0 mt-1 text-gray-400 dark:text-gray-500 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                    aria-hidden="true"
                  >
                    <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>

                {/* Expanded city/area chips */}
                {isExpanded && (
                  <div className="px-3 pb-3 pt-2 border-t border-gray-100 dark:border-gray-800 flex flex-wrap gap-1.5">
                    {state.areas.map((area) => (
                      <button
                        key={area.label}
                        onClick={() => handleAreaClick(area)}
                        className={`inline-flex items-center justify-center min-h-[44px] text-xs px-3 py-1.5 rounded-full font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 ${
                          area.hasContext
                            ? 'bg-purple-100 hover:bg-purple-200 dark:bg-purple-900/30 dark:hover:bg-purple-800/40 text-purple-700 dark:text-purple-300 focus:ring-purple-400'
                            : 'bg-[var(--ev-teal)]/10 hover:bg-[var(--ev-teal)]/20 dark:bg-ev-teal-light/15 dark:hover:bg-ev-teal-light/25 text-[var(--ev-teal)] dark:text-ev-teal-light focus:ring-[var(--ev-teal)]'
                        }`}
                      >
                        {area.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

    </Layout>
  );
}
