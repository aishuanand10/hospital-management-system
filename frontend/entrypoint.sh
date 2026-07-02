#!/bin/sh
set -e

if [ ! -d "node_modules/next" ]; then
  echo "Installing frontend dependencies..."
  npm install
fi

exec npm run dev -- -H 0.0.0.0
