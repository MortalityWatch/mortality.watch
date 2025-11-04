# Agent Workflow: Remaining Tasks

**Status:** Wave 1-3 implementation 100% complete! 🎉

**What's Done:** All automated development tasks completed and merged to master.
**What's Left:** Manual deployment tasks + future feature backlog.

See `.claude/AGENT_WORKFLOW_ARCHIVE.md` for completed work (Waves 1-3).

---

## 📋 Manual Deployment Tasks (Required for Launch)

These are **configuration tasks** that require human intervention. No coding needed.

### 1. Email Service Configuration (5-10 min)

**Required for:** Email verification, password resets, contact form, admin alerts

**Steps:**

1. Sign up for Resend account at https://resend.com
2. Verify your domain (mortality.watch)
   - Add DNS records as instructed by Resend
3. Generate API key in Resend dashboard
4. Add environment variables:
   ```bash
   EMAIL_FROM="Mortality Watch <noreply@mortality.watch>"
   EMAIL_HOST_PASSWORD="re_your_api_key_here"
   ```
5. Test by registering a new account (should receive verification email)

**Priority:** HIGH - Required for user registration

---

### 2. Stripe Payment Configuration (10-15 min)

**Required for:** Subscriptions, payments, Pro/Premium tiers

**Steps:**

1. Create Stripe account at https://stripe.com
2. Create products in Stripe Dashboard:
   - **Pro Tier** - Monthly subscription
   - **Premium Tier** - Monthly subscription
3. Copy product/price IDs
4. Set up webhook endpoint:
   - URL: `https://mortality.watch/api/stripe/webhook`
   - Events: `customer.subscription.*`, `invoice.payment_*`
5. Add environment variables:
   ```bash
   STRIPE_SECRET_KEY="sk_live_..."
   STRIPE_PUBLISHABLE_KEY="pk_live_..."
   STRIPE_WEBHOOK_SECRET="whsec_..."
   STRIPE_PRO_PRICE_ID="price_..."
   STRIPE_PREMIUM_PRICE_ID="price_..."
   ```
6. Test with Stripe test mode first

**Priority:** HIGH - Required for monetization

---

### 3. Database Setup (5 min)

**Required for:** All user features, saved charts, subscriptions

**Steps:**

1. Ensure production database exists at `.data/mortality.db` (or configured path)
2. Run database migrations:
   ```bash
   npm run db:push
   # or
   npm run db:migrate
   ```
3. Verify tables exist:
   - `users`
   - `password_resets`
   - `saved_charts`
   - `subscriptions`
4. Create first admin user (see step 4)

**Priority:** CRITICAL - Must be done before launch

---

### 4. Create Admin Account (2 min)

**Required for:** Accessing admin dashboards (metrics, data quality)

**Steps:**

1. Register a normal account via UI
2. Manually update user role in database:
   ```bash
   # Using sqlite3 CLI:
   sqlite3 .data/mortality.db
   UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';
   .quit
   ```
3. Verify access to:
   - `/admin/metrics` - Business metrics dashboard
   - `/admin/data-quality` - Data quality monitoring

**Priority:** MEDIUM - Needed for admin features

---

### 5. Scheduled Data Quality Check (Optional, 5 min)

**Required for:** Automated staleness alerts

**Steps:**

1. Set up cron job or scheduled task:
   ```bash
   # Example cron (daily at 9 AM):
   0 9 * * * cd /path/to/app && node server/tasks/check-data-staleness.ts
   ```
2. Or use cloud scheduler (Vercel Cron, AWS EventBridge, etc.)
3. Or manually trigger via dashboard at `/admin/data-quality`

**Priority:** LOW - Can be done post-launch

---

### 6. Environment Variables Checklist

**Required for:** All features to work in production

**Complete `.env` file:**

```bash
# Database
DATABASE_URL="file:./.data/mortality.db"

# Authentication
JWT_SECRET="your-secure-random-secret"

# Email (Resend)
EMAIL_FROM="Mortality Watch <noreply@mortality.watch>"
EMAIL_HOST_PASSWORD="re_your_resend_api_key"

# Stripe
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PRO_PRICE_ID="price_..."
STRIPE_PREMIUM_PRICE_ID="price_..."

# Site URL (for email links, OG images)
NUXT_PUBLIC_SITE_URL="https://mortality.watch"

# Optional: Analytics
UMAMI_SITE_ID="your-site-id"
```

**Priority:** CRITICAL - Check before launch

---

## 🔮 Future Feature Backlog

These features were **not included in Waves 1-3** but can be added post-launch based on user demand.

### Single Age Group Life Expectancy (Coming Soon)

**Effort:** Medium (2-3 days)
**Priority:** User-driven

**Features:**

- Life expectancy calculations by single age group
- Interactive age group selector
- Visualization of LE trends over time
- Comparison across countries

**Dependencies:**

- Requires additional data source or calculation methodology
- May need Pro/Premium tier gating

---

### Age Standardized Deaths (Coming Soon)

**Effort:** Medium (2-3 days)
**Priority:** User-driven

**Features:**

- Age-standardized mortality rate calculations
- Multiple standardization methods (WHO, ESP, USA, Country-specific)
- Already have ASMR data in CSV, need visualization layer
- Chart toggle for standardized vs. crude rates

**Implementation Notes:**

- Data already available in mortality CSVs (`asmr_who`, `asmr_esp`, etc.)
- Need to add chart mode selector
- Update data transformation pipeline
- Add to Pro tier features

---

### Additional Future Ideas

- **Export to PDF/PNG** - Download charts as images
- **Saved chart collections** - Organize charts into folders
- **Public chart sharing** - Share charts with non-users
- **Custom date ranges** - More granular date selection
- **Data download** - Export raw CSV data
- **Mobile app** - Native iOS/Android apps
- **API access** - Developer API for Pro/Premium users

---

## 📈 Launch Readiness Checklist

Use this before going live:

### Code ✅

- [x] All Wave 1-3 PRs merged
- [x] All tests passing (unit + E2E)
- [x] TypeScript checks passing
- [x] No critical bugs

### Configuration 📋

- [ ] Email service configured (Resend)
- [ ] Stripe payment configured
- [ ] Database migrated
- [ ] Admin account created
- [ ] Environment variables set
- [ ] Domain verified for emails

### Testing 🧪

- [ ] Test user registration + email verification
- [ ] Test password reset flow
- [ ] Test contact form submission
- [ ] Test Pro tier subscription (Stripe test mode)
- [ ] Test saved charts feature
- [ ] Test data export (GDPR)
- [ ] Test account deletion (GDPR)
- [ ] Test admin dashboards

### Legal/Compliance ✅

- [x] Terms of Service published
- [x] Privacy Policy published
- [x] Refund Policy published
- [x] GDPR data export working
- [x] GDPR account deletion working
- [ ] Legal review (optional)

### Monitoring 📊

- [ ] Error tracking set up (Sentry/similar)
- [ ] Analytics installed (Umami/similar)
- [ ] Admin email alerts working
- [ ] Data quality monitoring active

---

## 🚀 Launch Sequence

**When all deployment tasks are complete:**

1. **Soft Launch** (Beta)
   - Invite limited users
   - Monitor error logs closely
   - Gather feedback
   - Fix critical issues

2. **Public Launch**
   - Announce on social media
   - Submit to Product Hunt, Hacker News
   - Monitor server load
   - Scale as needed

3. **Post-Launch**
   - Monitor metrics dashboard
   - Track conversion rates
   - Prioritize future features based on user requests
   - Add "Coming Soon" features from backlog

---

## 📞 Support

**For deployment issues:**

- Check error logs
- Review environment variables
- Verify database migrations
- Test in development first

**For feature requests:**

- Add to backlog above
- Prioritize based on user demand
- Estimate effort and ROI

---

**Platform Status:** 🟢 LAUNCH READY

All automated development complete. Ready to deploy once manual tasks are finished!
