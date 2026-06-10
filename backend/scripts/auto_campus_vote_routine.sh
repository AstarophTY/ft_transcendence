#!/usr/bin/env sh

set -e

# this script runs at regular intervals to create votes

VOTE_DURATION="3 days"


echo "\033[35mINFO\033[0m: DATABASE_URL = '$DATABASE_URL'"
echo "\033[35mINFO\033[0m: VOTE_DURATION = '$VOTE_DURATION'"

query="SELECT id FROM \"Campus\";"
campuses=$(docker exec transcendence_postgres psql $DATABASE_URL -c "$query" | grep -v "id" | grep -v "\-\-" | grep -v '\([0-9][0-9]* row\|\([0-9][0-9]* rows\)\)')


echo "$campuses" | while IFS= read -r campus; do
	campus=$(echo $campus | tr ' ' '\0')
	query="INSERT INTO \"VoteContest\" (id,title,description,\"campusId\",\"startsAt\",\"endsAt\",\"isActive\",\"createdAt\")
	VALUES (
		gen_random_uuid(),
		'Best Player Planet Vote',
		'Vote for the best player planet, the winner will be exposed at the campus spawn until the next vote.',
		'$campus',
		NOW(),
		NOW() + INTERVAL '$VOTE_DURATION',
		true,
		NOW()
	);"

	result=$(docker exec transcendence_postgres psql $DATABASE_URL -c "$query")
	if [[ "$result" == "INSERT 0 1" ]]; then
		echo "\033[32mSUCCESS\033[0m: Added vote for campus $campus"
	else
		echo "\033[31mERROR\033[0m: Could not create vote contest for campus id: '$campus'" >&2
		exit 1
	fi
done