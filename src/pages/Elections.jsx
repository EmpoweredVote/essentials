import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import ElectionsView from '../components/ElectionsView';
import { fetchElectionsByAddress, fetchMyElections } from '../lib/api';
import { useCompass } from '../contexts/CompassContext';

const SHORTCUTS = [
  { label: 'Monroe County', address: '100 W Kirkwood Ave, Bloomington, IN 47404' },
  { label: 'LA County', address: '500 W Temple St, Los Angeles, CA 90012' },
];

export default function Elections() {
  const navigate = useNavigate();
  const { isLoggedIn, userJurisdiction, compassLoading } = useCompass();

  const [electionsData, setElectionsData] = useState(null); // null = not fetched
  const [fetchLoading, setFetchLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [locationLabel, setLocationLabel] = useState(null);
  const [addressInput, setAddressInput] = useState('');
  const [showChangeInput, setShowChangeInput] = useState(false);

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
          <div className="mb-4 flex items-center gap-2 text-sm text-gray-600">
            <span>Showing elections for <strong>{locationLabel}</strong></span>
            <button
              onClick={() => setShowChangeInput(true)}
              className="text-teal-600 underline hover:text-teal-800"
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
                className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <button
                onClick={() => handleSearch()}
                disabled={fetchLoading}
                className="flex items-center gap-1 bg-teal-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-teal-700 disabled:opacity-60"
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
                    className="border border-teal-600 text-teal-700 px-3 py-1.5 rounded text-sm font-medium hover:bg-teal-50 disabled:opacity-60"
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Elections results */}
        <ElectionsView
          elections={electionsData}
          loading={fetchLoading}
          onCandidateClick={(id) => navigate('/candidate/' + id)}
        />
      </div>
    </Layout>
  );
}
