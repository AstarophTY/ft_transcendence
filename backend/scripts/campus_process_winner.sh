#!/usr/bin/env sh

# this script copies the blocks of the vote winner to the campus spawn

set -e

CAMPUS_ID="$1"

if [ -z "${CAMPUS_ID:-}" ]; then
  echo "Usage: $0 <CAMPUS_ID>"
  exit 1
fi

if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL is not set"
  exit 1
fi

echo "Finding contest for campus: $CAMPUS_ID"



CONTEST_ID=$(psql "$DATABASE_URL" -t -A -c "
SELECT vc.id
FROM \"VoteContest\" vc
WHERE vc.\"campusId\" = '$CAMPUS_ID'
ORDER BY vc.\"endsAt\" DESC
LIMIT 1;
")

if [ -z "$CONTEST_ID" ]; then
  echo "No contest found for campus $CAMPUS_ID"
  exit 0
fi

echo "Contest: $CONTEST_ID"



WINNER_USER_ID=$(psql "$DATABASE_URL" -t -A -c "
SELECT vcc.\"userId\"
FROM \"VoteContestCandidate\" vcc
JOIN \"Vote\" v ON v.\"candidateId\" = vcc.id
WHERE vcc.\"contestId\" = '$CONTEST_ID'
GROUP BY vcc.\"userId\"
ORDER BY COUNT(v.id) DESC
LIMIT 1;
")

if [ -z "$WINNER_USER_ID" ]; then
  echo "No winner found for contest $CONTEST_ID"
  exit 0
fi

echo "Winner user: $WINNER_USER_ID"



psql "$DATABASE_URL" -c "
UPDATE \"VoteContest\"
SET \"winner\" = '$WINNER_USER_ID',
    \"isActive\" = false
WHERE id = '$CONTEST_ID';
"



CAMPUS_WORLD_ID=$(psql "$DATABASE_URL" -t -A -c "
SELECT w.id
FROM \"World\" w
WHERE w.\"campusId\" = '$CAMPUS_ID'
LIMIT 1;
")

if [ -z "$CAMPUS_WORLD_ID" ]; then
  echo "No campus world found"
  exit 1
fi

echo "Campus world: $CAMPUS_WORLD_ID"



echo "Clearing campus spawn area..."

psql "$DATABASE_URL" -c "
DELETE FROM \"WorldBlock\"
WHERE \"worldId\" = '$CAMPUS_WORLD_ID'
  AND x BETWEEN -31 AND 31
  AND y BETWEEN 1 AND 64
  AND z BETWEEN -31 AND 31;
"



echo "Copying winner world blocks..."

SQL="
INSERT INTO \"WorldBlock\" (\"worldId\", x, y, z, block, rotation)
SELECT
  '$CAMPUS_WORLD_ID',
  wb.x,
  wb.y,
  wb.z,
  wb.block,
  wb.rotation
FROM \"WorldBlock\" wb
JOIN \"World\" w ON w.id = wb.\"worldId\"
WHERE w.\"userId\" = '$WINNER_USER_ID'
ON CONFLICT (\"worldId\", x, y, z)
DO UPDATE SET
  block = EXCLUDED.block,
  rotation = EXCLUDED.rotation;
"

psql "$DATABASE_URL" -c "$SQL"

echo "Done. Copied winner world into campus '$CAMPUS_ID'"