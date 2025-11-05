# Phase 16: Quick Start Guide

## TL;DR

After PR #93 merges, we have 3 priorities:

1. 🔴 **CRITICAL**: Add server-side tests for payments/auth (20h)
2. 🟡 **IMPORTANT**: Modernize ranking page to match explorer (8h)
3. 🟢 **NICE**: Clean up deprecated code (6h)

**Total**: ~35 hours split across 3-4 PRs

---

## What's Next?

### Start Here (Week 1-2): Server-Side Testing 🔴

**Why**: Payment and auth bugs are business-critical with 0% test coverage

**What to do**:

```bash
# 1. Create branch
git checkout -b phase-16a-server-tests

# 2. Create test files
touch server/api/stripe/webhook.test.ts
touch server/utils/auth.test.ts
touch server/utils/chartRenderer.test.ts

# 3. Start with Stripe (most critical)
# See: docs/todo/PHASE_16_CONSISTENCY_AND_TESTING.md - Part A1

# 4. Run tests
npm run test
```

**Target**: >80% coverage on critical server code

**Time**: 20 hours (8h + 6h + 6h)

---

### Then Do (Week 3): Ranking Page Modernization 🟡

**Why**: Use same patterns as explorer (from Phase 12/PR #93)

**What to do**:

```bash
# 1. Create branch
git checkout -b phase-16b-ranking-modernization

# 2. Update useRankingData.ts to use useDateRangeCalculations
# See: docs/todo/PHASE_16_CONSISTENCY_AND_TESTING.md - Part B1

# 3. Add reactive watcher (like explorer)
# 4. Test thoroughly
npm run test
npm run test:e2e
```

**Target**: Ranking page uses same date logic as explorer

**Time**: 8 hours (4h + 2h + 2h)

---

### Finally (Week 4): Code Cleanup 🟢

**Why**: Remove deprecation warnings and old TODOs

**What to do**:

```bash
# 1. Create branch
git checkout -b phase-16c-cleanup

# 2. Remove Array.prototype.last (3 files)
# 3. Address TODOs (2 items)
# 4. Archive old planning docs
mkdir docs/archive
mv docs/claude/PHASE_12_*.md docs/archive/
```

**Time**: 6 hours

---

## Priority Order

**If you only have time for one thing**: Do Part A (Server Tests) - especially Stripe webhooks

**If you have time for two things**: Do Parts A + B

**If you have time for everything**: Do Parts A + B + C in order

---

## Questions?

See full plan: `docs/todo/PHASE_16_CONSISTENCY_AND_TESTING.md`

**Key Sections**:

- Part A: Server-Side Testing (detailed tasks)
- Part B: Ranking Page Modernization (code examples)
- Part C: Code Cleanup (file lists)
- Implementation Plan (day-by-day breakdown)

---

## Success Looks Like

After Phase 16:

- ✅ Stripe webhooks have tests (payment bugs caught early)
- ✅ Auth utilities have tests (security bugs caught early)
- ✅ Chart rendering has tests (SEO/UX bugs caught early)
- ✅ Ranking page uses same patterns as explorer (consistency)
- ✅ No deprecation warnings (clean codebase)
- ✅ Ready for Phase 17 (new features)

---

## Can I Skip Parts?

**Yes!** Each part is a separate PR:

- **Part A** (Server Tests): Don't skip - business critical 🔴
- **Part B** (Ranking): Can defer - works fine now 🟡
- **Part C** (Cleanup): Can defer - just code quality 🟢

Recommended minimum: **Part A only** (server tests)
