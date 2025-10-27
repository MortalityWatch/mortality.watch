#!/usr/bin/env bash
set -e

echo "🔄 Running database migrations..."

# Run migrations
npm run db:migrate

echo "✅ Migrations complete"
