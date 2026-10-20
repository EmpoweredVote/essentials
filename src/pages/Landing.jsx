import { useState, useEffect, useRef, useMemo } from 'react';
import { track } from '@empoweredvote/analytics';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { useCompass } from '../contexts/CompassContext';
import { COVERAGE_STATES } from '../lib/coverage';
import { browseAreaRoute, coordinateRoute, zipRoute } from '../lib/localitySearch';
import LocationCombobox from '../components/LocationCombobox';
import { getAutoOpenMyLocation } from '../lib/locationPref';
import {
  resolveInitialCoverageState,
  getLastCoverageState,
  setLastCoverageState,
  homeStateFromAddress,
} from '../lib/coverageSelection';


const STEPS = [
  { n: '01', heading: 'Choose Your Area', body: 'Enter your address anywhere in the U.S. — or pick an Alpha Community for the full local-to-Congress view.', active: true },
  { n: '02', heading: 'See Their Stances', body: 'Browse each official\'s verified positions on the issues that shape your community.' },
  { n: '03', heading: 'Vote with Confidence', body: 'Know every name on your ballot before you step into the booth.' },
];

// The covered-area chips, shared by the desktop detail panel and the mobile
// accordion so the two layouts can't drift. Purple = the city has verified
// stances (area.hasContext); teal = coverage without stances yet.
function AreaChips({ areas, onSelect }) {
  return (
    <div className="flex flex-wrap gap-2">
      {areas.map((area) => (
        <button
          key={area.label}
          onClick={() => onSelect(area)}
          className={`inline-flex items-center justify-center min-h-[44px] lg:min-h-0 text-xs px-3 py-1.5 rounded-full font-medium border transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 dark:focus:ring-offset-ev-navy-card ${
            area.hasContext
              ? 'border-purple-300 dark:border-purple-400/40 bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/20 dark:hover:bg-purple-800/30 text-purple-700 dark:text-purple-300 focus:ring-purple-400'
              : 'border-[var(--ev-teal)]/30 dark:border-ev-teal-light/30 bg-[var(--ev-teal)]/5 hover:bg-[var(--ev-teal)]/15 dark:bg-ev-teal-light/10 dark:hover:bg-ev-teal-light/20 text-[var(--ev-teal)] dark:text-ev-teal-light focus:ring-[var(--ev-teal)]'
          }`}
        >
          {area.label}
        </button>
      ))}
    </div>
  );
}

export default function Landing() {
  const [addressInput, setAddressInput] = useState('');
  const comboboxWrapperRef = useRef(null);
  const coverageRef = useRef(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isLoggedIn, myRepresentatives, myRepresentativesAddress, myLocationNotSet, compassLoading } = useCompass();

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

  // ── Alpha Communities rail ──────────────────────────────────────────────
  // One state is selected at a time. Desktop shows it in the detail pane beside
  // the rail; mobile reveals the same chips inline beneath the row, accordion
  // style, because two panes don't fit at phone width.
  //
  // There is no hardcoded default state — opening on California only works for
  // Californians. resolveInitialCoverageState picks from the deep link, the
  // state they browsed last time, then their home state, and selects nothing
  // rather than guessing. See src/lib/coverageSelection.js for the precedence.
  const sortedStates = useMemo(
    () => [...COVERAGE_STATES].sort((a, b) => a.name.localeCompare(b.name)),
    []
  );
  const coveredAbbrevs = useMemo(() => sortedStates.map((s) => s.abbrev), [sortedStates]);

  const [selectedState, setSelectedState] = useState(() =>
    resolveInitialCoverageState({
      deepLinkState: coverageStateParam,
      rememberedState: getLastCoverageState(),
      coveredAbbrevs,
    })
  );

  // The home-location fallback can only run once the compass context has loaded,
  // which is after first paint — so it fills in a still-empty selection rather
  // than overriding one the user already has.
  useEffect(() => {
    if (compassLoading || !isLoggedIn) return;
    setSelectedState((prev) => prev ?? resolveInitialCoverageState({
      homeState: homeStateFromAddress(myRepresentativesAddress),
      coveredAbbrevs,
    }));
  }, [compassLoading, isLoggedIn, myRepresentativesAddress, coveredAbbrevs]);

  const handleSelectState = (abbrev) => {
    // Clicking the open row closes it — that's what makes the mobile layout read
    // as an accordion. On desktop it drops the detail pane back to its prompt.
    setSelectedState((prev) => {
      const next = prev === abbrev ? null : abbrev;
      setLastCoverageState(next);
      return next;
    });
  };

  // Locality fallback: select the matched state and scroll to the covered-areas
  // list when we arrived from a city/state/county search we couldn't pin to exact
  // reps. Runs on param change too (the search often fires from this same page,
  // so the component doesn't remount). The deep link outranks the remembered
  // state for this visit, but doesn't overwrite it in storage.
  useEffect(() => {
    if (coverageStateParam) {
      const deepLinked = resolveInitialCoverageState({
        deepLinkState: coverageStateParam,
        coveredAbbrevs,
      });
      if (deepLinked) setSelectedState(deepLinked);
    }
    if ((coverageStateParam || isUncovered) && coverageRef.current) {
      coverageRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [coverageStateParam, isUncovered, coveredAbbrevs]);

  const selected = sortedStates.find((s) => s.abbrev === selectedState) || null;

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
        <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900 dark:text-white mb-2">
          Choose an <span className="text-[var(--ev-teal)] dark:text-ev-teal-light">Alpha Community</span>
        </h2>
        <p className="text-base text-gray-500 dark:text-gray-400 mb-8">
          Each one is a preview of the full Essentials experience.{' '}
          <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">Purple Cities</span>
          {' '}have verified stances.
        </p>
        {/* Two panes: a state rail and a detail panel.
            The rail runs its full natural height — no scrollbar inside it, so
            every state is reachable by scrolling the page the way you'd expect.
            That makes the rail tall (~1,070px at 29 states, ~1,850px at 50), so
            the detail panel is sticky instead: it follows you down rather than
            scrolling away and leaving a long empty column beside the list.
            Rows are ~37px, down from the ~63px in the design. */}
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-4 items-start">

          {/* ── State rail ── */}
          <ul className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-ev-navy-card overflow-hidden divide-y divide-gray-100 dark:divide-white/5">
            {sortedStates.map((state) => {
              const isSelected = state.abbrev === selectedState;
              return (
                <li key={state.abbrev}>
                  <button
                    onClick={() => handleSelectState(state.abbrev)}
                    aria-pressed={isSelected}
                    className={`w-full text-left pl-3 pr-3 py-2 flex items-center gap-2 border-l-2 transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[var(--ev-teal)] dark:focus:ring-ev-teal-light ${
                      isSelected
                        ? 'border-[var(--ev-teal)] dark:border-ev-teal-light bg-[var(--ev-teal)]/5 dark:bg-ev-teal-light/10'
                        : 'border-transparent hover:bg-[var(--ev-bg-light)] dark:hover:bg-white/5'
                    }`}
                  >
                    <span className={`text-sm font-semibold truncate ${
                      isSelected
                        ? 'text-[var(--ev-teal)] dark:text-ev-teal-light'
                        : 'text-gray-700 dark:text-gray-200'
                    }`}>
                      {state.name}
                    </span>
                    {/* gray-400 fails contrast at these sizes (2.6:1 on the rail's
                        white card) — the count is real information, not chrome. */}
                    <span className="text-[11px] text-gray-500 dark:text-gray-400 font-mono shrink-0">{state.abbrev}</span>
                    <span className="ml-auto text-xs text-gray-600 dark:text-gray-300 shrink-0 tabular-nums">{state.areas.length}</span>
                    {/* Only the selected row carries a chevron, as in the design.
                        On mobile it flips up to mark the open accordion; on
                        desktop it points at the detail panel beside the rail. */}
                    <svg
                      width="14" height="14" viewBox="0 0 16 16" fill="none"
                      className={`shrink-0 text-[var(--ev-teal)] dark:text-ev-teal-light rotate-180 lg:-rotate-90 ${isSelected ? '' : 'invisible'}`}
                      aria-hidden="true"
                    >
                      <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>

                  {/* Mobile accordion — two panes don't fit at phone width, so the
                      selected state opens its chips inline right under its row. */}
                  {isSelected && (
                    <div className="lg:hidden px-3 pb-3 pt-1 bg-[var(--ev-teal)]/5 dark:bg-ev-teal-light/5">
                      <AreaChips areas={state.areas} onSelect={handleAreaClick} />
                      <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                        Select a city to view its full government coverage.
                      </p>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

          {/* ── Detail panel (desktop only; mobile uses the accordion above) ── */}
          <div
            role="region"
            aria-label={selected ? `${selected.name} covered areas` : 'Covered areas'}
            /* Sticky below the 77px site header so the panel stays beside the
               rail all the way down the list. It sizes to its chips rather than
               to a fixed height, so no scrollbar appears until a state has more
               areas than the viewport can hold — California's 98 fit. The
               max-height is what keeps sticky workable: a panel taller than the
               viewport could never be read in full. */
            className="hidden lg:flex lg:flex-col lg:min-h-[16rem] lg:max-h-[calc(100vh-8rem)] lg:sticky lg:top-24 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-ev-navy-card overflow-hidden"
          >
            {selected ? (
              <>
                <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 dark:border-white/5">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">{selected.name}</h3>
                  <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">{selected.abbrev}</span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300">
                    {selected.areas.length} {selected.areas.length === 1 ? 'area' : 'areas'}
                  </span>
                  <div className="ml-auto flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[var(--ev-teal)] dark:bg-ev-teal-light" aria-hidden="true" />
                      Area
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-purple-500 dark:bg-purple-400" aria-hidden="true" />
                      Purple City
                    </span>
                  </div>
                </div>
                {/* Grows with the chips; scrolls only past the panel's max height. */}
                <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4">
                  <AreaChips areas={selected.areas} onSelect={handleAreaClick} />
                </div>
                <p className="px-5 py-3 border-t border-gray-100 dark:border-white/5 text-xs text-gray-500 dark:text-gray-400">
                  Select a city to view its full government coverage.
                </p>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center px-6 text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Pick a state to see its covered areas.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

    </Layout>
  );
}
