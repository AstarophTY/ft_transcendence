#!/usr/bin/env sh
set -e

./scripts/api_verification.sh

exec node dist/main.js