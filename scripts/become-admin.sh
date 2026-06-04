#!/usr/bin/env bash

source .env

if [[ "$1" == "" ]]; then
	echo -e "\033[31mERROR\033[0m: Usage: $0 username"
	exit 1
fi


echo -e "\033[35mINFO\033[0m: DATABASE_URL = '$DATABASE_URL'"
echo -e "\033[35mINFO\033[0m: USERNAME = '$1'"


query="UPDATE \"User\" SET role = 'ADMIN' WHERE username = '$1';"

result=$(docker exec transcendence_postgres psql $DATABASE_URL -c "$query")
if [[ "$result" == "UPDATE 0" ]]; then
	echo -e "\033[31mERROR\033[0m: Could not gain admin rights for user $1"
	exit 1
else
	echo -e "\033[32mSUCCESS\033[0m: Gived admin rights to user $1"
	exit 0
fi