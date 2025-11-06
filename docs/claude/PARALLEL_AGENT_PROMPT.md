Parallel Worktree Refactoring Prompt

Task: Execute parallel refactoring tasks using git worktrees and separate PRs.

Process:

1. Read plan from .claude/[PLAN_FILE].md - understand tasks and dependencies
2. Identify parallelizable tasks - find tasks with no dependencies on each other
3. Create worktrees: git worktree add ../task-X -b refactor/task-X-description master
4. Launch agents in parallel using Task tool - one agent per task
5. Each agent must:


    - Complete full implementation
    - Run npm install, npm run check, npm run test:e2e
    - Commit with message: "refactor: [description]"
    - Push and create PR

6. Monitor CI - fix any failures immediately
7. After merge: Fetch/pull, identify next tasks, repeat

Agent Instructions Template:
Working Directory: /Users/ben/dev/alyson-task-X
Branch: [feature]/task-X
Context: Read .claude/[PLAN].md lines X-Y
Tasks: [list from plan]
Validation: npm run check && npm run test:e2e
Commit: "feature: [FEATURE] - [description]"
Create PR with title: "feature: [FEATURE] - [description]"

Key Principles:

- Maximize parallelization where dependencies allow
- Each PR is small, focused, independently mergeable
- All tests must pass before pushing
- Report: line changes, test results, PR URL
