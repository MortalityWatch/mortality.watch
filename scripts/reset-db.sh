#!/bin/bash

# Helper script to reset the database
# This is useful during development when you need a fresh start
# WARNING: This will DELETE ALL DATA in the database!

set -e

echo "⚠️  WARNING: This will DELETE ALL DATA in the database!"
echo "This script is intended for development use only."
echo ""
read -p "Are you sure you want to continue? (yes/no): " -r
echo ""

if [[ ! $REPLY =~ ^[Yy]es$ ]]; then
  echo "❌ Aborted."
  exit 1
fi

# Remove the database file if it exists
DB_PATH="./.data/mortality.db"
if [ -f "$DB_PATH" ]; then
  echo "🗑️  Removing existing database: $DB_PATH"
  rm "$DB_PATH"
  echo "✅ Database removed"
else
  echo "ℹ️  No existing database found at $DB_PATH"
fi

# Run migrations to create fresh tables
echo ""
echo "🔄 Running migrations..."
npm run db:migrate

echo ""
echo "✅ Database has been reset!"
echo ""
echo "💡 Next steps:"
echo "   - Run 'npm run db:seed' to create an admin user"
echo "   - Or start the dev server with 'npm run dev'"
