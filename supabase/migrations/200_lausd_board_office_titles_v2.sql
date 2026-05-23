-- Migration 200: Prefix LAUSD board office titles with 'LAUSD'
-- Changes 'Board Member (District N)' to 'LAUSD Board Member (District N)'
-- so the school board affiliation is clear when displayed alongside city council.

UPDATE essentials.offices
SET title = 'LAUSD ' || title
FROM essentials.districts d
WHERE essentials.offices.district_id = d.id
  AND d.geo_id LIKE 'lausd-board-district-%'
  AND essentials.offices.title LIKE 'Board Member (District %)';
