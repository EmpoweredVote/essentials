import { useState } from 'react';
import { getOfficialVoterLink } from '../lib/voterResourceLinks';

/**
 * VoterResourcesCard — collapsible "how to vote" panel above the elections list
 * (any US address). Data: /api/essentials/voter-info (Google Civic / Voting
 * Information Project), with locations pre-sorted nearest-first by the backend.
 *
 * Location semantics (important):
 *   - pollingLocations  = Election Day. In precinct-based states Google returns
 *     the voter's ASSIGNED place (usually 1) — you can only vote there. In
 *     vote-center states it's many (vote anywhere).
 *   - earlyVoteSites / dropOffLocations = choose-any; show the nearest few.
 *
 * Always renders in address mode; off-cycle it shows a clear empty state plus
 * the state's official voter site. State-agnostic + antipartisan.
 */

const ico = 'w-[18px] h-[18px]';
const PinIcon = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={p.className || ico}>
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="2.6" />
  </svg>
);
const BoxIcon = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={p.className || ico}>
    <path d="M3 9 12 4l9 5v6l-9 5-9-5V9Z" /><path d="M3 9l9 5 9-5" /><path d="M12 14v7" />
  </svg>
);
const BallotIcon = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={p.className || ico}>
    <path d="M6 3h12v18H6z" /><path d="M9 8h6M9 12h6M9 16h3" />
  </svg>
);
const ClockIcon = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={p.className || ico}>
    <circle cx="12" cy="12" r="9" /><path d="M12 7.5V12l3 2" />
  </svg>
);
const ArrowIcon = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={p.className || 'w-4 h-4'}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);
const ChevronIcon = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={p.className || 'w-5 h-5'}>
    <path d="M6 9l6 6 6-6" />
  </svg>
);

function fmtDate(iso, { withYear = true } = {}) {
  if (!iso) return null;
  const d = new Date(/T/.test(iso) ? iso : `${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', ...(withYear ? { year: 'numeric' } : {}) });
}

function directionsUrl(loc) {
  const dest = loc.lat != null && loc.lng != null ? `${loc.lat},${loc.lng}` : loc.address || loc.name;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(dest)}`;
}

function HoursBlock({ hours }) {
  const [open, setOpen] = useState(false);
  const lines = hours.split('\n').map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return null;
  const collapsed = lines.length > 3 && !open;
  const shown = collapsed ? lines.slice(0, 2) : lines;
  return (
    <div className="mt-2 flex gap-1.5 text-xs text-gray-500 dark:text-gray-400">
      <ClockIcon className="w-3.5 h-3.5 mt-[2px] shrink-0 text-gray-400 dark:text-gray-500" />
      <div className="leading-relaxed">
        {shown.map((l, i) => <div key={i}>{l}</div>)}
        {lines.length > 3 && (
          <button type="button" onClick={() => setOpen((v) => !v)} className="mt-0.5 font-semibold text-[#00657c] dark:text-[#59b0c4] hover:underline">
            {collapsed ? `Show all ${lines.length} days` : 'Show less'}
          </button>
        )}
      </div>
    </div>
  );
}

function LocationTile({ loc, delay, highlight }) {
  const range = (() => {
    const s = fmtDate(loc.startDate, { withYear: false });
    const e = fmtDate(loc.endDate, { withYear: false });
    return s && e ? (s === e ? s : `${s} – ${e}`) : s || e || null;
  })();
  return (
    <li
      className={`rounded-xl p-3.5 opacity-0 translate-y-1 animate-[evfade_.45s_ease_forwards] ${
        highlight
          ? 'border-l-[3px] border-l-[#ff5740] border border-gray-100 dark:border-white/[0.06] bg-[#ff5740]/[0.04]'
          : 'border border-gray-100 dark:border-white/[0.06] bg-gray-50/70 dark:bg-white/[0.03]'
      }`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <p className="font-semibold text-gray-900 dark:text-gray-100 leading-snug">{loc.name}</p>
      {loc.address && <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5">{loc.address}</p>}
      {range && <p className="text-xs font-semibold text-[#00657c] dark:text-[#59b0c4] mt-1">{range}</p>}
      {loc.hours && <HoursBlock hours={loc.hours} />}
      {(loc.address || (loc.lat != null && loc.lng != null)) && (
        <a href={directionsUrl(loc)} target="_blank" rel="noopener noreferrer"
          className="mt-2.5 inline-flex items-center gap-1 text-sm font-semibold text-[#00657c] dark:text-[#59b0c4] hover:gap-1.5 transition-all">
          Get directions <ArrowIcon className="w-3.5 h-3.5" />
        </a>
      )}
    </li>
  );
}

function Section({ icon, title, note, locations, defaultVisible, highlight }) {
  const [expanded, setExpanded] = useState(false);
  if (!locations || locations.length === 0) return null;
  const total = locations.length;
  const shown = expanded ? locations : locations.slice(0, defaultVisible);
  const extra = total - defaultVisible;
  return (
    <section>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[#00657c] dark:text-[#59b0c4]">{icon}</span>
        <h4 className="text-[13px] font-bold uppercase tracking-wide text-gray-700 dark:text-gray-200">{title}</h4>
        {total > 1 && <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 tabular-nums">{total}</span>}
      </div>
      {note && <p className="-mt-1 mb-2 text-xs text-gray-500 dark:text-gray-400">{note}</p>}
      <ul className="space-y-2.5">
        {shown.map((loc, i) => <LocationTile key={`${loc.name}-${i}`} loc={loc} delay={i < defaultVisible ? i * 60 : 0} highlight={highlight} />)}
      </ul>
      {extra > 0 && (
        <button type="button" onClick={() => setExpanded((v) => !v)}
          className="mt-2.5 inline-flex items-center gap-1 text-sm font-semibold text-[#00657c] dark:text-[#59b0c4] hover:underline">
          {expanded ? 'Show fewer' : `Show ${extra} more — nearest first`}
        </button>
      )}
    </section>
  );
}

export default function VoterResourcesCard({ voterInfo, loading = false, stateName = null, stateCode = null }) {
  const [open, setOpen] = useState(false);

  const info = voterInfo || {};
  const polling = info.pollingLocations || [];
  const early = info.earlyVoteSites || [];
  const dropBoxes = info.dropOffLocations || [];
  const assigned = polling.length === 1; // precinct state → the voter's assigned place
  const hasLocations = polling.length > 0 || early.length > 0 || dropBoxes.length > 0;

  const officialUrl = info.electionInfoUrl || getOfficialVoterLink(stateCode);
  const ballotUrl = info.ballotInfoUrl || null;
  const stateLabel = stateName || 'your state';
  const heading = stateName ? `How to vote in ${stateName}` : 'How to vote';
  const electionDateStr = fmtDate(info.electionDate);

  const collapsedHint = hasLocations
    ? assigned
      ? `Your polling place${early.length || dropBoxes.length ? ', early voting & drop boxes' : ''}`
      : 'Polling places, early voting & ballot drop boxes'
    : 'Official voting info & deadlines';

  const shell = 'mb-6 rounded-2xl border border-gray-200 dark:border-gray-700/80 bg-white dark:bg-[#161d2e] overflow-hidden shadow-sm';

  if (loading) {
    return (
      <div className={`${shell} px-5 py-4 animate-pulse flex items-center gap-3`}>
        <div className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-gray-700" />
        <div className="h-5 w-56 bg-gray-200 dark:bg-gray-700 rounded-lg" />
      </div>
    );
  }

  return (
    <div className={shell}>
      <style>{`@keyframes evfade{to{opacity:1;transform:none}}`}</style>

      {/* Accordion header — always visible, toggles the body */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full text-left px-5 py-3.5 flex items-center gap-3 bg-gradient-to-r from-[#00657c]/[0.06] to-transparent dark:from-[#59b0c4]/[0.06] hover:from-[#00657c]/[0.1] transition-colors"
      >
        <span className="shrink-0 grid place-items-center w-10 h-10 rounded-xl bg-[#00657c]/10 text-[#00657c] dark:bg-[#59b0c4]/15 dark:text-[#59b0c4]">
          <PinIcon className="w-5 h-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2 flex-wrap">
            <span className="text-[16px] font-extrabold text-gray-900 dark:text-gray-100">{heading}</span>
            {info.electionName && (
              <span className="inline-flex items-center rounded-full bg-[#fed12e]/20 text-[#7a5b00] dark:bg-[#fed12e]/10 dark:text-[#fed12e] px-2 py-0.5 text-[11px] font-semibold">
                {info.electionName}{electionDateStr ? ` · ${electionDateStr}` : ''}
              </span>
            )}
          </span>
          {!open && <span className="block text-[13px] text-gray-500 dark:text-gray-400 mt-0.5">{collapsedHint}</span>}
        </span>
        <ChevronIcon className={`shrink-0 w-5 h-5 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="px-5 pb-4 pt-1 border-t border-gray-100 dark:border-gray-700/60">
          {hasLocations ? (
            <div className="space-y-5 mt-3">
              <Section
                icon={<PinIcon />}
                title={assigned ? 'Your Election Day polling place' : 'Election Day vote centers'}
                note={assigned ? 'In your state you vote here on Election Day.' : 'Vote at any of these on Election Day.'}
                locations={polling}
                defaultVisible={assigned ? 1 : 2}
                highlight={assigned}
              />
              <Section icon={<ClockIcon />} title="Early voting" note="Vote in person before Election Day." locations={early} defaultVisible={2} />
              <Section icon={<BoxIcon />} title="Ballot drop boxes" locations={dropBoxes} defaultVisible={2} />
            </div>
          ) : (
            <div className="text-center py-6 px-2">
              <span className="mx-auto grid place-items-center w-14 h-14 rounded-2xl bg-[#00657c]/[0.07] text-[#00657c] dark:bg-[#59b0c4]/10 dark:text-[#59b0c4] mb-4">
                <PinIcon className="w-7 h-7" />
              </span>
              <h4 className="text-base font-bold text-gray-900 dark:text-gray-100">Voting locations aren't posted yet</h4>
              <p className="mt-1.5 text-sm text-gray-600 dark:text-gray-300 max-w-md mx-auto leading-relaxed">
                Your polling place, early-voting sites, and ballot drop boxes show up here as your election approaches — usually a few weeks before Election&nbsp;Day.
              </p>
              <a href={officialUrl} target="_blank" rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#00657c] dark:bg-[#59b0c4] px-4 py-2.5 text-sm font-bold text-white dark:text-[#0b1220] hover:opacity-90 transition-opacity">
                How to vote in {stateLabel}
                <ArrowIcon className="w-4 h-4" />
              </a>
            </div>
          )}

          {/* Ways to vote + sample ballot */}
          <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-700/60 flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
            <p className="text-xs text-gray-500 dark:text-gray-400 max-w-md">
              Mail-in, early-voting &amp; deadlines vary by state —{' '}
              <a href={officialUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-[#00657c] dark:text-[#59b0c4] hover:underline">
                see {stateLabel}'s official info
              </a>.
            </p>
            <a href={ballotUrl || officialUrl} target="_blank" rel="noopener noreferrer"
              className="shrink-0 inline-flex items-center gap-2 rounded-lg bg-[#ff5740] px-4 py-2 text-sm font-bold text-white hover:bg-[#e84e38] transition-colors">
              <BallotIcon className="w-4 h-4" />
              {ballotUrl ? 'View your sample ballot' : 'Find your ballot'}
            </a>
          </div>

          <p className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700/60 text-[11px] text-gray-400 dark:text-gray-500">
            Voting-location data comes from the Voting Information Project via the Google Civic Information API, which controls when it's released.
          </p>
        </div>
      )}
    </div>
  );
}
