#!/usr/bin/env bash
set -euo pipefail

cd "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Node version check
NODE_MAJOR=$(node -e "process.stdout.write(process.version.slice(1).split('.')[0])")
if [ "$NODE_MAJOR" -lt 20 ]; then
  echo "[START] ERROR: Node.js >= 20 required (found $(node --version))"
  exit 1
fi

# .env check
if [ ! -f ".env" ]; then
  if [ -f ".env.example" ]; then
    cp .env.example .env
    echo "[START] .env not found — copied from .env.example."
    echo "        Edit .env to configure your MQTT broker, then re-run start.sh."
    exit 1
  else
    echo "[START] ERROR: .env not found and .env.example is missing."
    exit 1
  fi
fi

# checks.json check
if [ ! -f "checks.json" ]; then
  if [ -f "checks.example.json" ]; then
    cp checks.example.json checks.json
    echo "[START] checks.json not found — copied from checks.example.json."
    echo "        Edit checks.json to configure your checks, then re-run start.sh."
    exit 1
  else
    echo "[START] ERROR: checks.json not found and checks.example.json is missing."
    exit 1
  fi
fi

# node_modules check
if [ ! -d "node_modules" ]; then
  echo "[START] node_modules not found — running pnpm install..."
  pnpm install
fi

echo "[START] Starting server..."
node src/index.js
