#!/usr/bin/env sh

set -e

# this script runs at regular intervals to create votes

VOTE_DURATION="3 days"

# clear campus list
echo "" > /var/tmp/campuses.lst

echo -e "\n\n"
date

echo -e "\033[35mINFO\033[0m: DATABASE_URL = '$DATABASE_URL'"
echo -e "\033[35mINFO\033[0m: VOTE_DURATION = '$VOTE_DURATION'"

query="SELECT id FROM \"Campus\";"
campuses=$(psql $DATABASE_URL -c "$query" | grep -v "id" | grep -v "\-\-" | grep -v '\([0-9][0-9]* row\|\([0-9][0-9]* rows\)\)')
echo $campuses


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

	result=$(psql $DATABASE_URL -c "$query")
	if [[ "$result" == "INSERT 0 1" ]]; then
		echo -e "\033[32mSUCCESS\033[0m: Added vote for campus $campus"
		echo "$campus" >> /var/tmp/campuses.lst
	else
		echo -e "\033[31mERROR\033[0m: Could not create vote contest for campus id: '$campus'" >&2
		exit 1
	fi
done
echo "Processed $(echo $campuses | wc -l) campuses!"