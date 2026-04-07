import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  fetchPolitician,
  fetchLegislativeCommittees,
  fetchLegislativeLeadership,
  fetchLegislativeBills,
  fetchLegislativeVotes,
} from '../lib/api';
import { LegislativeRecord } from '@empoweredvote/ev-ui';
import { Layout } from '../components/Layout';

function LegislativeRecordPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [polName, setPolName] = useState('');
  const [committees, setCommittees] = useState([]);
  const [leadership, setLeadership] = useState([]);
  const [bills, setBills] = useState([]);
  const [votes, setVotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      fetchPolitician(id),
      fetchLegislativeCommittees(id),
      fetchLegislativeLeadership(id),
      fetchLegislativeBills(id, { limit: 200 }),
      fetchLegislativeVotes(id, { limit: 200 }),
    ])
      .then(([pol, fetchedCommittees, fetchedLeadership, fetchedBills, fetchedVotes]) => {
        if (pol && (pol.first_name || pol.last_name)) {
          setPolName(`${pol.first_name || ''} ${pol.last_name || ''}`.trim());
        }
        setCommittees(fetchedCommittees || []);
        setLeadership(fetchedLeadership || []);
        setBills(fetchedBills || []);
        setVotes(fetchedVotes || []);
      })
      .catch((err) => console.error('Error loading legislative record:', err))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <Layout>
    <div className="min-h-screen bg-[var(--ev-bg-light)]">

      <main className="container mx-auto px-4 sm:px-6 py-4 sm:py-8 max-w-6xl">
        <button
          onClick={() => navigate(`/politician/${id}`)}
          className="mb-4 flex items-center gap-1 text-sm text-[var(--ev-teal)] hover:underline font-[Manrope]"
        >
          &larr; Back to {polName || 'Profile'}
        </button>

        <h1 className="text-2xl font-bold text-[var(--ev-teal)] mb-6 font-[Manrope]">
          Legislative Record{polName ? ` \u2014 ${polName}` : ''}
        </h1>

        <LegislativeRecord
          committees={committees}
          leadership={leadership}
          bills={bills}
          votes={votes}
          loading={loading}
          politicianName={polName}
        />
      </main>
    </div>
    </Layout>
  );
}

export default LegislativeRecordPage;
