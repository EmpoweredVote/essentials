import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  fetchPolitician,
  fetchLegislativeCommittees,
  fetchLegislativeLeadership,
  fetchLegislativeBills,
  fetchLegislativeVotes,
  fetchAllCouncilRecord,
} from '../lib/api';
import { LegislativeRecord, CouncilVoteRecord } from '@empoweredvote/ev-ui';
import { Layout } from '../components/Layout';
import LegiScanAttribution from '../components/LegiScanAttribution';
import { councilLayout } from '../lib/councilRecord';
import CouncilRecordAttribution from '../components/CouncilRecordAttribution';

function LegislativeRecordPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [polName, setPolName] = useState('');
  const [committees, setCommittees] = useState([]);
  const [leadership, setLeadership] = useState([]);
  const [bills, setBills] = useState([]);
  const [votes, setVotes] = useState([]);
  const [governmentName, setGovernmentName] = useState('');
  const [council, setCouncil] = useState({ total: 0, items: [] });
  const [loading, setLoading] = useState(true);

  const layout = councilLayout({ loading, total: council.total });

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      fetchPolitician(id),
      fetchLegislativeCommittees(id),
      fetchLegislativeLeadership(id),
      fetchLegislativeBills(id, { limit: 200 }),
      fetchLegislativeVotes(id, { limit: 200 }),
      fetchAllCouncilRecord(id),
    ])
      .then(([pol, fetchedCommittees, fetchedLeadership, fetchedBills, fetchedVotes, fetchedCouncil]) => {
        if (pol && (pol.first_name || pol.last_name)) {
          setPolName(`${pol.first_name || ''} ${pol.last_name || ''}`.trim());
        }
        setGovernmentName((pol && pol.government_name) || '');
        setCouncil(fetchedCouncil || { total: 0, items: [] });
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
    <div className="min-h-screen bg-[var(--ev-bg-light)] dark:bg-ev-navy">

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

        {/* 'pending' renders the same loading placeholder as before the council work. */}
        {layout === 'council' ? (
          <>
            <CouncilVoteRecord items={council.items} loading={loading} />
            <CouncilRecordAttribution governmentName={governmentName} />
          </>
        ) : (
          <>
            <div className="ev-legislative-record-wrapper">
              <LegislativeRecord
                committees={committees}
                leadership={leadership}
                bills={bills}
                votes={votes}
                loading={loading}
                politicianName={polName}
              />
            </div>
            <LegiScanAttribution bills={bills} votes={votes} />
          </>
        )}
      </main>
    </div>
    </Layout>
  );
}

export default LegislativeRecordPage;
