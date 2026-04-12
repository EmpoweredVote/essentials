/**
 * Determine the government branch for a politician based on their district type
 * and office title.
 *
 * @param {string} districtType - e.g. 'NATIONAL_EXEC', 'STATE_UPPER', 'COUNTY', etc.
 * @param {string} officeTitle  - Office title string (used for COUNTY heuristic)
 * @returns {'Executive' | 'Legislative' | 'Judicial' | null}
 */
export function getBranch(districtType, officeTitle) {
  if (!districtType) return null;

  switch (districtType) {
    case 'NATIONAL_EXEC':
    case 'STATE_EXEC':
    case 'LOCAL_EXEC':
      return 'Executive';

    case 'NATIONAL_UPPER':
    case 'NATIONAL_LOWER':
    case 'STATE_UPPER':
    case 'STATE_LOWER':
    case 'LOCAL':
    case 'SCHOOL':
      return 'Legislative';

    case 'JUDICIAL':
      return 'Judicial';

    case 'COUNTY': {
      const title = officeTitle || '';
      // County Council = legislative (appropriations, ordinances)
      if (/council/i.test(title)) return 'Legislative';
      // County Commissioners = executive (run day-to-day county government)
      if (/commission/i.test(title)) return 'Executive';
      // Other constitutional county officers = executive
      if (/sheriff|clerk|auditor|assessor|recorder|coroner|treasurer|prosecutor|surveyor/i.test(title))
        return 'Executive';
      return null;
    }

    default:
      return null;
  }
}
