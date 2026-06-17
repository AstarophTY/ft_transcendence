#!/usr/bin/env sh

set -e

CLIENT_ID="${API_42_CLIENT_ID}"
CLIENT_SECRET="${API_42_CLIENT_SECRET}"
API_TIMEOUT_MS=10000

echo "CLIENT_ID: $CLIENT_ID"
echo "CLIENT_SECRET: $CLIENT_SECRET"

if [[ -z "$CLIENT_ID" || -z "$CLIENT_SECRET" ]]; then
	echo -e "\033[31mERROR\033[0m: Either CLIENT_ID or CLIENT_SECRET are not provided in .env file" >&2
    exit 1
fi

response=$(curl -sS \
  --request POST \
  --url "https://api.intra.42.fr/oauth/token" \
  --header "Content-Type: application/x-www-form-urlencoded" \
  --data-urlencode "grant_type=client_credentials" \
  --data-urlencode "client_id=$CLIENT_ID" \
  --data-urlencode "client_secret=$CLIENT_SECRET")

echo "$response" | grep -q '"access_token"' || {
    echo -e "\033[31mERROR\033[0m: Invalid 42 API credentials" >&2
    exit 1
}
echo -e "\033[32mSUCCESS\033[0m: API check succeeded!"
exit 0