#!/bin/sh
set -e

echo "──────────────────────────────────────────"
echo "  VisuTek Backend starting..."
echo "──────────────────────────────────────────"

cd /app/apps/backend

echo "▶ Syncing database schema..."
npx prisma db push --accept-data-loss

echo "▶ Running seed..."
# Only seed if the users table is empty
USER_COUNT=$(npx prisma db execute --stdin <<'SQL'
SELECT COUNT(*)::int FROM users;
SQL
2>/dev/null | grep -oE '[0-9]+' | tail -1 || echo "0")

if [ "$USER_COUNT" = "0" ]; then
  npx tsx prisma/seed.ts
else
  echo "  Database already seeded, skipping."
fi

echo "▶ Starting dev server..."
exec npx tsx watch src/index.ts
