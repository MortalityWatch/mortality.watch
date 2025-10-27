# Dokku Deployment Setup

## Initial Setup (First Time Only)

### 1. Create Persistent Storage Directory

SSH to your Dokku server and create the storage directory:

```bash
ssh co
sudo mkdir -p /var/lib/dokku/data/storage/www-mortality-watch
sudo chown -R dokku:dokku /var/lib/dokku/data/storage/www-mortality-watch
```

### 2. Mount Storage to App

The storage mount is already configured in `~/dev/co/deployments/config.json`:

```json
"storage_mounts": [
  "/var/lib/dokku/data/storage/www-mortality-watch:/app/.data"
]
```

Your `deploy.sh` script will automatically handle this.

### 3. Set Environment Variables

Create the environment file at `~/dev/co/deployments/.env/www.mortality.watch`:

```bash
# Required for authentication
JWT_SECRET=<generate-random-secret>

# Required for email (Resend)
EMAIL_HOST_PASSWORD=<resend-api-key>
EMAIL_FROM=Mortality Watch <noreply@mortality.watch>

# Required for production URL
NUXT_PUBLIC_SITE_URL=https://www.mortality.watch

# Optional: Error tracking (Bugsink/Sentry)
SENTRY_DSN=https://sentry.mortality.watch

# Optional: Admin user for seed script
ADMIN_EMAIL=admin@mortality.watch
ADMIN_PASSWORD=<secure-password>
ADMIN_NAME=Admin
```

**Generate JWT secret:**

```bash
openssl rand -base64 32
```

### 4. Database Migrations

Create a pre-deploy hook to run migrations automatically:

**File:** `pre-deploy.sh` (in project root)

```bash
#!/usr/bin/env bash
set -e

echo "Running database migrations..."
npm run db:migrate

echo "Migrations complete"
```

Make it executable:

```bash
chmod +x pre-deploy.sh
```

Your `~/dev/co/deploy.sh` script should automatically run this hook before deployment.

### 5. Initial Database Setup

After first deployment, SSH to Dokku and run the seed script:

```bash
ssh co
dokku run www-mortality-watch npm run db:seed
```

This creates the admin user.

## How It Works

### Database File Location

**Local development:**

- Path: `./.data/mortality.db`
- Ignored by git

**Dokku production:**

- Container path: `/app/.data/mortality.db`
- Host path (persistent): `/var/lib/dokku/data/storage/www-mortality-watch/mortality.db`

### Persistence

The storage mount ensures:

- ✅ Database survives app restarts
- ✅ Database survives deployments
- ✅ Database survives container rebuilds
- ✅ Data is backed up with host backups

### Why SQLite Works for Dokku

Dokku is a **single-server** PaaS, perfect for SQLite:

- ✅ No separate database server needed
- ✅ No connection pooling issues
- ✅ Excellent read performance
- ✅ Simple backups (just copy the file)
- ✅ No additional infrastructure costs

## Deployment Process

### Regular Deploy

```bash
cd ~/dev/co
./deploy.sh www.mortality.watch
```

The deploy script:

1. Runs `pre-deploy.sh` (migrations)
2. Builds and deploys the app
3. App connects to persistent SQLite database

### Check Database

```bash
ssh co
dokku run www-mortality-watch ls -lh /app/.data/
dokku run www-mortality-watch npm run db:studio
```

### Backup Database

**Manual backup:**

```bash
ssh co
sudo cp /var/lib/dokku/data/storage/www-mortality-watch/mortality.db \
       /var/lib/dokku/data/storage/www-mortality-watch/mortality.db.backup-$(date +%Y%m%d-%H%M%S)
```

**Automated backup (recommended):**
Add to your server's cron:

```bash
0 2 * * * /usr/local/bin/backup-dokku-sqlite.sh
```

Create `/usr/local/bin/backup-dokku-sqlite.sh`:

```bash
#!/bin/bash
DB_PATH="/var/lib/dokku/data/storage/www-mortality-watch/mortality.db"
BACKUP_DIR="/var/backups/dokku/www-mortality-watch"
DATE=$(date +%Y%m%d-%H%M%S)

mkdir -p "$BACKUP_DIR"
cp "$DB_PATH" "$BACKUP_DIR/mortality.db.$DATE"

# Keep only last 30 days of backups
find "$BACKUP_DIR" -name "mortality.db.*" -mtime +30 -delete
```

### Restore Database

```bash
ssh co
sudo cp /path/to/backup.db /var/lib/dokku/data/storage/www-mortality-watch/mortality.db
dokku ps:restart www-mortality-watch
```

## Troubleshooting

### Database Not Found

Check if storage is mounted:

```bash
ssh co
dokku storage:list www-mortality-watch
```

Should show:

```
/var/lib/dokku/data/storage/www-mortality-watch:/app/.data
```

### Permission Errors

Fix permissions:

```bash
ssh co
sudo chown -R dokku:dokku /var/lib/dokku/data/storage/www-mortality-watch
sudo chmod -R 755 /var/lib/dokku/data/storage/www-mortality-watch
```

### Check App Logs

```bash
ssh co
dokku logs www-mortality-watch --tail 100
```

## Migration to Postgres (Future)

If you need to scale beyond a single server or need >1000 concurrent users:

1. **Create Postgres database:**

   ```bash
   dokku postgres:create mortality-db
   dokku postgres:link mortality-db www-mortality-watch
   ```

2. **Export SQLite data:**

   ```bash
   dokku run www-mortality-watch sqlite3 /app/.data/mortality.db .dump > dump.sql
   ```

3. **Update `drizzle.config.ts`:**

   ```typescript
   export default defineConfig({
     dialect: "postgresql",
     dbCredentials: {
       url: process.env.DATABASE_URL,
     },
   });
   ```

4. **Import data to Postgres** (may need conversion)
5. **Redeploy**

---

**Current Status:** SQLite on Dokku is production-ready for your use case ✅
