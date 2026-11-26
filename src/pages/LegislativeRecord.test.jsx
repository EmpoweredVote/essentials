// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

vi.mock('@empoweredvote/ev-ui', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    // ev-ui 0.19.0 is not published yet, so stub the council component too.
    CouncilVoteRecord: () => <section>Council votes section</section>,
    LegislativeRecord: () => <section>Sponsored Legislation</section>,
  };
});

vi.mock('../components/Layout', () => ({ Layout: ({ children }) => <div>{children}</div> }));

vi.mock('../lib/api', () => ({
  fetchPolitician: vi.fn(),
  fetchLegislativeCommittees: vi.fn(),
  fetchLegislativeLeadership: vi.fn(),
  fetchLegislativeBills: vi.fn(),
  fetchLegislativeVotes: vi.fn(),
  fetchCouncilRecord: vi.fn(),
}));

import * as api from '../lib/api';
import LegislativeRecordPage from './LegislativeRecord';

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/politician/pol-1/legislative']}>
      <Routes>
        <Route path="/politician/:id/legislative" element={<LegislativeRecordPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  api.fetchPolitician.mockResolvedValue({
    first_name: 'Test',
    last_name: 'Member',
    government_name: 'City of Testville',
  });
  api.fetchLegislativeCommittees.mockResolvedValue([]);
  api.fetchLegislativeLeadership.mockResolvedValue([]);
  api.fetchLegislativeBills.mockResolvedValue([]);
  api.fetchLegislativeVotes.mockResolvedValue([]);
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('LegislativeRecord page', () => {
  it('shows the council section and attribution, not the bills layout, when total > 0', async () => {
    api.fetchCouncilRecord.mockResolvedValue({ total: 2, items: [{ bill_id: 'a' }, { bill_id: 'b' }] });
    renderPage();
    expect(await screen.findByText('Council votes section')).toBeTruthy();
    expect(screen.queryByText('Sponsored Legislation')).toBeNull();
    expect(screen.getByText(/From the clerk's records of the Testville Common Council\./)).toBeTruthy();
  });

  it('keeps today\'s layout when total is 0', async () => {
    api.fetchCouncilRecord.mockResolvedValue({ total: 0, items: [] });
    renderPage();
    expect(await screen.findByText('Sponsored Legislation')).toBeTruthy();
    expect(screen.queryByText('Council votes section')).toBeNull();
    expect(screen.queryByText(/clerk's records/)).toBeNull();
  });
});
