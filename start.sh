#!/usr/bin/env bash
set -euo pipefail

echo "==> Public Transport Tracker — Full Stack"
echo ""

# Backend setup
echo "==> Setting up backend..."
cd "$(dirname "$0")/server"
if [ ! -f data/transport.db ]; then
  echo "    First run — creating database and seeding data..."
  npx tsx src/db/migrate.ts
  npx tsx src/db/seed.ts
fi

echo "==> Starting backend on http://localhost:3001 ..."
npx tsx src/index.ts &
SERVER_PID=$!
cd ..

# Wait for backend to be ready
echo "    Waiting for backend..."
for i in $(seq 1 10); do
  if curl -s http://localhost:3001/api/health > /dev/null 2>&1; then
    break
  fi
  sleep 1
done

echo "==> Starting frontend on http://localhost:5173 ..."
npm run dev &
FRONTEND_PID=$!

# Trap to clean up
cleanup() {
  echo ""
  echo "==> Shutting down..."
  kill $SERVER_PID 2>/dev/null || true
  kill $FRONTEND_PID 2>/dev/null || true
  wait
}
trap cleanup EXIT INT TERM

echo ""
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:3001"
echo "   Press Ctrl+C to stop both"
echo ""

wait