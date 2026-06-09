#!/usr/bin/env sh
set -euo pipefail

./scripts/api_verification.sh

exec node dist/main.js