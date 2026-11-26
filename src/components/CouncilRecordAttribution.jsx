import { councilAttributionText } from '../lib/councilRecord';

/** Source line for a city council member's voting record. */
export default function CouncilRecordAttribution({ governmentName }) {
  return (
    <p className="mt-6 text-xs text-gray-500 dark:text-gray-400 font-[Manrope]">
      {councilAttributionText(governmentName)}
    </p>
  );
}
