// Stands in for: GET /api/essentials/politicians/:id/bills, /votes, /council-record and /council-sponsorships
// with each item's `topic_tags` filled — not yet served by the API (`topic_tags` is null on every bill today).
//
// Dev-only design preview. On localhost, the record page tags items by matching words in their titles to
// Compass categories and topics (from GET /api/compass/topics), plus a few topics the Compass does not cover.
// Production builds never use this: there, topics appear only once the API fills `topic_tags`.
// The rules are rough on purpose; the real tags should come from the API (for example LegiScan subjects).

export const RECORD_TOPICS_PREVIEW = import.meta.env.DEV;

// [pattern, Compass category title, Compass topic short_title or null]
// or [pattern, null, null, other topic name] for topics outside the Compass.
const RULES = [
  [/voucher/i, 'Education and Schools', 'School Vouchers'],
  [/school|education|student|teacher|curriculum/i, 'Education and Schools', null],
  [/zoning|rezon|planned unit development|land use/i, 'Economic Policy and Labor', 'Residential Zoning'],
  [/housing|homeowner|tenant|\brent\b/i, 'Economic Policy and Labor', 'Housing'],
  [/economic development|tax abatement|tax increment/i, 'Economic Policy and Labor', 'Economic Development Incentives'],
  [/\btax|appropriation|budget|fiscal|revenue|\bbonds?\b/i, 'Economic Policy and Labor', 'Taxes'],
  [/minimum wage/i, 'Economic Policy and Labor', 'Minimum Wage'],
  [/labor|employ|worker|small business/i, 'Economic Policy and Labor', null],
  [/homeless/i, 'Healthcare and Social Safety Nets', 'Homelessness Funding'],
  [/medicaid|medicare/i, 'Healthcare and Social Safety Nets', 'Medicare/aid'],
  [/health|hospital|opioid|maternal|pregnan|doula|hearing detection|child care|childcare/i, 'Healthcare and Social Safety Nets', 'Healthcare'],
  [/carbon|transmission|energy|utilit/i, 'Environment and Climate Policy', 'Clean Energy'],
  [/pfas|environment|climate|natural resource|water|conservation/i, 'Environment and Climate Policy', null],
  [/transportation|highway|transit|\broads?\b|traffic/i, 'Environment and Climate Policy', 'Transportation Priorities'],
  [/firearm|\bguns?\b|shooting range/i, 'Public Safety and Law Enforcement', 'Gun Policy'],
  [/surveillance|license plate|police/i, 'Public Safety and Law Enforcement', 'Police Accountability'],
  [/\bjail|prison|custody|reentry|incarcerat/i, 'Public Safety and Law Enforcement', 'Jail Capacity'],
  [/public safety|crime|criminal|emergency alarm|signal jamming/i, 'Public Safety and Law Enforcement', 'Public Safety Approach'],
  [/cannabis|marijuana/i, 'Public Safety and Law Enforcement', 'Cannabis Policy'],
  [/marriage/i, 'Civil Rights and Social Policy', 'Same-Sex Marriage'],
  [/immigra|noncitizen|deport/i, 'Civil Rights and Social Policy', 'Deportation'],
  [/civil rights|discriminat|equity/i, 'Civil Rights and Social Policy', 'Civil Rights'],
  [/election|voting|ballot|redistrict|apportion/i, 'Governance, Democracy, and Institutional Reform', 'Voting Rights'],
  [/campaign finance/i, 'Governance, Democracy, and Institutional Reform', 'Campaign Finance'],
  [/artificial intelligence/i, 'Technology, Data, and Innovation', 'AI Oversight'],
  [/cyber|broadband|telecommunication|\bdata\b/i, 'Technology, Data, and Innovation', null],
  [/defense|armed forces|military/i, 'Foreign Policy and National Security', 'Defense Spending'],
  [/foreign|human rights|uyghur|persecution/i, 'Foreign Policy and National Security', null],
  [/veteran/i, null, null, 'Veterans'],
  [/disaster|emergency management/i, null, null, 'Disaster relief'],
  [/rural|agricultur|farm/i, null, null, 'Rural and farm'],
  [/patent/i, null, null, 'Business and patents'],
  [/board of accounts|boards and commissions|administration and personnel|municipal code entitled "administration|sponsorship of legislation/i, null, null, 'Government operations'],
];

/**
 * Stand-in tags for one title: [{ category, topic }] for Compass topics, [{ other }] for the rest.
 * At most two tags, first match first.
 */
export function previewTopicTags(title) {
  const text = String(title || '');
  const tags = [];
  const seen = new Set();
  for (const [re, category, topic, other] of RULES) {
    if (!re.test(text)) continue;
    const key = other || topic || category;
    if (seen.has(key)) continue;
    seen.add(key);
    tags.push(other ? { other } : { category, topic });
    if (tags.length === 2) break;
  }
  return tags;
}
