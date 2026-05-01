import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { useCompass } from '../contexts/CompassContext';
import useGooglePlacesAutocomplete from '../hooks/useGooglePlacesAutocomplete';
import { searchPoliticiansByName } from '../lib/api';

const COVERAGE_AREAS = [
  { county: 'Monroe County', state: 'Indiana', address: '100 W Kirkwood Ave, Bloomington, IN 47404' },
  { county: 'Los Angeles County', state: 'California', browseGeoId: '06037', browseMtfcc: 'G4020', browseCityFilter: 'los angeles', browseSchoolFilter: 'los angeles unified' },
];

export default function Landing() {
  const [addressInput, setAddressInput] = useState('');
  const addressInputRef = useRef(null);
  const navigate = useNavigate();
  const { isLoggedIn, myRepresentatives, myLocationNotSet, compassLoading } = useCompass();

  useGooglePlacesAutocomplete(addressInputRef, {
    onPlaceSelected: (addr) => {
      setAddressInput(addr);
      navigate(`/results?q=${encodeURIComponent(addr)}`);
    },
  });

  // Auto-redirect Connected users who have representatives data — skip address input entirely
  useEffect(() => {
    if (!compassLoading && isLoggedIn && myRepresentatives && myRepresentatives.length > 0) {
      navigate('/results?prefilled=true', { replace: true });
    }
  }, [compassLoading, isLoggedIn, myRepresentatives, navigate]);

  // Re-check when the user returns to this tab after setting their location elsewhere
  // (CompassContext loads once on mount; visibilitychange triggers a fresh load)
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
    navigate(`/results?q=${encodeURIComponent(addressInput.trim())}`);
  };

  // Name search state
  const [nameQuery, setNameQuery] = useState('');
  const [nameResults, setNameResults] = useState([]);
  const [nameStatus, setNameStatus] = useState('idle'); // idle | loading | fresh | error
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

  return (
    <Layout>
    <div className="min-h-screen bg-[var(--ev-bg-light)]">

      <main className="container mx-auto px-4 sm:px-6 py-16">
        <div className="flex flex-col items-center justify-center gap-12">
          {/* Content */}
          <div className="flex-1 max-w-xl text-center">
            <h1 className="text-3xl sm:text-5xl font-semibold text-[var(--ev-teal)] mb-6">
              Find Your Representatives
            </h1>
            <p className="text-xl text-gray-700 mb-8">
              Enter your address to see who represents you
            </p>

            {/* Coverage area cards */}
            <p className="text-sm text-gray-500 mb-3">We currently cover:</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-2">
              {COVERAGE_AREAS.map((area) => (
                <button
                  key={area.county}
                  onClick={() => {
                    if (area.browseGeoId) {
                      const params = new URLSearchParams({
                        browse_geo_id: area.browseGeoId,
                        browse_mtfcc: area.browseMtfcc,
                        browse_label: area.county,
                      });
                      if (area.browseCityFilter) params.set('browse_city_filter', area.browseCityFilter);
                      if (area.browseSchoolFilter) params.set('browse_school_filter', area.browseSchoolFilter);
                      navigate(`/results?${params}`);
                    } else {
                      navigate(`/results?q=${encodeURIComponent(area.address)}`);
                    }
                  }}
                  className="flex-1 text-left px-4 py-3 bg-white border-2 border-[var(--ev-teal)] rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--ev-teal)] focus:ring-offset-2"
                >
                  <div className="text-base font-semibold text-[var(--ev-teal)]">{area.county}</div>
                  <div className="text-sm text-gray-600">{area.state}</div>
                </button>
              ))}
            </div>

            {/* Browse by location link */}
            <div className="text-center mt-2 mb-2">
              <button
                onClick={() => navigate('/results?mode=browse')}
                className="text-sm text-[var(--ev-teal)] hover:underline cursor-pointer bg-transparent border-none"
                style={{ fontFamily: "'Manrope', sans-serif" }}
              >
                Browse by location →
              </button>
            </div>

            {!compassLoading && isLoggedIn && myLocationNotSet && (
              /* Connected user with no location stored — nudge to set it, but don't block the form */
              <div className="mt-4 px-4 py-3 bg-white border border-[var(--ev-teal)] rounded-lg shadow-sm text-center text-sm">
                <a
                  href="https://app.empowered.vote/settings/location"
                  className="font-semibold text-[var(--ev-teal)] hover:underline"
                >
                  Set your home location in your profile
                </a>
                {' '}to get taken straight to your elected leaders on every visit.
              </div>
            )}

            {/* "or search by address" divider */}
            <div className="relative my-6">
              <hr className="border-gray-200" />
              <span className="absolute left-1/2 -translate-x-1/2 -top-2.5 bg-[var(--ev-bg-light)] px-3 text-sm text-gray-400">
                or search by address
              </span>
            </div>

            {/* Search Input + Button */}
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                ref={addressInputRef}
                type="text"
                value={addressInput}
                onChange={(e) => setAddressInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Enter your full street address"
                className="flex-1 min-w-0 px-4 py-3 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--ev-teal)] bg-white shadow-sm"
              />
              <button
                onClick={handleSearch}
                disabled={!addressInput.trim()}
                className="px-4 sm:px-8 py-3 text-lg font-bold text-white bg-[var(--ev-teal)] rounded-lg hover:bg-[var(--ev-teal-dark)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Search
              </button>
            </div>

            {/* "or search by name" divider */}
            <div className="relative my-6">
              <hr className="border-gray-200" />
              <span className="absolute left-1/2 -translate-x-1/2 -top-2.5 bg-[var(--ev-bg-light)] px-3 text-sm text-gray-400">
                or search by name
              </span>
            </div>

            {/* Name Search Input */}
            <div className="relative">
              <svg
                width="18" height="18" viewBox="0 0 24 24" fill="none"
                stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="7" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                value={nameQuery}
                onChange={(e) => setNameQuery(e.target.value)}
                placeholder="Search candidates by name…"
                aria-label="Search candidates by name"
                className="w-full pl-12 pr-4 py-3 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--ev-teal)] bg-white shadow-sm"
              />
            </div>

            {/* Name Search Results */}
            {nameQuery.trim().length >= 2 && (
              <div className="mt-2 text-left">
                {nameStatus === 'loading' && (
                  <p className="text-sm text-gray-500 py-2">Searching&hellip;</p>
                )}
                {nameStatus === 'fresh' && nameResults.length === 0 && (
                  <p className="text-sm text-gray-500 py-2">No candidates match &ldquo;{nameQuery.trim()}&rdquo;.</p>
                )}
                {nameStatus === 'error' && (
                  <p className="text-sm text-red-500 py-2">Search failed. Try again.</p>
                )}
                {nameStatus === 'fresh' && nameResults.length > 0 && (
                  <ul className="divide-y divide-gray-100 bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                    {nameResults.map((pol) => (
                      <li key={pol.id}>
                        <Link
                          to={`/politician/${pol.id}`}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--ev-bg-light)] transition-colors"
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
                            <div className="font-semibold text-[var(--ev-teal)] truncate">{pol.full_name}</div>
                            {(pol.office_title || pol.representing_state) && (
                              <div className="text-sm text-gray-500 truncate">
                                {[pol.office_title, pol.representing_state].filter(Boolean).join(' — ')}
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
              <p className="mt-2 text-sm text-gray-400 text-left">Type at least 2 letters to search.</p>
            )}
          </div>


        </div>
      </main>
    </div>
    </Layout>
  );
}
