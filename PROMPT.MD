# Implementation Agent Prompt

## Overview

This prompt is designed for AI agents to implement specific phases or tasks from the project's refactoring plans. Use this as a template for directing agents to work on distinct, self-contained implementation work.

---

## General Instructions

You are an AI agent tasked with implementing a specific phase or task from one of the following planning documents:
- `IMPLEMENTATION_PLAN.md` - Main project roadmap
- `PHASE_8.5_REFACTORING.md` - Component refactoring (COMPLETED)
- `PHASE_9_REFACTORING.md` - Architectural improvements (CURRENT)

**Read the specified planning document thoroughly before starting.**

### Project Context

**Tech Stack**:
- Nuxt 4 (Vue 3) + TypeScript
- SQLite database (better-sqlite3)
- Chart.js for visualizations
- Zod for validation
- Tailwind CSS (via Nuxt UI)

**Key Files**:
- `/app/pages/explorer.vue` - Main data explorer page
- `/app/pages/ranking.vue` - Country rankings page
- `/app/model/state.ts` - Application state management
- `/app/composables/` - Vue composables
- `/app/lib/` - Utility libraries
- `PHASE_9_REFACTORING.md` - Current refactoring plan

**Code Conventions**:
- Vue 3 Composition API (script setup)
- TypeScript strict mode
- ESLint: comma-dangle: 'never', braceStyle: '1tbs'
- Nuxt auto-imports (composables, components)

---

## Setup

1. **Create Branch**
   ```bash
   git checkout master
   git pull origin master
   git checkout -b [phase-name]
   ```

   Branch naming:
   - `refactor/phase-9.1-state-validation`
   - `refactor/phase-9.2-explorer-decomposition`
   - `feature/[feature-name]`

2. **Verify Environment**
   ```bash
   npm install
   npm run typecheck
   npm run test
   ```
   All should pass before starting.

---

## Implementation Process

### Step 1: Read & Understand (30 minutes)

**Before writing ANY code:**
1. Read the complete phase specification from the planning document
2. Review all referenced files mentioned in the phase
3. Understand dependencies on other phases
4. Identify any ambiguities or questions
5. **ASK CLARIFYING QUESTIONS** before proceeding

**Questions to answer**:
- What problem does this phase solve?
- What are the success criteria?
- Are there any dependencies on other work?
- What files will be created/modified?
- What tests are needed?

### Step 2: Create Implementation Plan (15 minutes)

Break the phase into logical sub-tasks:
```markdown
## Phase X.Y Implementation Plan

### Sub-tasks
1. [ ] Create new file: app/model/schema.ts
2. [ ] Implement validation logic
3. [ ] Write unit tests
4. [ ] Update explorer.vue to use new validation
5. [ ] Update documentation

### Files to Modify
- app/pages/explorer.vue
- app/model/state.ts

### Files to Create
- app/model/explorerSchema.ts
- app/composables/useExplorerState.ts

### Tests Needed
- Unit tests for schema validation
- Integration tests for state transitions
```

**Share this plan and wait for approval before coding.**

### Step 3: Implement (Incremental)

**Work in small, testable increments:**

1. **Create Core Files First**
   - Implement base functionality
   - Write tests immediately
   - Ensure tests pass before moving on

2. **Follow Existing Patterns**
   - Check how similar code is structured
   - Use same naming conventions
   - Follow established patterns (e.g., composables, schemas)

3. **Write Tests Alongside Code**
   - Unit tests for utilities/functions
   - Integration tests for composables
   - Ensure 514+ tests still passing

4. **Commit Frequently**
   ```bash
   git add [files]
   git commit -m "feat: implement schema validation base

   - Create explorerSchema.ts with Zod schemas
   - Add field-level validation
   - Export TypeScript types

   Part of Phase 9.1"
   ```

5. **Run Checks After Each Logical Unit**
   ```bash
   npm run typecheck
   npm run test
   npm run lint:fix
   ```

### Step 4: Integration & Testing

1. **Integration**
   - Update existing code to use new functionality
   - Ensure backward compatibility where needed
   - Update imports across affected files

2. **Test Thoroughly**
   ```bash
   npm run test                    # All tests
   npm run test -- [specific.test.ts]  # Specific test
   npm run typecheck               # TypeScript
   npm run lint                    # Linting
   ```

3. **Manual Testing**
   - Start dev server: `npm run dev`
   - Test affected features in browser
   - Verify no console errors
   - Test edge cases

### Step 5: Quality Checks

Run complete quality checklist:

```bash
# 1. All tests pass
npm run test

# 2. TypeScript compilation succeeds
npm run typecheck

# 3. Linting passes
npm run lint

# 4. Build succeeds
npm run build
```

**All checks must pass before proceeding.**

### Step 6: Documentation

1. **Code Documentation**
   - JSDoc comments for public functions
   - Inline comments for complex logic
   - README updates if adding new features

2. **Update Planning Documents**
   - Mark phase as complete in planning document
   - Add completion date
   - Note any deviations from plan

Example:
```markdown
## Phase 9.1: State Schema Validation - ✅ COMPLETED

**Status**: Complete
**PR**: #18
**Completion Date**: 2025-10-28

### What Was Accomplished
- Created explorerSchema.ts with Zod validation
- Implemented useExplorerState() composable
- Added 7 cross-field validation rules
- All 520 tests passing
```

### Step 7: Create Pull Request

1. **Push Branch**
   ```bash
   git push -u origin [branch-name]
   ```

2. **Create PR with Template**
   ```markdown
   ## Summary
   Implements Phase 9.1: State Schema Validation from PHASE_9_REFACTORING.md

   ### Changes
   - Created `app/model/explorerSchema.ts` with Zod validation schemas
   - Created `app/composables/useExplorerState.ts` composable
   - Updated `app/pages/explorer.vue` to use new state management
   - Added 15 new unit tests for schema validation

   ### Benefits
   - Prevents invalid state combinations (e.g., excess + baseline)
   - Validates date formats match chart types
   - Auto-fixes common mistakes
   - Better error messages for users

   ## Test Plan
   - [x] All 520 tests pass
   - [x] TypeScript typecheck passes
   - [x] ESLint passes
   - [x] Manual testing in browser
   - [x] Tested URL manipulation scenarios
   - [x] Tested auto-correction logic

   ## Breaking Changes
   None - backward compatible

   ## Screenshots
   [If applicable]

   ## Related Issues
   Implements Phase 9.1 from PHASE_9_REFACTORING.md

   🤖 Generated with [Claude Code](https://claude.com/claude-code)
   ```

3. **Verify CI Passes**
   - Wait for GitHub Actions to complete
   - Fix any failures
   - Request review

---

## Phase-Specific Guidelines

### Phase 9.1: State Schema Validation

**Key Files**:
- Create: `app/model/explorerSchema.ts`
- Create: `app/composables/useExplorerState.ts`
- Modify: `app/pages/explorer.vue`

**Implementation Order**:
1. Create Zod schemas with enums (2 hours)
2. Add field-level validation (1 hour)
3. Add cross-field validation rules (2 hours)
4. Create useExplorerState composable (2 hours)
5. Write tests (2 hours)
6. Update explorer.vue (2 hours)

**Testing Focus**:
- Test each validation rule independently
- Test auto-fix behavior
- Test URL edge cases (manual edits, old bookmarks)

**Success Criteria**:
- Zero invalid states possible
- All validation rules have tests
- User-friendly error messages
- Explorer.vue reduced by ~100 lines

### Phase 9.2: Explorer Component Decomposition

**Dependencies**: Phase 9.1 must be complete

**Key Files**:
- Create: `app/composables/useExplorerData.ts`
- Modify: `app/pages/explorer.vue`
- Modify: `app/components/explorer/ExplorerSettings.vue`

**Implementation Order**:
1. Extract data orchestration into useExplorerData (1 sprint)
2. Update ExplorerSettings to accept state object (0.5 sprint)
3. Replace event handlers with v-model (0.5 sprint)

**Success Criteria**:
- explorer.vue under 800 lines (from 1,190)
- ExplorerSettings accepts state object (not 41 props)
- All functionality preserved

### Phase 9.3: State Class Simplification

**Key Files**:
- Create: `app/model/state/stateProperties.ts`
- Create: `app/services/dataService.ts`
- Modify: `app/model/state.ts`
- Delete: `app/model/state/StateCore.ts`

**Implementation Order**:
1. Create reactive stateProperties object (0.5 sprint)
2. Create DataService class (0.5 sprint)
3. Simplify State class to use composition (0.5 sprint)
4. Update all usages and tests (0.5 sprint)

**Success Criteria**:
- StateCore eliminated (308 lines → 80 lines)
- Zero @ts-expect-error comments in state management
- Clear separation: State vs Helpers vs Data Fetching

### Phase 9.4: Data-Driven Configuration

**Key Files**:
- Create: `app/services/metadataService.ts`
- Create: `app/composables/useDataAvailability.ts`
- Modify: `app/components/explorer/ExplorerDataSelection.vue`

**Implementation Order**:
1. Create MetadataService to parse world_meta.csv (1 sprint)
2. Create useDataAvailability composable (0.5 sprint)
3. Update UI with disabled options and tooltips (1 sprint)
4. Add caching and performance optimizations (0.5 sprint)

**Testing Focus**:
- Test metadata parsing
- Test availability calculations for various country combinations
- Test auto-correction logic
- Test UI state (disabled options, tooltips)

**Success Criteria**:
- Zero empty charts from invalid selections
- All UI options reflect actual data availability
- Metadata cached in memory (fast lookups)

---

## Common Pitfalls & How to Avoid

### ❌ Don't: Make Changes Without Reading Plan
**✅ Do**: Read full phase spec before writing any code

### ❌ Don't: Implement Everything at Once
**✅ Do**: Work in small, testable increments with frequent commits

### ❌ Don't: Skip Tests
**✅ Do**: Write tests alongside code, ensure all 514+ tests pass

### ❌ Don't: Ignore TypeScript Errors
**✅ Do**: Fix type errors immediately, avoid `@ts-expect-error`

### ❌ Don't: Change Existing Behavior Unexpectedly
**✅ Do**: Maintain backward compatibility, document breaking changes

### ❌ Don't: Guess Requirements
**✅ Do**: Ask clarifying questions before starting

### ❌ Don't: Create Massive PRs
**✅ Do**: Break large phases into smaller PRs if needed

---

## Communication Protocol

### When to Ask Questions

**ALWAYS ASK** before proceeding if:
- Requirements are ambiguous
- Multiple valid approaches exist
- Breaking changes might be needed
- Architectural decisions required
- Dependencies on other work unclear

### When to Pause

**STOP and notify** if you encounter:
- Merge conflicts
- Test failures you can't fix
- TypeScript errors you don't understand
- Significant deviation from plan needed
- Blockers or missing information

### Status Updates

Provide updates at key milestones:
1. After reading phase (share understanding)
2. After creating implementation plan (get approval)
3. When ~50% complete (progress check)
4. When PR is ready (notify for review)

---

## Example Workflow

```bash
# 1. Setup
git checkout master
git pull origin master
git checkout -b refactor/phase-9.1-state-validation

# 2. Verify baseline
npm run test     # All pass ✅
npm run typecheck # All pass ✅

# 3. Implement incrementally
# - Create explorerSchema.ts
# - Write tests
npm run test -- explorerSchema.test.ts  # Pass ✅
git add app/model/explorerSchema.ts app/model/explorerSchema.test.ts
git commit -m "feat: create Zod schema for explorer state"

# - Create useExplorerState composable
# - Write tests
npm run test -- useExplorerState.test.ts  # Pass ✅
git add app/composables/useExplorerState.ts
git commit -m "feat: create useExplorerState composable with validation"

# - Update explorer.vue
# - Update tests
npm run test     # All 520 pass ✅
git add app/pages/explorer.vue
git commit -m "refactor: use useExplorerState in explorer.vue"

# 4. Final checks
npm run typecheck  # Pass ✅
npm run lint       # Pass ✅
npm run build      # Pass ✅

# 5. Push and create PR
git push -u origin refactor/phase-9.1-state-validation
gh pr create --title "refactor: Phase 9.1 - State Schema Validation" --body "..."
```

---

## Success Checklist

Before marking a phase complete, verify:

- [ ] All code follows project conventions
- [ ] All tests pass (514+ tests)
- [ ] TypeScript compilation succeeds
- [ ] Linting passes (no warnings)
- [ ] Build succeeds
- [ ] Manual testing completed
- [ ] Documentation updated
- [ ] Planning document marked complete
- [ ] PR created with clear description
- [ ] CI checks passing

---

## Available Commands

```bash
# Development
npm run dev              # Start dev server (http://localhost:3000)

# Quality Checks
npm run typecheck        # TypeScript type checking
npm run lint             # ESLint check
npm run lint:fix         # Auto-fix linting issues
npm run test             # Run all tests
npm run test -- [file]   # Run specific test file

# Build
npm run build            # Production build
npm run generate         # Static site generation
npm run preview          # Preview production build
```

---

## Resources

- **Planning**: `PHASE_9_REFACTORING.md` - Current refactoring plan
- **Architecture**: `.claude/CLAUDE.md` - Project overview
- **Conventions**: `IMPLEMENTATION_PLAN.md` - Project roadmap
- **Completed Work**: `PHASE_8.5_REFACTORING.md` - Reference for patterns

---

## Questions?

If anything is unclear, ambiguous, or requires architectural decisions:

**STOP and ASK before proceeding.**

Better to clarify upfront than to redo work later.
