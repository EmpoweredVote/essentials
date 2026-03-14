/**
 * Determine whether a seat is "on the ballot" within the next year.
 *
 * @param {string} termEnd   - Term end date string (ISO or year-only)
 * @param {string} precision - "year", "month", or "day"
 * @returns {{ onBallot: true, termEndDate: Date } | null}
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

  return { onBallot: true, termEndDate: date };
}
