#!/usr/bin/env bash
set -e

echo "=== HABAKIRI setup ==="

# 1. API key
if [ -f .env ]; then
  echo ".env already exists (skipping key prompt)"
else
  read -r -s -p "OrcaRouter API key: " key
  echo
  if [ -z "$key" ]; then
    echo "No key entered; writing placeholder. Edit .env later."
    key="sk-your-key-here"
  fi
  printf 'ORCAROUTER_API_KEY=%s\n' "$key" > .env
  echo "created .env"
fi

# 2. opencode.json
if [ ! -f opencode.json ]; then
  cp opencode.json.example opencode.json
  echo "created opencode.json"
else
  echo "opencode.json already exists"
fi

# 3. Ensure packages/cli can read .env (bun --cwd)
cp .env packages/cli/.env 2>/dev/null || true

echo ""
echo "Setup complete. Run: make dev"