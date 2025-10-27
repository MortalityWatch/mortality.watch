#!/usr/bin/env bash
set -e

echo "🌱 Checking if database needs seeding..."

# Check if database has any users
USER_COUNT=$(sqlite3 .data/mortality.db "SELECT COUNT(*) FROM users;" 2>/dev/null || echo "0")

if [ "$USER_COUNT" -eq "0" ]; then
    echo "📝 Database is empty, seeding admin user..."
    npm run db:seed
    echo "✅ Admin user created"
else
    echo "✅ Database already has $USER_COUNT user(s), skipping seed"
fi

echo "✅ Post-deploy complete"
