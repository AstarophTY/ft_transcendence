#!/usr/bin/env sh

set -e

cp ./scripts/auto_campus_vote_routine.sh /opt/auto_campus_vote_routine.sh
chmod +x /opt/auto_campus_vote_routine.sh

cp ./scripts/campus_process_winner.sh /opt/campus_process_winner.sh
chmod +x /opt/campus_process_winner.sh

crontab ./scripts/vote.crontab
crond &

exec node dist/main.js