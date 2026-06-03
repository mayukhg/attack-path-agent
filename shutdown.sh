#!/usr/bin/env sh
set -eu

echo "========================================================"
echo "Shutting down DAE Attack Path Demo..."
echo "========================================================"

if command -v lsof >/dev/null 2>&1; then
  pids=$(lsof -ti tcp:3000 || true)
  if [ -n "$pids" ]; then
    echo "Stopping service running on port 3000..."
    kill $pids
  else
    echo "No service found on port 3000."
  fi
else
  echo "lsof is not available. Stop the npm run dev process manually."
fi
