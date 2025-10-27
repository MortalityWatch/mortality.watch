#!/usr/bin/env bash
set -e

echo "🔄 Running database migrations..."

# Ensure .data directory exists (storage should be mounted by deploy.sh)
mkdir -p .data

# Run migrations
npm run db:migrate

echo "✅ Migrations complete"
