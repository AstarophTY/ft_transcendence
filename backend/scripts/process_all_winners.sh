#!/usr/bin/env sh

# script to dispatch all winners from all campuses votes

echo -e "\n\n"
date

if [ -f "/var/tmp/campuses.lst" ]; then
	cat /var/tmp/campuses.lst | while IFS= read -r campus; do
		sh /opt/campus_process_winner.sh "$campus"
	done
fi