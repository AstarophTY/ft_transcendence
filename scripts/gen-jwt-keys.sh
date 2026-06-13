#!/usr/bin/env bash
set -euo pipefail

ENV_FILE="${1:-.env}"
FORCE="${2:-}"

if [ "${1:-}" = "--force" ]; then
  ENV_FILE=".env"
  FORCE="--force"
fi

if [ ! -f "$ENV_FILE" ]; then
  echo "[gen-jwt-keys] $ENV_FILE not found — copy .env.example to .env first." >&2
  exit 1
fi

if grep -q '^JWT_PRIVATE_KEY=.\+' "$ENV_FILE" && [ "$FORCE" != "--force" ]; then
  echo "[gen-jwt-keys] JWT keys already present in $ENV_FILE (use --force to regenerate)."
  exit 0
fi

TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 \
  -out "$TMP_DIR/jwt.key" 2>/dev/null
openssl rsa -in "$TMP_DIR/jwt.key" -pubout -out "$TMP_DIR/jwt.pub" 2>/dev/null

PRIV_B64="$(base64 -w0 "$TMP_DIR/jwt.key" 2>/dev/null || base64 "$TMP_DIR/jwt.key" | tr -d '\n')"
PUB_B64="$(base64 -w0 "$TMP_DIR/jwt.pub" 2>/dev/null || base64 "$TMP_DIR/jwt.pub" | tr -d '\n')"

grep -v -E '^(JWT_PRIVATE_KEY|JWT_PUBLIC_KEY)=' "$ENV_FILE" > "$TMP_DIR/env" || true
{
  echo "JWT_PRIVATE_KEY=$PRIV_B64"
  echo "JWT_PUBLIC_KEY=$PUB_B64"
} >> "$TMP_DIR/env"
cp "$TMP_DIR/env" "$ENV_FILE"

echo "[gen-jwt-keys] RSA key pair written to $ENV_FILE (JWT_PRIVATE_KEY / JWT_PUBLIC_KEY)."
