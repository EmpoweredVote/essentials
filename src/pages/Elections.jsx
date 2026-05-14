import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import ElectionsView from '../components/ElectionsView';
import { CompassKey, useMediaQuery } from '@empoweredvote/ev-ui';
import { fetchElectionsByAddress, fetchMyElections } from '../lib/api';
import { computeStanceSpokes } from '../lib/compass';
import { useCompass } from '../contexts/CompassContext';
import { useTheme } from '../hooks/useTheme';

const SHORTCUTS = [
  { label: 'Monroe County', address: '100 W Kirkwood Ave, Bloomington, IN 47404' },
  { label: 'LA County', address: '500 W Temple St, Los Angeles, CA 90012' },
];

export default function Elections() {
  const navigate = useNavigate();
  const { isLoggedIn, userJurisdiction, compassLoading, userAnswers, allTopics, invertedSpokes, batchInvertSpokes, localLensActive, toggleLocalLens, judicialLensActive, toggleJudicialLens, enableCompass } = useCompass();
  const { isDark } = useTheme();
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const [compassMode, setCompassMode] = useState(() => {
    try { return localStorage.getItem('ev:compassMode') === 'true'; } catch { return false; }
  });
  const handleCompassModeChange = (val) => {
    setCompassMode(val);
    try { localStorage.setItem('ev:compassMode', val ? 'true' : 'false'); } catch {}
    if (val) enableCompass();
  };

  // Auto-apply Stance Max the first time user crosses the 3-answer threshold
  const prevAnswerCountRef = useRef(0);
  useEffect(() => {
    const count = userAnswers?.length ?? 0;
    const prev = prevAnswerCountRef.current;
    prevAnswerCountRef.current = count;
    if (prev < 3 && count >= 3) {
      const hasAnyInversion = Object.values(invertedSpokes || {}).some(Boolean);
      if (!hasAnyInversion && allTopics) {
        const newMap = computeStanceSpokes('max', userAnswers, allTopics, invertedSpokes || {});
        batchInvertSpokes(newMap);
      }
    }
  }, [userAnswers, invertedSpokes, allTopics, batchInvertSpokes]);

  // Auto-enable compass for calibrated users who haven't set an explicit preference
  useEffect(() => {
    if (!userAnswers || userAnswers.length < 3) return;
    try {
      if (localStorage.getItem('ev:compassMode') === null) {
        setCompassMode(true);
        localStorage.setItem('ev:compassMode', 'true');
      }
    } catch {}
  }, [userAnswers]);

  const handleStanceMax = () => {
    if (!userAnswers || !allTopics) return;
    const newMap = computeStanceSpokes('max', userAnswers, allTopics, invertedSpokes || {});
    batchInvertSpokes(newMap);
  };

  const handleStanceMin = () => {
    if (!userAnswers || !allTopics) return;
    const newMap = computeStanceSpokes('min', userAnswers, allTopics, invertedSpokes || {});
    batchInvertSpokes(newMap);
  };

  const [electionsData, setElectionsData] = useState(null); // null = not fetched
  const [fetchLoading, setFetchLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [locationLabel, setLocationLabel] = useState(null);
  const [addressInput, setAddressInput] = useState('');
  const [showChangeInput, setShowChangeInput] = useState(false);
  const [hideWithdrawn, setHideWithdrawn] = useState(false);

  // Tier-aware auto-load for connected users with a stored jurisdiction
  useEffect(() => {
    if (compassLoading) return;
    if (!isLoggedIn || !userJurisdiction) return;

    let cancelled = false;

    const autoFetch = async () => {
      setFetchLoading(true);
      setFetchError(null);
      const { elections, error, formattedAddress } = await fetchMyElections();
      if (cancelled) return;
      setFetchLoading(false);
      if (error) {
        setFetchError(error);
      } else {
        setElectionsData(elections);
        setLocationLabel(formattedAddress || [userJurisdiction.city, userJurisdiction.state].filter(Boolean).join(', '));
      }
    };

    autoFetch();
    return () => { cancelled = true; };
  }, [compassLoading, isLoggedIn, userJurisdiction]);

  const handleSearch = async (rawAddress) => {
    const addr = (rawAddress ?? addressInput).trim();
    if (!addr) return;

    setFetchLoading(true);
    setFetchError(null);

    const { elections, error } = await fetchElectionsByAddress(addr);
    setFetchLoading(false);

    if (error) {
      setFetchError(error);
    } else {
      setElectionsData(elections);
      setLocationLabel(addr);
      setShowChangeInput(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  // While CompassContext is resolving, show only the heading to prevent flash
  if (compassLoading) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold mb-6">Elections</h1>
        </div>
      </Layout>
    );
  }

  // Determine which UI mode we're in:
  // - connectedAutoLoad: logged in, has jurisdiction, results were auto-fetched
  // - addressMode: inform user OR connected-without-jurisdiction
  const connectedAutoLoad = isLoggedIn && userJurisdiction !== null;
  const showAddressInput = !connectedAutoLoad || showChangeInput;
  const showShortcuts = !connectedAutoLoad && electionsData === null;

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">Elections</h1>

        {/* Connected auto-load: show location label + Change button */}
        {connectedAutoLoad && locationLabel && !showChangeInput && (
          <div className="mb-4 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            <span>Showing elections for <strong>{locationLabel}</strong></span>
            <button
              onClick={() => setShowChangeInput(true)}
              className="text-[var(--ev-teal)] underline hover:text-[var(--ev-teal-dark)]"
            >
              Change
            </button>
          </div>
        )}

        {/* Address input — shown for Inform/no-jurisdiction, or when "Change" is clicked */}
        {showAddressInput && (
          <div className="mb-6">
            <div className="flex gap-2">
              <input
                type="text"
                value={addressInput}
                onChange={(e) => setAddressInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter your address"
                className="flex-1 border border-gray-300 dark:border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ev-teal)] bg-white dark:bg-gray-900 dark:text-white dark:placeholder-gray-500"
              />
              <button
                onClick={() => handleSearch()}
                disabled={fetchLoading}
                className="flex items-center gap-1 bg-[var(--ev-teal)] text-white px-4 py-2 rounded text-sm font-medium hover:bg-[var(--ev-teal-dark)] disabled:opacity-60"
              >
                {fetchLoading ? (
                  <svg
                    className="animate-spin h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8H4z"
                    />
                  </svg>
                ) : (
                  'Search'
                )}
              </button>
            </div>

            {fetchError && (
              <p className="mt-2 text-sm text-red-600">
                Address not recognized. Please enter a full street address.
              </p>
            )}

            {/* County shortcuts — only when no results loaded yet */}
            {showShortcuts && (
              <div className="mt-3 flex gap-2 flex-wrap">
                {SHORTCUTS.map(({ label, address }) => (
                  <button
                    key={label}
                    onClick={() => handleSearch(address)}
                    disabled={fetchLoading}
                    className="border border-[var(--ev-teal)] dark:border-ev-teal-light text-[var(--ev-teal)] dark:text-ev-teal-light px-3 py-1.5 rounded text-sm font-medium hover:bg-[var(--ev-bg-light)] dark:hover:bg-gray-800 disabled:opacity-60"
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Filter controls — only when results are loaded */}
        {electionsData && electionsData.length > 0 && (
          <div className="mb-4 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={hideWithdrawn}
                onChange={(e) => setHideWithdrawn(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-[var(--ev-teal)] focus:ring-[var(--ev-teal)]"
              />
              Hide withdrawn candidates
            </label>
          </div>
        )}

        {/* Sticky CompassKey — only shown when compass mode is active */}
        {compassMode && (
          <div
            style={{
              position: 'sticky',
              top: 8,
              zIndex: 30,
              display: 'flex',
              justifyContent: 'flex-end',
              paddingRight: isDesktop ? 48 : 12,
              paddingTop: 8,
              marginBottom: -70,
              pointerEvents: 'none',
            }}
          >
            <div style={{ pointerEvents: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ display: 'flex', gap: 4 }}>
                <button
                  className="stance-btn"
                  onClick={toggleLocalLens}
                  title={localLensActive ? 'Exit Local Lens' : 'Local Lens — 8 local questions'}
                  style={localLensActive ? { background: '#5A9A6E', borderColor: '#5A9A6E', color: '#fff' } : {}}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="7" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </button>
                <button
                  className="stance-btn"
                  onClick={toggleJudicialLens}
                  title={judicialLensActive ? 'Exit Judicial Lens' : 'Judicial Lens — 8 judicial questions'}
                  style={judicialLensActive ? { background: '#C2440A', borderColor: '#C2440A', color: '#fff' } : {}}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2L3 13l3 3L17 5l-3-3z" />
                    <path d="M7 12l4 4" />
                    <path d="M3 21h18" />
                  </svg>
                </button>
                <button className="stance-btn" onClick={handleStanceMin} title="Stance Min — pull strong spokes inward">⊟</button>
                <button className="stance-btn" onClick={handleStanceMax} title="Stance Max — push weak spokes outward">⊞</button>
              </div>
              <CompassKey compact={!isDesktop} />
            </div>
          </div>
        )}

        {/* Elections results */}
        <ElectionsView
          elections={electionsData}
          loading={fetchLoading}
          hideWithdrawn={hideWithdrawn}
          compassMode={compassMode}
          isDark={isDark}
          onCandidateClick={(id) => navigate('/candidate/' + id)}
        />
      </div>
    </Layout>
  );
}
