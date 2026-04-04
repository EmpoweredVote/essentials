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
      if (/council|commissioner/i.test(title)) return 'Legislative';
      if (/sheriff|clerk|auditor|assessor|recorder|coroner|treasurer/i.test(title)) return 'Executive';
      return null;
    }

    default:
      return null;
  }
}
