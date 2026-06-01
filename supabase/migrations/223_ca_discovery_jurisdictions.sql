-- Migration 223: Insert 7 discovery_jurisdictions rows for CA cities + statewide
-- Phase 69-04: Arms discovery cron for SF, SJ, SD, SAC (June 2 primary),
--              Fremont, Berkeley, CA Statewide (Nov 3 general)
-- CRITICAL: No cron_active column exists — armed = row with future election_date
-- LA (0644000) and LA County (06037) already exist from migration 197 — do NOT re-insert

INSERT INTO essentials.discovery_jurisdictions
  (id, jurisdiction_geoid, jurisdiction_name, state, election_date, source_url)
VALUES
  -- San Francisco: June 2 primary (active city council + school board races)
  (gen_random_uuid(), '0667000', 'San Francisco', 'CA', '2026-06-02',
   'https://www.sf.gov/reports--candidates-june-2-2026-statewide-direct-primary-election'),
  -- San Jose: June 2 primary (active city council races)
  (gen_random_uuid(), '0668000', 'San Jose', 'CA', '2026-06-02',
   'https://www.sanjoseca.gov/your-government/appointees/city-clerk/elections/2026-elections-primary-and-runoff'),
  -- San Diego: June 2 primary (active city council races)
  (gen_random_uuid(), '0666000', 'San Diego', 'CA', '2026-06-02',
   'https://www.sandiego.gov/city-clerk/elections/city/electioninfo'),
  -- Sacramento: June 2 primary (active city council races)
  (gen_random_uuid(), '0664000', 'Sacramento', 'CA', '2026-06-02',
   'https://www.cityofsacramento.gov/clerk/elections/candidate-information'),
  -- Fremont: November 3 general (no June 2026 municipal races; filing deadline Aug 7)
  (gen_random_uuid(), '0626000', 'Fremont', 'CA', '2026-11-03',
   'https://www.fremont.gov/government/election-information'),
  -- Berkeley: November 3 general (no June 2026 municipal races; Nov 3 confirmed)
  (gen_random_uuid(), '0606000', 'Berkeley', 'CA', '2026-11-03',
   'https://berkeleyca.gov/your-government/elections/candidate-information'),
  -- California Statewide: November 3 general (Governor + US House; single row covers all)
  (gen_random_uuid(), '06', 'California Statewide', 'CA', '2026-11-03',
   'https://www.sos.ca.gov/elections/upcoming-elections/primary-election-june-2-2026')
ON CONFLICT DO NOTHING;
