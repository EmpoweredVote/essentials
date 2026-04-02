import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { useCompass } from '../contexts/CompassContext';

export default function Landing() {
  const [addressInput, setAddressInput] = useState('');
  const navigate = useNavigate();
  const { isLoggedIn, myRepresentatives, compassLoading } = useCompass();

  // Auto-redirect Connected users who have representatives data — skip address input entirely
  useEffect(() => {
    if (!compassLoading && isLoggedIn && myRepresentatives && myRepresentatives.length > 0) {
      navigate('/results?prefilled=true', { replace: true });
    }
  }, [compassLoading, isLoggedIn, myRepresentatives, navigate]);

  const handleSearch = () => {
    if (!addressInput.trim()) return;
    navigate(`/results?q=${encodeURIComponent(addressInput.trim())}`);
  };

  return (
    <Layout>
    <div className="min-h-screen bg-[var(--ev-bg-light)]">

      <main className="container mx-auto px-4 sm:px-6 py-16">
        <div className="flex flex-col items-center justify-center gap-12">
          {/* Content */}
          <div className="flex-1 max-w-xl text-center">
            <h1 className="text-3xl sm:text-5xl font-bold text-[var(--ev-teal)] mb-6">
              Find Your Representatives
            </h1>
            <p className="text-xl text-gray-700 mb-8">
              Enter your address to see who represents you
            </p>

            {/* Search Input + Button */}
            <div className="flex flex-col sm:flex-row gap-3">
              <input
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
          </div>


        </div>
      </main>
    </div>
    </Layout>
  );
}
