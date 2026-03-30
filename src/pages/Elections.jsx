import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { fetchElectionsByAddress } from '../lib/api';
import { classifyCategory } from '../lib/classify';

const TIER_ORDER = ['Federal', 'State', 'Local'];

function formatElectionDate(dateStr) {
  if (!dateStr) return '';
  // Parse as UTC date to avoid timezone shifts (dateStr is YYYY-MM-DD)
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(Date.UTC(year, month - 1, day));
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}

function electionTypeBadge(electionType) {
  if (!electionType) return null;
  const label = electionType === 'primary' ? 'Primary Election' : 'General Election';
  const color = electionType === 'primary'
    ? 'bg-yellow-100 text-yellow-800'
    : 'bg-blue-100 text-blue-800';
  return (
    <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded ${color}`}>
      {label}
    </span>
  );
}

function CandidateCard({ candidate }) {
  const { candidate_id, full_name, photo_url, is_incumbent, politician_id } = candidate;

  const initials = (full_name || '')
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const content = (
    <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      {/* Avatar */}
      <div className="flex-shrink-0 w-10 h-10 rounded-full overflow-hidden bg-[var(--ev-light-blue)] flex items-center justify-center">
        {photo_url ? (
          <img src={photo_url} alt={full_name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-white text-sm font-bold">{initials}</span>
        )}
      </div>
      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 truncate">{full_name}</p>
        {is_incumbent && (
          <span className="inline-block text-xs bg-[var(--ev-teal)] text-white px-1.5 py-0.5 rounded mt-0.5">
            Incumbent
          </span>
        )}
      </div>
    </div>
  );

  if (politician_id) {
    return (
      <Link to={`/candidate/${politician_id}`} key={candidate_id} className="block">
        {content}
      </Link>
    );
  }
  return <div key={candidate_id}>{content}</div>;
}

function RaceCard({ race }) {
  const { race_id, position_name, seats, candidates } = race;
  return (
    <div key={race_id} className="mb-4">
      <div className="flex items-center gap-2 mb-2">
        <h4 className="text-sm font-semibold text-gray-800">{position_name}</h4>
        {seats > 1 && (
          <span className="text-xs text-gray-500">{seats} seats</span>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {candidates.map((c) => (
          <CandidateCard key={c.candidate_id} candidate={c} />
        ))}
      </div>
    </div>
  );
}

function ElectionCard({ election }) {
  const { election_id, election_name, election_date, election_type, races } = election;

  // Group races by tier using classifyCategory
  const grouped = {};
  for (const race of races) {
    const cat = classifyCategory({ district_type: race.district_type, office_title: race.position_name });
    const tier = cat?.tier || 'Local';
    if (!grouped[tier]) grouped[tier] = [];
    grouped[tier].push(race);
  }

  return (
    <div key={election_id} className="mb-8 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <h3 className="text-base font-bold text-[var(--ev-teal)]">{election_name}</h3>
          {electionTypeBadge(election_type)}
        </div>
        <p className="text-sm text-gray-600">{formatElectionDate(election_date)}</p>
      </div>

      {/* Races grouped by tier */}
      <div className="px-5 py-4">
        {TIER_ORDER.filter((t) => grouped[t]?.length > 0).map((tier) => (
          <div key={tier} className="mb-5 last:mb-0">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">
              {tier}
            </h4>
            {grouped[tier].map((race) => (
              <RaceCard key={race.race_id} race={race} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Elections() {
  const [addressInput, setAddressInput] = useState('');
  const [submittedAddress, setSubmittedAddress] = useState('');
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    const addr = addressInput.trim();
    if (!addr) return;

    setLoading(true);
    setError(null);
    setSearched(false);
    setSubmittedAddress(addr);

    const result = await fetchElectionsByAddress(addr);

    setLoading(false);
    setSearched(true);

    if (result.error === 'geocoder_unavailable') {
      setError('The address lookup service is temporarily unavailable. Please try again in a moment.');
      setElections([]);
    } else if (result.error) {
      setError('Something went wrong fetching elections. Please try again.');
      setElections([]);
    } else {
      setElections(result.elections);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-[var(--ev-bg-light)]">
        <main className="container mx-auto px-4 sm:px-6 py-10">

          {/* Page title */}
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-[var(--ev-teal)] mb-2">
              Election Central
            </h1>
            <p className="text-gray-600">
              Enter your address to see upcoming elections in your area.
            </p>
          </div>

          {/* Address input */}
          <div className="flex flex-col sm:flex-row gap-3 mb-8 max-w-2xl">
            <input
              type="text"
              value={addressInput}
              onChange={(e) => setAddressInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Enter your address (e.g. 401 N Morton St, Bloomington, IN)"
              className="flex-1 min-w-0 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--ev-teal)] bg-white shadow-sm"
            />
            <button
              onClick={handleSearch}
              disabled={!addressInput.trim() || loading}
              className="px-6 py-3 font-bold text-white bg-[var(--ev-teal)] rounded-lg hover:bg-[var(--ev-teal-dark)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
            >
              {loading ? 'Searching...' : 'Find Elections'}
            </button>
          </div>

          {/* Loading state */}
          {loading && (
            <div className="text-center py-12 text-gray-500">
              Finding elections near your address...
            </div>
          )}

          {/* Error state */}
          {!loading && error && (
            <div className="max-w-2xl p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && searched && elections.length === 0 && (
            <div className="max-w-2xl py-12 text-center text-gray-500">
              <p className="text-lg">No upcoming elections found for this address.</p>
              <p className="text-sm mt-2 text-gray-400">
                Try a more specific address, or check back closer to an election date.
              </p>
            </div>
          )}

          {/* Elections list */}
          {!loading && elections.length > 0 && (
            <div className="max-w-2xl">
              <p className="text-sm text-gray-500 mb-4">
                Showing elections for: <span className="font-medium text-gray-700">{submittedAddress}</span>
              </p>
              {elections.map((election) => (
                <ElectionCard key={election.election_id} election={election} />
              ))}
            </div>
          )}

        </main>
      </div>
    </Layout>
  );
}
