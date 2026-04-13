/**
 * Returns a short description of an elected office's responsibilities,
 * matched by pattern against the cleaned position name.
 *
 * @param {string} positionName - Cleaned position name (e.g. "LA City Attorney")
 * @returns {string|null} Description, or null if no match found
 */
export function getOfficeDescription(positionName) {
  if (!positionName) return null;
  const t = positionName.toLowerCase();

  // ── Federal ──────────────────────────────────────────────────────────────
  if (/president/.test(t) && !/vice/.test(t))
    return 'The President is the chief executive of the federal government — commanding the armed forces, directing foreign policy, and signing or vetoing acts of Congress.';
  if (/vice president/.test(t))
    return 'The Vice President presides over the US Senate, casts tie-breaking votes, and assumes the presidency if the President is unable to serve.';
  if (/us sen(ator|ate)\b|united states sen(ator|ate)/.test(t))
    return 'US Senators represent their entire state in the upper chamber of Congress. They confirm federal appointments, ratify international treaties, and pass federal legislation.';
  if (/us representative|united states representative/.test(t))
    return 'US Representatives represent a congressional district in the lower chamber of Congress. All tax and spending bills originate in the House.';

  // ── State Executive ───────────────────────────────────────────────────────
  if (/governor/.test(t) && !/lieutenant/.test(t))
    return 'The Governor is the chief executive of the state — signing or vetoing legislation, commanding the National Guard, and directing state agencies.';
  if (/lieutenant governor/.test(t))
    return 'The Lieutenant Governor presides over the State Senate, casts tie-breaking votes, and assumes the governorship if the Governor cannot serve.';
  if (/attorney general/.test(t) && !/city|county/.test(t))
    return 'The Attorney General is the state\'s chief law officer — representing the state in court, enforcing consumer protection laws, and overseeing criminal justice policy.';
  if (/secretary of state/.test(t))
    return 'The Secretary of State oversees elections administration, maintains official state records, and handles business registrations and corporate filings.';
  if (/state treasurer/.test(t))
    return 'The State Treasurer manages state funds, oversees public investments, and administers unclaimed property programs.';
  if (/state controller|state comptroller/.test(t))
    return 'The State Controller is the chief fiscal officer — auditing state finances, issuing warrants for expenditures, and ensuring public funds are spent lawfully.';
  if (/state auditor/.test(t))
    return 'The State Auditor independently reviews state agencies and programs to ensure accountability, efficiency, and compliance with the law.';
  if (/insurance commissioner/.test(t))
    return 'The Insurance Commissioner regulates the insurance industry, reviews rate filings, protects consumers, and ensures insurers comply with state law.';
  if (/superintendent of public instruction|superintendent of schools/.test(t))
    return 'The Superintendent of Public Instruction oversees the state\'s K–12 public schools, sets academic standards, and distributes education funding to local districts.';

  // ── State Legislative ─────────────────────────────────────────────────────
  if (/state senate|senate district/.test(t))
    return 'State Senators serve in the upper chamber of the state legislature — passing state laws, approving the state budget, and confirming gubernatorial appointments.';
  if (/state assembly|assembly member|assembly district|state house|state representative/.test(t))
    return 'State Assembly Members serve in the lower chamber of the state legislature — introducing bills, setting the state budget, and representing their district in lawmaking.';

  // ── Local Executive ───────────────────────────────────────────────────────
  if (/\bmayor\b/.test(t))
    return 'The Mayor is the city\'s chief executive — overseeing city departments, proposing the city budget, and setting the overall direction of city policy.';
  if (/city attorney/.test(t))
    return 'The City Attorney is the city\'s chief legal counsel — advising elected officials, prosecuting misdemeanors, and defending the city in lawsuits.';
  if (/city controller/.test(t))
    return 'The City Controller is the city\'s independent auditor — reviewing city finances, auditing departments, and ensuring public funds are spent lawfully.';
  if (/city clerk/.test(t))
    return 'The City Clerk maintains official city records, manages elections administration, and serves as the primary public point of contact with city government.';
  if (/city treasurer/.test(t))
    return 'The City Treasurer manages the city\'s cash flow, investments, and debt obligations to ensure financial stability.';

  // ── County ────────────────────────────────────────────────────────────────
  if (/board of supervisors/.test(t))
    return 'The Board of Supervisors is the county\'s governing body — setting county policy, approving the county budget, and overseeing county departments and services.';
  if (/county assessor/.test(t))
    return 'The County Assessor determines the assessed value of all taxable real and personal property in the county, which is used to calculate property tax bills.';
  if (/county clerk/.test(t))
    return 'The County Clerk maintains county records, administers local elections, and handles official filings including business registrations and vital records.';
  if (/county treasurer/.test(t))
    return 'The County Treasurer collects and manages county revenues, investing public funds and disbursing payments authorized by the county.';
  if (/county auditor/.test(t))
    return 'The County Auditor maintains county financial records, processes payroll, and audits county departments for fiscal compliance.';
  if (/county recorder/.test(t))
    return 'The County Recorder maintains official records of property transactions, liens, deeds of trust, and other legal documents filed within the county.';
  if (/sheriff/.test(t))
    return 'The Sheriff is the county\'s chief law enforcement officer — operating the county jail, serving court documents, and providing policing in unincorporated areas.';
  if (/coroner/.test(t))
    return 'The Coroner investigates deaths that are sudden, unexpected, or suspicious to determine the cause and manner of death.';
  if (/district attorney|prosecutor/.test(t))
    return 'The District Attorney is the county\'s chief prosecutor — deciding which criminal cases to bring to trial and representing the government in court.';

  // ── Local Legislative ─────────────────────────────────────────────────────
  if (/city council|council member|council district/.test(t))
    return 'City Council Members serve as the city\'s legislative body — passing local ordinances, setting the city budget, and representing their district\'s constituents.';

  // ── School ────────────────────────────────────────────────────────────────
  if (/school board|board of education/.test(t))
    return 'School Board Members govern the local public school district — setting educational policy, approving the district budget, and hiring the superintendent.';

  // ── Judicial ─────────────────────────────────────────────────────────────
  if (/judge|justice|court/.test(t))
    return 'Judges interpret and apply the law, preside over legal proceedings, and issue rulings that resolve disputes between parties.';

  return null;
}
