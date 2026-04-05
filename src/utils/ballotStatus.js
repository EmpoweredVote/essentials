/**
 * Compute the US general election date (first Tuesday after the first Monday
 * in November) for the election year preceding the given term end date.
 *
 * If the term ends in January–March of year X, the relevant election is in
 * November of year X-1 (the election that decided that term). Otherwise the
 * election is in November of year X.
 *
 * @param {Date} termEndDate
 * @returns {Date} Election day (first Tuesday after first Monday in November)
 */
export function getElectionDate(termEndDate) {
  const month = termEndDate.getMonth(); // 0-indexed
  const year = termEndDate.getFullYear();
  // Jan (0), Feb (1), Mar (2) → election was the prior November
  const electionYear = month <= 2 ? year - 1 : year;

  // Find the first Monday in November of electionYear
  const nov1 = new Date(electionYear, 10, 1); // November 1
  const dayOfWeek = nov1.getDay(); // 0=Sun, 1=Mon, …, 6=Sat
  // Days until next Monday (0 if already Monday)
  const daysToMonday = dayOfWeek === 1 ? 0 : (8 - dayOfWeek) % 7;
  const firstMonday = new Date(electionYear, 10, 1 + daysToMonday);
  // Election day is the Tuesday immediately after that Monday
  const electionDay = new Date(firstMonday);
  electionDay.setDate(firstMonday.getDate() + 1);
  return electionDay;
}

/**
 * Determine whether a seat is "on the ballot".
 *
 * Priority order:
 *   1. Real primary date from DB (if valid and in the future)
 *   2. Real general date from DB (if valid and in the future)
 *   3. Heuristic fallback: term end within 1 year (existing logic)
 *
 * @param {string} termEnd          - Term end date string (ISO or year-only)
 * @param {string} precision        - "year", "month", or "day"
 * @param {string} [nextPrimaryDate] - ISO date string from DB (optional)
 * @param {string} [nextGeneralDate] - ISO date string from DB (optional)
 * @returns {{ onBallot: true, termEndDate: Date, electionDate: Date, electionLabel: string } | null}
 */
export function getSeatBallotStatus(termEnd, precision, nextPrimaryDate, nextGeneralDate) {
  // Parse term end date (may be null if termEnd is falsy)
  let date = null;
  if (termEnd) {
    if (precision === 'year' && /^\d{4}$/.test(termEnd)) {
      date = new Date(parseInt(termEnd, 10), 11, 31);
    } else {
      date = new Date(termEnd);
    }
    if (isNaN(date.getTime())) date = null;
  }

  const now = new Date();

  // Priority 1: real primary date from DB (if in the future)
  if (nextPrimaryDate) {
    const primaryDate = new Date(nextPrimaryDate);
    if (!isNaN(primaryDate.getTime()) && primaryDate > now) {
      return { onBallot: true, termEndDate: date || primaryDate, electionDate: primaryDate, electionLabel: 'Primary' };
    }
  }

  // Priority 2: real general date from DB (if in the future)
  if (nextGeneralDate) {
    const generalDate = new Date(nextGeneralDate);
    if (!isNaN(generalDate.getTime()) && generalDate > now) {
      return { onBallot: true, termEndDate: date || generalDate, electionDate: generalDate, electionLabel: 'General' };
    }
  }

  // Priority 3: heuristic fallback using term end date
  if (!date) return null;

  const oneYearFromNow = new Date(now);
  oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

  if (date <= now || date > oneYearFromNow) return null;

  return { onBallot: true, termEndDate: date, electionDate: getElectionDate(date), electionLabel: 'Election' };
}
