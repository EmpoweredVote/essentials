import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { fetchPolitician, fetchJudicialRecord } from '../lib/api';
import { JudicialRecordDetail } from '@chrisandrewsedu/ev-ui';
import { Layout } from '../components/Layout';

function JudicialRecord() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [pol, setPol] = useState({});
  const [judicialRecord, setJudicialRecord] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);

    (async () => {
      try {
        const [result, jRecord] = await Promise.all([
          fetchPolitician(id),
          fetchJudicialRecord(id),
        ]);
        setPol(result);
        setJudicialRecord(jRecord);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  return (
    <Layout>
      <div className="min-h-screen bg-[var(--ev-bg-light)]">
        <main className="container mx-auto px-4 sm:px-6 py-4 sm:py-8 max-w-6xl">
          {loading ? (
            <div className="flex justify-center items-center py-24">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-[var(--ev-teal)] border-t-transparent" />
            </div>
          ) : (
            <JudicialRecordDetail
              politician={pol}
              judicialRecord={judicialRecord}
              onBack={() => navigate(`/politician/${id}`)}
            />
          )}
        </main>
      </div>
    </Layout>
  );
}

export default JudicialRecord;
