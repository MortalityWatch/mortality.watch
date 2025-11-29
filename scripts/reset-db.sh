#!/bin/sh

# Helper script to reset the database
# This is useful during development when you need a fresh start
# WARNING: This will DELETE ALL DATA in the database!

set -e

echo "⚠️  WARNING: This will DELETE ALL DATA in the database!"
echo "This script is intended for development use only."
echo ""
printf "Are you sure you want to continue? (yes/no): "
read -r REPLY
echo ""

case "$REPLY" in
  [Yy]es)
    # Continue with script
    ;;
  *)
    echo "❌ Aborted."
    exit 1
    ;;
esac

# Remove the database file and SQLite WAL files if they exist
DB_PATH="./.data/mortality.db"
if [ -f "$DB_PATH" ]; then
  echo "🗑️  Removing existing database: $DB_PATH"
  rm -f "$DB_PATH" "$DB_PATH-shm" "$DB_PATH-wal"
  echo "✅ Database removed"
else
  # Still remove WAL files in case they're orphaned
  rm -f "$DB_PATH-shm" "$DB_PATH-wal"
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
