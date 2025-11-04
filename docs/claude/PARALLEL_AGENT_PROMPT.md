# Parallel Agent Execution Prompt

**Task:** Execute remaining implementation phases using git worktrees and parallel agents.

**Context:** ~85-90% complete. Remaining work organized in 3 waves (sequential Wave 1, parallel Waves 2-3).

---

## 🚀 Process Overview

1. **Read workflow plan:** `.claude/AGENT_WORKFLOW.md` - understand waves, dependencies, and agent tasks
2. **Identify current wave:** Wave 1 (sequential), Wave 2 (parallel), or Wave 3 (parallel)
3. **Create worktrees:** One per agent for parallel execution
4. **Launch agents:** Use Task tool with specific agent instructions
5. **Each agent must:**
   - Complete full implementation per agent task spec
   - Run: `npm install`, `npm run check`, `npm run test:e2e` (or relevant tests)
   - Commit with proper conventional commit format
   - Push branch and create PR with detailed description
6. **Monitor CI:** Check all PRs, fix any failures immediately
7. **After merge:** Pull master, proceed to next wave

---

## 📋 Wave 1: Sequential Execution (Critical Pre-Launch)

**Dependencies:** Agent 2 needs Agent 1 (footer), Agent 3 needs Agent 1 (legal links)

**Execution Order:**

```bash
# Agent 1: Legal Pages (must complete first)
git worktree add ../agent-1-legal -b feature/phase-6.5-legal-pages master

# After Agent 1 merges, launch Agent 2 & 3 in parallel:
git worktree add ../agent-2-contact -b feature/phase-6.6-contact-page master
git worktree add ../agent-3-tos -b feature/phase-16.4-tos-acceptance master
```

### Agent 1: Legal Pages (Day 1-2)

```
Working Directory: /Users/ben/dev/co/agent-1-legal
Branch: feature/phase-6.5-legal-pages
Context: Read .claude/AGENT_WORKFLOW.md lines 15-145
Task Type: 💻 Code Changes (Vue pages + footer links)
Priority: CRITICAL (legal requirement)
Dependencies: None

Tasks:
- Create app/pages/legal/terms.vue (Terms of Service)
- Create app/pages/legal/privacy.vue (Privacy Policy)
- Create app/pages/legal/refund.vue (Refund Policy)
- Update footer component with legal page links

Validation:
  cd /Users/ben/dev/co/agent-1-legal
  npm install
  npm run check
  npm run lint
  # Manual: Visit localhost:3000/legal/* pages
  # Manual: Check footer links from all pages

Commit Message:
  "feat: Add legal pages (terms, privacy, refund)

  - Create Terms of Service page (/legal/terms)
  - Create Privacy Policy page (/legal/privacy)
  - Create Refund Policy page (/legal/refund)
  - Add footer links to legal pages
  - Uses Termly templates customized for Mortality Watch
  - Required for GDPR/CCPA compliance

  Closes: Phase 6.5"

Create PR:
  git push -u origin feature/phase-6.5-legal-pages
  gh pr create --title "feat: Add legal pages (terms, privacy, refund)" \
    --body "$(cat .claude/AGENT_WORKFLOW.md | sed -n '90,145p')"

Report: Files created, page count, footer verification, PR URL
```

### Agent 2: Contact Page (Day 2, after Agent 1)

```
Working Directory: /Users/ben/dev/co/agent-2-contact
Branch: feature/phase-6.6-contact-page
Context: Read .claude/AGENT_WORKFLOW.md lines 147-252
Task Type: 💻 Code Changes (Vue page + API route)
Priority: CRITICAL (support infrastructure)
Dependencies: Agent 1 (footer consistency)

Tasks:
- Create app/pages/contact.vue (contact form with UForm)
- Create server/api/contact.post.ts (email handler via Resend)
- Configure rate limiting (5 per hour per IP)
- Add optional chart URL inclusion

Validation:
  cd /Users/ben/dev/co/agent-2-contact
  npm install
  npm run check
  # Manual: Submit contact form
  # Manual: Verify email received at support@mortality.watch
  # Manual: Test rate limiting

Commit Message:
  "feat: Add contact page and support email infrastructure

  - Create contact form page with UForm
  - Implement contact API endpoint with email sending
  - Configure rate limiting (5 per hour per IP)
  - Support email: support@mortality.watch
  - Optional chart URL inclusion for bug reports

  Closes: Phase 6.6"

Create PR:
  git push -u origin feature/phase-6.6-contact-page
  gh pr create --title "feat: Add contact page and support infrastructure" \
    --body "$(cat .claude/AGENT_WORKFLOW.md | sed -n '210,252p')"

Report: Form functionality, email delivery test, PR URL
```

### Agent 3: TOS Acceptance (Day 2, after Agent 1)

```
Working Directory: /Users/ben/dev/co/agent-3-tos
Branch: feature/phase-16.4-tos-acceptance
Context: Read .claude/AGENT_WORKFLOW.md lines 254-355
Task Type: 💻 Code Changes (form update + validation)
Priority: CRITICAL (legal requirement)
Dependencies: Agent 1 (legal page links)

Tasks:
- Update app/pages/signup.vue (add TOS checkbox)
- Update server/api/auth/register.ts (validate TOS acceptance)
- Optional: Add tos_accepted_at field to database

Validation:
  cd /Users/ben/dev/co/agent-3-tos
  npm install
  npm run check
  npm run test:e2e -- tests/e2e/auth.spec.ts
  # Manual: Try registering without TOS checkbox
  # Manual: Verify links to legal pages work

Commit Message:
  "feat: Add TOS acceptance checkbox to registration

  - Add required TOS acceptance checkbox to signup form
  - Link to Terms of Service and Privacy Policy
  - Validate TOS acceptance on backend
  - Store tos_accepted_at timestamp in database
  - Required for GDPR/legal compliance

  Closes: Phase 16.4"

Create PR:
  git push -u origin feature/phase-16.4-tos-acceptance
  gh pr create --title "feat: Add TOS acceptance to registration" \
    --body "$(cat .claude/AGENT_WORKFLOW.md | sed -n '310,355p')"

Report: Migration status, test results, PR URL
```

---

## 🔄 Wave 2: Parallel Execution (Pre-Launch Polish)

**Dependencies:** None - all independent. Can launch all 3 agents simultaneously.

**Execution:**

```bash
# Launch all 3 worktrees at once
git worktree add ../agent-4-email -b feature/phase-6.3-email-service master
git worktree add ../agent-5-metrics -b feature/phase-15.3-business-metrics master
git worktree add ../agent-6-gdpr -b feature/phase-16.2-gdpr-compliance master
```

### Launch Command (Parallel)

```typescript
// In main Claude Code conversation, send ONE message with 3 Task calls:

[Task 1 - Agent 4: Email Service]
[Task 2 - Agent 5: Business Metrics]
[Task 3 - Agent 6: GDPR Compliance]
```

### Agent 4: Email Service

```
Working Directory: /Users/ben/dev/co/agent-4-email
Branch: feature/phase-6.3-email-service
Context: Read .claude/AGENT_WORKFLOW.md lines 359-465
Task Type: 💻 Code Changes
Priority: HIGH
Dependencies: None
Parallel: YES

Tasks:
- Install Resend SDK (npm install resend)
- Create email templates (verification, password reset)
- Update registration API to send verification email
- Update forgot-password API to send reset email
- Create verify-email page

Validation:
  cd /Users/ben/dev/co/agent-4-email
  npm install resend
  npm run check
  # Manual: Register account, verify email received
  # Manual: Test password reset email

Commit: "feat: Integrate Resend for email verification and password reset"
PR: Use gh pr create with workflow template lines 430-465

Report: Email delivery success, PR URL
```

### Agent 5: Business Metrics

```
Working Directory: /Users/ben/dev/co/agent-5-metrics
Branch: feature/phase-15.3-business-metrics
Context: Read .claude/AGENT_WORKFLOW.md lines 467-570
Task Type: 💻 Code Changes
Priority: HIGH
Dependencies: None
Parallel: YES

Tasks:
- Create server/api/metrics/dashboard.get.ts
- Create app/pages/admin/metrics.vue
- Query users, subscriptions for metrics
- Calculate MRR, ARR, conversion rates
- Protected by admin middleware

Validation:
  cd /Users/ben/dev/co/agent-5-metrics
  npm install
  npm run check
  # Manual: Visit /admin/metrics as admin
  # Manual: Verify metric calculations

Commit: "feat: Add business metrics dashboard"
PR: Use gh pr create with workflow template lines 540-570

Report: Metrics accuracy, PR URL
```

### Agent 6: GDPR Compliance

```
Working Directory: /Users/ben/dev/co/agent-6-gdpr
Branch: feature/phase-16.2-gdpr-compliance
Context: Read .claude/AGENT_WORKFLOW.md lines 572-683
Task Type: 💻 Code Changes
Priority: HIGH
Dependencies: None
Parallel: YES

Tasks:
- Create server/api/user/export-data.get.ts
- Create server/api/user/account.delete.ts
- Update app/pages/profile.vue (export/delete buttons)
- Create DeleteAccountModal.vue component
- Implement cascade deletion

Validation:
  cd /Users/ben/dev/co/agent-6-gdpr
  npm install
  npm run check
  npm run test -- gdpr.spec.ts
  # Manual: Export data, verify JSON complete
  # Manual: Delete test account, verify cascade

Commit: "feat: Add GDPR data export and account deletion"
PR: Use gh pr create with workflow template lines 650-683

Report: Export test, deletion verification, PR URL
```

---

## 🎨 Wave 3: Parallel Execution (Post-Launch Features)

**Dependencies:** None - all independent. Launch after Waves 1-2 merged.

**Execution:**

```bash
# Launch all 3 worktrees at once
git worktree add ../agent-7-onboard -b feature/phase-14.1-onboarding master
git worktree add ../agent-8-quality -b feature/phase-13.1-data-quality master
git worktree add ../agent-9-zscores -b feature/phase-11-z-scores master
```

### Agent 7: Onboarding Tutorial

```
Working Directory: /Users/ben/dev/co/agent-7-onboard
Branch: feature/phase-14.1-onboarding
Context: Read .claude/AGENT_WORKFLOW.md lines 687-791
Priority: MEDIUM
Parallel: YES

Tasks: Interactive tutorial with driver.js, contextual tooltips, empty states
Validation: Test tutorial completion flow
Report: Tutorial steps working, PR URL
```

### Agent 8: Data Quality Monitoring

```
Working Directory: /Users/ben/dev/co/agent-8-quality
Branch: feature/phase-13.1-data-quality
Context: Read .claude/AGENT_WORKFLOW.md lines 793-885
Priority: MEDIUM
Parallel: YES

Tasks: Admin dashboard for data freshness, validation fallbacks, alerts
Validation: Test with stale data, corrupt CSV
Report: Dashboard functionality, PR URL
```

### Agent 9: Z-Scores (Advanced Feature)

```
Working Directory: /Users/ben/dev/co/agent-9-zscores
Branch: feature/phase-11-z-scores
Context: Read .claude/AGENT_WORKFLOW.md lines 887-990
Priority: LOW
Parallel: YES

Tasks: Z-score calculations, chart toggle, Pro feature gating
Validation: Verify calculations with test data
Report: Calculation accuracy, PR URL
```

---

## 🎯 Orchestration Commands

### Wave 1 (Sequential)

```bash
# Step 1: Launch Agent 1
# In Claude Code main conversation:
Task({
  subagent_type: "general-purpose",
  description: "Agent 1: Legal Pages",
  prompt: "Execute Agent 1 from .claude/PARALLEL_AGENT_PROMPT.md.

  Working Directory: /Users/ben/dev/co/agent-1-legal
  Branch: feature/phase-6.5-legal-pages

  Follow exact instructions from .claude/AGENT_WORKFLOW.md lines 15-145.
  Create all legal pages, update footer, validate, commit, create PR.

  Report: Files created, validation results, PR URL."
})

# Step 2: After Agent 1 PR merges, launch Agents 2 & 3 in parallel
# ONE message with TWO Task calls:
Task({ /* Agent 2: Contact Page */ })
Task({ /* Agent 3: TOS Acceptance */ })
```

### Wave 2 (Parallel)

```bash
# After Wave 1 complete, launch all 3 agents in ONE message:
Task({ /* Agent 4: Email */ })
Task({ /* Agent 5: Metrics */ })
Task({ /* Agent 6: GDPR */ })
```

### Wave 3 (Parallel)

```bash
# After Wave 2 complete, launch all 3 agents in ONE message:
Task({ /* Agent 7: Onboarding */ })
Task({ /* Agent 8: Data Quality */ })
Task({ /* Agent 9: Z-Scores */ })
```

---

## 🔍 Monitoring & Cleanup

### Check Agent Status

```bash
# List all worktrees
git worktree list

# Check CI status for all PRs
gh pr list --state open

# View specific PR checks
gh pr checks <PR-number>
```

### After PR Merges

```bash
# Update main working directory
cd /Users/ben/dev/co/staging.mortality.watch
git checkout master
git pull origin master

# Remove merged worktree
git worktree remove ../agent-X-name

# Verify cleanup
git worktree list
```

### If Agent Fails

```bash
# Check agent output in worktree
cd /Users/ben/dev/co/agent-X-name
git status
npm run check  # See what failed

# Fix in main workspace or resume agent
# Option 1: Fix manually and push
# Option 2: Resume agent with Task tool and "resume" parameter
```

---

## 📊 Progress Tracking

### Create GitHub Issues

```bash
# Wave 1
gh issue create --title "Wave 1: Critical Pre-Launch" --label "wave-1,critical"
gh issue create --title "Agent 1: Legal Pages" --label "agent-1,wave-1" --body "See .claude/AGENT_WORKFLOW.md"
gh issue create --title "Agent 2: Contact Page" --label "agent-2,wave-1"
gh issue create --title "Agent 3: TOS Acceptance" --label "agent-3,wave-1"

# Wave 2
gh issue create --title "Wave 2: Pre-Launch Polish" --label "wave-2,high"
gh issue create --title "Agent 4: Email Service" --label "agent-4,wave-2"
gh issue create --title "Agent 5: Business Metrics" --label "agent-5,wave-2"
gh issue create --title "Agent 6: GDPR Compliance" --label "agent-6,wave-2"

# Wave 3
gh issue create --title "Wave 3: Post-Launch Features" --label "wave-3,medium"
gh issue create --title "Agent 7: Onboarding" --label "agent-7,wave-3"
gh issue create --title "Agent 8: Data Quality" --label "agent-8,wave-3"
gh issue create --title "Agent 9: Z-Scores" --label "agent-9,wave-3"
```

### GitHub Projects Board

```
Columns:
1. Planned (Wave X)
2. In Progress (Agent Working)
3. Review (PR Open, CI Running)
4. Done (PR Merged)

Move cards as agents progress through workflow.
```

---

## ✅ Key Principles

1. **Respect Dependencies**
   - Wave 1: Sequential (Agent 1 → Agents 2,3)
   - Waves 2-3: Fully parallel

2. **One Message = Parallel Agents**
   - Use single message with multiple Task calls for parallel execution
   - Don't send separate messages (creates sequential execution)

3. **Each Agent is Autonomous**
   - Complete implementation from context in AGENT_WORKFLOW.md
   - Run all validation before creating PR
   - Report back with clear results

4. **Clean PR Practices**
   - Small, focused changes per agent
   - Descriptive commit messages (conventional commits)
   - Detailed PR descriptions from workflow template
   - All tests passing before push

5. **Worktree Isolation**
   - Each agent works in separate worktree
   - Prevents conflicts between parallel agents
   - Easy cleanup after merge

6. **Monitor & Iterate**
   - Check CI status regularly
   - Fix failures immediately
   - Clean up worktrees after merge
   - Proceed to next wave

---

## 📈 Expected Timeline

**Wave 1 (Sequential):**

- Agent 1: 1-2 days
- Agents 2-3: 0.5-0.75 days (parallel)
- **Total:** 2-3 days

**Wave 2 (Parallel):**

- All agents: 2-3 days (max of all 3)
- **Can Launch After This**

**Wave 3 (Parallel):**

- All agents: 5-10 days (max of all 3)
- **Post-Launch Polish**

**Grand Total:** 9-16 days to 100% completion

---

## 🎉 Success Criteria

**Wave 1 Complete:**

- ✅ All 3 PRs merged
- ✅ Legal pages live
- ✅ Contact form working
- ✅ TOS acceptance enforced

**Wave 2 Complete:**

- ✅ All 3 PRs merged
- ✅ Emails sending
- ✅ Metrics dashboard live
- ✅ GDPR compliance complete
- ✅ **READY TO LAUNCH**

**Wave 3 Complete:**

- ✅ All 3 PRs merged
- ✅ Onboarding tutorial live
- ✅ Data quality monitoring active
- ✅ Advanced features available
- ✅ **100% COMPLETE**

---

**Note:** This workflow maximizes parallelization while respecting dependencies. Wave 1 must be sequential due to footer/link dependencies, but Waves 2 and 3 are fully parallelizable for maximum speed.
