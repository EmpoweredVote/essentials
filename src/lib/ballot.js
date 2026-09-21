/**
 * Merge every upcoming election for an address into a single ballot.
 *
 * A voter's ballot is split across several election records (city, county, state,
 * federal). Surfacing only one record silently dropped whole levels — e.g. an LA
 * address returns the county general and the statewide/federal general as two
 * separate records on the same day, and only the first used to survive. This merges
 * them so every level shows together.
 *
 * Rules:
 *  - Consider only elections dated today or later ("upcoming").
 *  - If none are upcoming, fall back to the single most recent past election.
 *  - Merge all upcoming elections' races into one list.
 *  - A seat that appears in more than one upcoming election (a primary and a general
 *    for the same office) is shown once — the soonest instance, which is the voter's
 *    next action for that seat. Dedupe ACROSS elections only, never within one, so
 *    distinct same-titled races on a single ballot are preserved.
 *  - Each surviving race carries its own election_type/election_date so mixed-date
 *    and primary races still label correctly downstream.
 *
 * The payload has no office_id, so a seat is keyed by district_type + normalized
 * position name, which is stable across a seat's primary and general.
 *
 * @param {Array<object>|null|undefined} elections - raw election records from the API
 * @param {Date} [now=new Date()] - injectable "today", for testing
 * @returns {Array<object>} zero or one synthetic election ({ election_id: 'ballot', races, ... })
 */
export function mergeUpcomingBallot(elections, now = new Date()) {
  if (!elections || elections.length === 0) return [];

  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  const dated = elections.filter((e) => e.election_date);
  const upcoming = dated
    .filter((e) => new Date(e.election_date + 'T12:00:00') >= today)
    .sort((a, b) => new Date(a.election_date) - new Date(b.election_date));

  // No upcoming election → fall back to the most recent past election.
  if (upcoming.length === 0) {
    const past = [...dated].sort(
      (a, b) => new Date(b.election_date) - new Date(a.election_date)
    );
    return past.length ? [past[0]] : [];
  }

  const seatKeyOf = (r) =>
    `${r.district_type || ''}|${String(r.position_name || '').toLowerCase().trim()}`;

  const seenSeats = new Set();
  const merged = [];
  for (const e of upcoming) {
    const seatsThisElection = new Set();
    for (const race of e.races || []) {
      const seatKey = seatKeyOf(race);
      // Skip only if this seat already came from an EARLIER (sooner) upcoming election.
      if (seenSeats.has(seatKey) && !seatsThisElection.has(seatKey)) continue;
      seatsThisElection.add(seatKey);
      merged.push({
        ...race,
        election_type: race.election_type ?? e.election_type,
        election_date: race.election_date ?? e.election_date,
      });
    }
    for (const k of seatsThisElection) seenSeats.add(k);
  }

  const nearest = upcoming[0];
  return [
    {
      election_id: 'ballot',
      election_type: nearest.election_type,
      election_date: nearest.election_date,
      races: merged,
    },
  ];
}
