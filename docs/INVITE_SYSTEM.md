# Invite Code System - Implementation Plan

## Overview

Implementation of an invite code system to support phased launch strategy with time-limited Pro access for beta testers. This system will also serve as a long-term marketing tool for referral programs, influencer partnerships, and promotional campaigns.

## Launch Strategy

### Phase 1: Private Alpha (1-3 testers, 1-2 weeks)

- **Access Control**: Manual account creation via script
- **Tier**: Pro (tier 2)
- **Duration**: Time-limited Pro until expiry date
- **Goal**: Find critical bugs, validate core features

### Phase 2: Private Beta (10-20 testers, 2-4 weeks)

- **Access Control**: Invite code required for registration
- **Tier**: Pro (tier 2) with time-limited access
- **Duration**: 3-6 months free Pro access
- **Goal**: Stress test, gather UX feedback

### Phase 3: Public Launch (Unlimited)

- **Access Control**: Open registration (invite codes optional)
- **Tier**: Free (tier 1) by default
- **Marketing**: Invite codes for promotions, influencers, partnerships

## Database Schema

### New Table: `invite_codes`

```sql
CREATE TABLE invite_codes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  created_by INTEGER REFERENCES users(id),
  max_uses INTEGER NOT NULL DEFAULT 1,
  current_uses INTEGER NOT NULL DEFAULT 0,
  expires_at INTEGER, -- timestamp, nullable
  grants_tier INTEGER NOT NULL DEFAULT 1, -- 1 or 2
  grants_pro_until INTEGER, -- timestamp, nullable - for time-limited Pro
  notes TEXT,
  is_active INTEGER NOT NULL DEFAULT 1, -- boolean
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX idx_invite_codes_code ON invite_codes(code);
CREATE INDEX idx_invite_codes_active ON invite_codes(is_active);
CREATE INDEX idx_invite_codes_expires ON invite_codes(expires_at);
```

### Schema Changes to `users` table

**Option A (Minimal)**: No changes needed

- Pro expiry is tracked via `subscriptions` table
- Create subscription record with `status='trialing'` and `currentPeriodEnd`

**Option B (Recommended)**: Add tracking field

```sql
ALTER TABLE users ADD COLUMN invited_by_code_id INTEGER REFERENCES invite_codes(id);
```

- Enables analytics: which codes drove signups
- Track user origin for marketing attribution

### Schema Changes to `subscriptions` table

No changes needed. Use existing fields:

- `status='trialing'` for free Pro access period
- `currentPeriodEnd` for expiry date
- `trialEnd` for when free period ends

## Implementation Files

### 1. Database Schema (`db/schema.ts`)

**Add new table definition:**

```typescript
export const inviteCodes = sqliteTable("invite_codes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  code: text("code").notNull().unique(),
  createdBy: integer("created_by").references(() => users.id),
  maxUses: integer("max_uses").notNull().default(1),
  currentUses: integer("current_uses").notNull().default(0),
  expiresAt: integer("expires_at", { mode: "timestamp" }),
  grantsTier: integer("grants_tier", { mode: "number" })
    .notNull()
    .default(1)
    .$type<1 | 2>(),
  grantsProUntil: integer("grants_pro_until", { mode: "timestamp" }),
  notes: text("notes"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export type InviteCode = typeof inviteCodes.$inferSelect;
export type NewInviteCode = typeof inviteCodes.$inferInsert;
```

**Add index for tracking (optional):**

```typescript
// In users table
invitedByCodeId: integer("invited_by_code_id").references(() => inviteCodes.id);
```

### 2. Zod Schemas (`server/schemas/inviteCode.ts`)

```typescript
import { z } from "zod";

export const InviteCodeSchema = z.object({
  id: z.number(),
  code: z.string(),
  createdBy: z.number().nullable(),
  maxUses: z.number(),
  currentUses: z.number(),
  expiresAt: z.date().nullable(),
  grantsTier: z.union([z.literal(1), z.literal(2)]),
  grantsProUntil: z.date().nullable(),
  notes: z.string().nullable(),
  isActive: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const CreateInviteCodeSchema = z.object({
  code: z
    .string()
    .min(3)
    .max(50)
    .regex(
      /^[A-Z0-9-]+$/,
      "Code must be uppercase letters, numbers, and hyphens",
    ),
  maxUses: z.number().int().positive().default(1),
  expiresAt: z.string().datetime().optional(), // ISO date string
  grantsTier: z.union([z.literal(1), z.literal(2)]).default(1),
  grantsProMonths: z.number().int().positive().optional(), // convenience field
  notes: z.string().optional(),
});

export const ValidateInviteCodeSchema = z.object({
  code: z.string().min(3).max(50),
});

export type InviteCode = z.infer<typeof InviteCodeSchema>;
export type CreateInviteCodeInput = z.infer<typeof CreateInviteCodeSchema>;
```

### 3. Registration API Update (`server/api/auth/register.post.ts`)

**Add invite code validation:**

```typescript
// 1. Add inviteCode to request body schema
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  inviteCode: z.string().optional(), // Optional for now (Phase 3)
  tosAccepted: z.boolean()
})

// 2. Validate invite code if provided
if (inviteCode) {
  const code = await validateAndConsumeInviteCode(inviteCode)
  if (!code) {
    throw createError({
      statusCode: 400,
      message: 'Invalid or expired invite code'
    })
  }

  // Set tier based on code
  tier = code.grantsTier

  // If code grants Pro access, track expiry
  if (code.grantsProUntil) {
    proExpiresAt = code.grantsProUntil
  }
}

// 3. Create user with appropriate tier
const user = await createUser({ email, passwordHash, tier, ... })

// 4. If Pro access granted, create subscription record
if (proExpiresAt) {
  await createTrialSubscription(user.id, proExpiresAt)
}
```

### 4. Invite Code Utilities (`server/utils/inviteCode.ts`)

```typescript
export async function validateInviteCode(
  code: string,
): Promise<InviteCode | null>;
export async function validateAndConsumeInviteCode(
  code: string,
): Promise<InviteCode | null>;
export async function incrementInviteCodeUsage(codeId: number): Promise<void>;
export function generateInviteCode(prefix?: string): string;
```

### 5. Admin API Endpoints

**`POST /api/admin/invite-codes`** - Create new invite code

- Auth: Admin only
- Input: code, maxUses, expiresAt, grantsTier, grantsProMonths, notes
- Output: InviteCode object

**`GET /api/admin/invite-codes`** - List all invite codes

- Auth: Admin only
- Query: ?active=true&unused=true&expired=false
- Output: Array of InviteCode with usage stats

**`PATCH /api/admin/invite-codes/:id`** - Update invite code

- Auth: Admin only
- Input: isActive, maxUses, expiresAt, notes
- Output: Updated InviteCode

**`DELETE /api/admin/invite-codes/:id`** - Deactivate code

- Auth: Admin only
- Sets isActive=false

**`POST /api/admin/invite-codes/batch`** - Generate multiple codes

- Auth: Admin only
- Input: count, prefix, maxUses, grantsTier, grantsProMonths
- Output: Array of generated codes

**`GET /api/admin/invite-codes/:id/users`** - See who used a code

- Auth: Admin only
- Output: Array of users who registered with this code

### 6. Validation API (Public)

**`POST /api/auth/validate-invite-code`** - Check if code is valid (for UX)

- Auth: Public
- Input: code
- Output: { valid: boolean, message?: string }
- Does NOT consume the code, just validates

### 7. Signup Page Update (`app/pages/signup.vue`)

**Add invite code field:**

```vue
<template>
  <!-- Existing email/password fields -->

  <UFormField
    label="Invite Code (Optional)"
    name="inviteCode"
    description="Have an invite code? Enter it here for beta access"
  >
    <UInput
      v-model="form.inviteCode"
      placeholder="BETA-2025-XYZ"
      @blur="validateInviteCode"
    />
  </UFormField>

  <div
    v-if="inviteCodeStatus"
    class="text-sm"
    :class="inviteCodeStatus.valid ? 'text-green-600' : 'text-red-600'"
  >
    {{ inviteCodeStatus.message }}
  </div>
</template>

<script setup>
const form = reactive({
  email: "",
  password: "",
  inviteCode: "",
});

const inviteCodeStatus = ref(null);

async function validateInviteCode() {
  if (!form.inviteCode) return;

  const result = await $fetch("/api/auth/validate-invite-code", {
    method: "POST",
    body: { code: form.inviteCode },
  });

  inviteCodeStatus.value = result;
}
</script>
```

### 8. Admin Panel UI (`app/pages/admin/invite-codes.vue`)

**Features:**

- Table of all invite codes with stats (uses/max, expiry, tier)
- Create new code form
- Batch generate codes
- Deactivate/edit codes
- Filter by active/expired/unused
- View users who used each code

**Components:**

- `InviteCodeTable.vue` - Data table with codes
- `CreateInviteCodeModal.vue` - Form to create single code
- `BatchGenerateModal.vue` - Bulk code generation
- `InviteCodeStats.vue` - Analytics dashboard

### 9. Utility Scripts

**`scripts/create-invite-code.ts`** - CLI tool

```bash
npm run create-invite -- --code=BETA-WAVE1 --max-uses=10 --tier=2 --pro-months=6
```

**`scripts/create-alpha-user.ts`** - For Phase 1

```bash
npm run create-alpha-user -- --email=test@example.com --pro-until=2025-06-01
```

### 10. Pro Expiry Handling

**Option A: On-demand check** (Recommended for MVP)

- Check subscription status on every authenticated request
- If `currentPeriodEnd` < now and `status='trialing'`, downgrade to tier 1
- Simple, no cron job needed

**Option B: Scheduled task** (Better for scale)

- `server/tasks/expire-trial-subscriptions.ts`
- Run daily via cron/scheduler
- Batch downgrade expired trial users

**Implementation location:**

- `server/middleware/auth.ts` - Add expiry check after session validation

### 11. Environment Variables

Add to `.env`:

```bash
# Invite system
INVITE_CODES_ENABLED=true
INVITE_CODES_REQUIRED=false  # Set to true for Phase 2, false for Phase 3
```

## Migration Strategy

### Phase 1 → Phase 2

1. Deploy invite code system
2. Set `INVITE_CODES_REQUIRED=false` initially
3. Generate beta codes manually
4. Test with 1-2 users
5. Set `INVITE_CODES_REQUIRED=true`
6. Distribute codes to 10-20 beta testers

### Phase 2 → Phase 3

1. Set `INVITE_CODES_REQUIRED=false`
2. Keep invite system active for marketing
3. Update signup page: make invite code field clearly optional
4. Announce public launch

## Testing Checklist

- [ ] Valid invite code grants correct tier
- [ ] Time-limited Pro access creates subscription record
- [ ] Code max_uses enforced (can't use 11 times if max=10)
- [ ] Expired codes rejected
- [ ] Inactive codes rejected
- [ ] Invalid codes show helpful error
- [ ] Pro access auto-downgrades after expiry
- [ ] Admin can create/deactivate codes
- [ ] Admin can view code usage stats
- [ ] Signup works without code (Phase 3)
- [ ] Signup requires code when INVITE_CODES_REQUIRED=true

## Future Enhancements (Post-Launch)

### Personal Referral Codes

- Every user gets a personal referral code
- Track referral chains (who invited whom)
- Reward system for top referrers

### Analytics Dashboard

- Which codes perform best?
- Conversion rates by campaign
- ROI per marketing channel

### Advanced Code Features

- Percentage discounts (50% off)
- Dollar credits ($10 credit)
- Team/bulk codes (5 seats)
- Email domain restrictions (.edu only)

### Automated Campaigns

- Email lapsed users with win-back codes
- Birthday codes (1 month free)
- Seasonal promotions (auto-generate BLACKFRIDAY-2025)

## Timeline Estimate

| Task                        | Effort        | Priority      |
| --------------------------- | ------------- | ------------- |
| Database schema + migration | 1 hour        | High          |
| Backend validation utils    | 2 hours       | High          |
| Registration API update     | 2 hours       | High          |
| Admin API endpoints         | 3 hours       | High          |
| Signup page update          | 1 hour        | High          |
| Admin panel UI              | 4 hours       | Medium        |
| Utility scripts             | 1 hour        | Medium        |
| Pro expiry handling         | 2 hours       | High          |
| Testing                     | 3 hours       | High          |
| **TOTAL**                   | **~19 hours** | **~2-3 days** |

## Risks & Mitigation

| Risk                     | Impact | Mitigation                                          |
| ------------------------ | ------ | --------------------------------------------------- |
| Codes leaked publicly    | High   | Monitor usage, deactivate if abused, limit max_uses |
| Pro expiry not working   | High   | Add monitoring, email users before expiry           |
| Database migration fails | High   | Test migration on dev DB first, backup prod DB      |
| Admin panel security     | High   | Ensure admin-only middleware on all endpoints       |
| Forgot to expire trials  | Medium | Add scheduled task + manual admin check             |

## Security Considerations

1. **Code format**: Use uppercase + hyphens only (A-Z0-9-) to prevent injection
2. **Rate limiting**: Limit invite code validation attempts (prevent brute force)
3. **Admin endpoints**: All admin routes require admin role check
4. **Code generation**: Use crypto-secure random for auto-generated codes
5. **SQL injection**: Drizzle ORM handles this, but validate inputs with Zod

## Marketing Use Cases

Once built, this system enables:

1. **Influencer partnerships**: Custom codes with tracking
2. **Conference sponsorships**: Bulk codes for attendees
3. **Press launches**: HackerNews/Reddit exclusive codes
4. **Academic programs**: .edu email + special code
5. **Seasonal campaigns**: BLACKFRIDAY, NEWYEAR promotions
6. **Re-engagement**: Win-back codes for churned users
7. **Referral program**: Users invite friends, get rewards
8. **Content gating**: Download whitepaper → get code
9. **Partnership deals**: Bulk codes for partners
10. **A/B testing**: Different offers per code

## Success Metrics

### Phase 1 (Alpha)

- 0 critical bugs found by testers
- Core features work end-to-end
- Payment flow tested successfully

### Phase 2 (Beta)

- 10-20 active testers
- 90%+ code redemption rate
- Average 5+ charts saved per user
- Feedback collected from all testers

### Phase 3 (Public)

- 100+ registered users in first month
- 10%+ free → Pro conversion rate
- Invite codes drive 20%+ of signups
- 5+ influencer partnerships established

## Next Steps

1. Review this plan - approve/request changes
2. Create database migration
3. Implement backend validation logic
4. Update registration API
5. Build admin endpoints
6. Update signup page UI
7. Create admin panel
8. Write utility scripts
9. Add Pro expiry handling
10. Test end-to-end
11. Deploy to staging
12. Generate Phase 1 test accounts
13. Begin alpha testing

---

**Questions/Feedback?**

- Should we add `invited_by_code_id` tracking to users table?
- Prefer on-demand expiry check or scheduled task?
- Want to implement personal referral codes in Phase 1?
- Any additional admin features needed?
