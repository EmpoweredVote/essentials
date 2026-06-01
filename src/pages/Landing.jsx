import { useState, useEffect, useRef } from 'react';
import { usePostHog } from 'posthog-js/react';
import { useNavigate, Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { useCompass } from '../contexts/CompassContext';
import { searchPoliticiansByName } from '../lib/api';

const COVERAGE_COUNTIES = [
  { label: 'Los Angeles County', state: 'California', browseGovernmentList: ['0644000', '06037', '0622710'], browseStateAbbrev: 'CA', browseCountyGeoId: '06037' },
  { label: 'Monroe County', state: 'Indiana', address: '100 W Kirkwood Ave, Bloomington, IN 47404' },
  { label: 'Collin County', state: 'Texas', browseStateAbbrev: 'TX', browseCountyGeoId: '48085', browseGovernmentList: ['4801924','4803300','4808872','4813684','4825224','4825488','4827684','4838068','4841800','4844308','4845012','4845744','4847496','4850100','4850760','4855152','4863000','4863276','4863432','4863500','4864220','4875960','4877740'] },
];

const COVERAGE_CITIES = [
  { label: 'Berkeley', state: 'California', browseGovernmentList: ['0606000'], browseStateAbbrev: 'CA' },
  { label: 'Fremont', state: 'California', browseGovernmentList: ['0626000'], browseStateAbbrev: 'CA' },
  { label: 'Sacramento', state: 'California', browseGovernmentList: ['0664000'], browseStateAbbrev: 'CA' },
  { label: 'San Diego', state: 'California', browseGovernmentList: ['0666000'], browseStateAbbrev: 'CA' },
  { label: 'San Francisco', state: 'California', browseGovernmentList: ['0667000'], browseStateAbbrev: 'CA' },
  { label: 'San Jose', state: 'California', browseGovernmentList: ['0668000'], browseStateAbbrev: 'CA' },
  { label: 'Portland', state: 'Maine', browseGovernmentList: ['2360545'], browseStateAbbrev: 'ME' },
  { label: 'Cambridge', state: 'Massachusetts', browseGovernmentList: ['2511000'], browseStateAbbrev: 'MA' },
  { label: 'Portland', state: 'Oregon', browseGovernmentList: ['4159000'], browseStateAbbrev: 'OR' },
];

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
  const addressInputRef = useRef(null);
  const navigate = useNavigate();
  const { isLoggedIn, myRepresentatives, myLocationNotSet, compassLoading } = useCompass();
  const posthog = usePostHog();

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

  const handleSearch = () => {
    if (!addressInput.trim()) return;
    posthog?.capture('address_searched', { method: 'manual' });
    navigate(`/results?q=${encodeURIComponent(addressInput.trim())}`);
  };

  const handleAreaClick = (area) => {
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

                {/* Address search — long input left, compact Search button right */}
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
                    disabled={!addressInput.trim()}
                    className="px-5 py-4 text-base font-bold text-black bg-ev-yellow rounded-xl hover:bg-ev-yellow-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                  >
                    Search
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
                  className={`flex items-start gap-4 p-5 rounded-2xl border transition-colors ${
                    active
                      ? 'bg-white dark:bg-ev-navy-card border-[var(--ev-teal)] dark:border-ev-teal-light'
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

      {/* ── Area + Address Section ── */}
      <section className="w-full px-8 sm:px-12 lg:px-24 py-16">
        <h2 className="text-2xl sm:text-3xl font-semibold text-[var(--ev-teal)] dark:text-ev-teal-light mb-2">
          Choose an Alpha Community
        </h2>
        <p className="text-base text-gray-500 dark:text-gray-400 mb-8">
          Each one is a preview of the full Essentials experience.
        </p>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_3fr] gap-8 items-start">

          {/* Counties — 1/4 width */}
          <div className="flex flex-col gap-2">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">Counties</p>
            {COVERAGE_COUNTIES.map((area) => (
              <button
                key={`${area.label}-${area.state}`}
                onClick={() => handleAreaClick(area)}
                className="w-full text-left px-4 py-4 bg-white dark:bg-gray-900 border-2 border-[var(--ev-teal)] dark:border-ev-teal-light rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--ev-teal)] focus:ring-offset-2"
              >
                <div className="text-sm font-semibold text-[var(--ev-teal)] dark:text-ev-teal-light leading-tight">{area.label}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{area.state}</div>
              </button>
            ))}
          </div>

          {/* Cities — 3 columns, alphabetized horizontally then vertically */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">Cities</p>
            <div className="grid grid-cols-3 gap-2">
              {COVERAGE_CITIES.map((area) => (
                <button
                  key={`${area.label}-${area.state}`}
                  onClick={() => handleAreaClick(area)}
                  className="w-full text-left px-4 py-4 bg-white dark:bg-gray-900 border-2 border-[var(--ev-teal-dark)] dark:border-[var(--ev-teal)] rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--ev-teal-dark)] focus:ring-offset-2"
                >
                  <div className="text-sm font-semibold text-[var(--ev-teal-dark)] dark:text-[var(--ev-teal)] leading-tight">{area.label}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{area.state}</div>
                </button>
              ))}
            </div>
          </div>

        </div>
      </section>

    </Layout>
  );
}
