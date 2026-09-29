import { useState, useEffect, useRef } from 'react';
import { track } from '@empoweredvote/analytics';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { useCompass } from '../contexts/CompassContext';
import { COVERAGE_STATES } from '../lib/coverage';
import { browseAreaRoute, coordinateRoute, zipRoute } from '../lib/localitySearch';
import LocationCombobox from '../components/LocationCombobox';
import { getAutoOpenMyLocation } from '../lib/locationPref';


const STEPS = [
  { n: '01', heading: 'Choose Your Area', body: 'Enter your address anywhere in the U.S. — or pick an Alpha Community for the full local-to-Congress view.', active: true },
  { n: '02', heading: 'See Their Stances', body: 'Browse each official\'s verified positions on the issues that shape your community.' },
  { n: '03', heading: 'Vote with Confidence', body: 'Know every name on your ballot before you step into the booth.' },
];

export default function Landing() {
  const [addressInput, setAddressInput] = useState('');
  const comboboxWrapperRef = useRef(null);
  const coverageRef = useRef(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isLoggedIn, myRepresentatives, myLocationNotSet, compassLoading } = useCompass();

  // ADR-0001 locality fallback: when a city/county/state search couldn't resolve to
  // covered reps, the user lands here with a hint about what we cover.
  const fromSearch = searchParams.get('from_search');
  const coverageStateParam = searchParams.get('coverage_state');
  const isUncovered = searchParams.get('uncovered') === '1';

  // Connected-account auto-port to the user's saved home location is OPT-IN
  // (default OFF). Only redirect when the user has explicitly enabled "Default to
  // my saved location" in the hamburger menu; otherwise a connected account stays
  // on this default page just like a guest. See src/lib/locationPref.js.
  useEffect(() => {
    if (
      !compassLoading &&
      isLoggedIn &&
      myRepresentatives &&
      myRepresentatives.length > 0 &&
      getAutoOpenMyLocation()
    ) {
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

  // LocationCombobox is fully controlled and classifies input itself (SRCH-06,
  // RESEARCH Dispatch Wiring) — an address-classified submit skips the old
  // resolveLocalityRoute third-party-geocoder detour entirely and goes straight
  // to the Results address path; a name-classified selection dispatches via browseAreaRoute; a
  // coordinate-classified submit hands off to Results via the Plan 02
  // coordinateRoute contract (SRCH-05) — Results reads lat/lng/coord_raw on mount.
  const handleSubmitAddress = (raw) => {
    track('essentials_address_searched', { method: 'manual' });
    navigate(`/results?q=${encodeURIComponent(raw)}`);
  };

  // A bare ZIP resolves as an AREA, not a point — Results renders it in area
  // voice ("Officials serving 46220"). No raw ZIP in telemetry beyond the fact
  // that a ZIP search happened, matching the coordinate handler's restraint.
  const handleSubmitZip = (zip) => {
    track('essentials_zip_searched', { method: 'manual' });
    navigate(zipRoute(zip));
  };

  const handleSubmitCoordinate = (lat, lng, raw) => {
    // T-214-02: no raw {lat, lng} in telemetry — Results' own on-mount resolver
    // captures method/outcome once it resolves the hand-off.
    track('essentials_coordinate_searched', { method: 'landing_handoff' });
    navigate(coordinateRoute(lat, lng, raw));
  };

  const handleSelectCandidate = (candidate) => {
    track('essentials_locality_searched', { label: candidate.label, state: candidate.state });
    navigate(browseAreaRoute(candidate));
  };

  // The active "Choose Your Area" step reads as a button — make it act like one
  // by focusing the search field (scrolling it into view on mobile, where the
  // step cards sit below the search).
  const handleAreaStepClick = () => {
    comboboxWrapperRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    comboboxWrapperRef.current?.querySelector('input')?.focus({ preventScroll: true });
  };

  const handleAreaClick = (area) => {
    const areaType = area.browseGovernmentList ? 'government_list' : area.browseGeoId ? 'geo' : 'address';
    track('essentials_browse_area_clicked', {
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

  return (
    <Layout>

      {/* ── Hero ── */}
      <section className="bg-[var(--ev-bg-light)] dark:bg-ev-navy flex items-center">
        <div className="w-full px-12 sm:px-16 lg:px-24 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-16 lg:gap-24 items-start">

            {/* Left: headline + copy + location search */}
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
                Enter your address anywhere in the U.S. to meet your members of Congress and the candidates running for the House. In our Alpha Communities, you get the full picture — every office from city hall to Congress — and we're expanding it all the time.
              </p>
              {/* width constrained so right edge aligns with Berkeley column below */}
              <div className="lg:max-w-[calc(50vw-5rem)]">
                {/* Location search — the shared LocationCombobox (SRCH-06): the same
                    component instance powering the Results header. Address/place/
                    coordinate submits are classified and dispatched by the combobox
                    itself; Landing only supplies the navigation targets.

                    2026-09-29: the search-candidates-by-name field that used to sit above
                    this is gone — one search box, not two. It carried a yellow border;
                    that did NOT come with it (operator call, same day). The combobox keeps
                    the standard grey/teal frame it wears in the Results header. */}
                <div ref={comboboxWrapperRef}>
                  <LocationCombobox
                    value={addressInput}
                    onChange={setAddressInput}
                    onSubmitAddress={handleSubmitAddress}
                    onSubmitCoordinate={handleSubmitCoordinate}
                    onSubmitZip={handleSubmitZip}
                    onSelectCandidate={handleSelectCandidate}
                    placeholder="Address, ZIP, city, or coordinates — anywhere in the U.S."
                    ariaLabel="Enter your street address, ZIP code, city, county, state, or decimal coordinates"
                  />
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
              <>We don't have full local coverage for <span className="font-semibold">{fromSearch}</span> yet — but enter your street address and we'll still show your representatives in Congress and who's running for the House. For the complete local-to-Congress view, explore an Alpha Community below.</>
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
          {[...COVERAGE_STATES].sort((a, b) => a.name.localeCompare(b.name)).map((state) => {
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
