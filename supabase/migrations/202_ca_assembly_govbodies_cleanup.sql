-- Migration 202: Remove per-district government_bodies entries for "California State Assembly".
-- These 24 entries caused any assembly member whose district had an entry to appear
-- in a separate "CALIFORNIA STATE ASSEMBLY" section instead of the shared "ASSEMBLY MEMBER" section.
-- Without these entries, all CA assembly members share government_body_name='' and group together.
DELETE FROM essentials.government_bodies
WHERE state = 'CA' AND body_key = 'California State Assembly';
