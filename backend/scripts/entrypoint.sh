#!/usr/bin/env sh

set -e

crontab ./scripts/vote.crontab

exec node dist/main