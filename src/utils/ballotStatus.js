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
 * Determine whether a seat is "on the ballot" within the next year.
 *
 * @param {string} termEnd   - Term end date string (ISO or year-only)
 * @param {string} precision - "year", "month", or "day"
 * @returns {{ onBallot: true, termEndDate: Date, electionDate: Date } | null}
 */
export function getSeatBallotStatus(termEnd, precision) {
  if (!termEnd) return null;

  let date;
  if (precision === 'year' && /^\d{4}$/.test(termEnd)) {
    date = new Date(parseInt(termEnd, 10), 11, 31);
  } else {
    date = new Date(termEnd);
  }

  if (isNaN(date.getTime())) return null;

  const now = new Date();
  const oneYearFromNow = new Date(now);
  oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

  if (date <= now || date > oneYearFromNow) return null;

  return { onBallot: true, termEndDate: date, electionDate: getElectionDate(date) };
}
