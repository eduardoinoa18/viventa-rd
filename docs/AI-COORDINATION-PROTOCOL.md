# AI Coordination Protocol (Drift Prevention)

This protocol defines how AI agents are used in this repository without causing state drift.

## Objective

- Keep one authoritative code state.
- Prevent stale PRs and conflicting automated edits.
- Ensure Vercel deploys only tested, reproducible commits.

## Source of Truth

- Local Git branch in VS Code is authoritative.
- A change is only real after:
  1. local edit,
  2. local verification,
  3. local commit.

## Agent Roles

- VS Code agent
  - May edit, run checks, commit, push.
  - Owns final branch state.
- Codex (or secondary agent)
  - Patch/suggestion generator only.
  - Must not create autonomous PRs from stale snapshots.
  - Must not push unless explicitly synchronized to current HEAD.

## Non-Negotiable Rules

1. One pusher rule
   - Only one agent/operator performs commit/push/merge in a cycle.
2. SHA-locked instructions
   - Any secondary AI task must include branch + exact HEAD SHA.
3. No hidden state
   - Never assume memory snapshot equals repo state; always verify with Git.
4. No parallel branch mutation
   - Do not let two agents modify the same branch simultaneously.

## Mandatory Pre-Flight (before any AI-generated change)

Run from repo root:

```bash
git fetch origin
git status
git log --oneline -n 3
git rev-list --left-right --count origin/copilot/implement-project-review-plan...copilot/implement-project-review-plan
```

Interpretation:

- `0 N` => local ahead only, safe normal push.
- `N 0` => local behind, sync first (do not push stale work).
- `N M` => diverged, reconcile intentionally.

## Development Loop (3-step)

1. Generate
   - Use AI for patch proposal only.
2. Validate
   - Run required checks locally (`npm run build`, route smoke tests, targeted QA).
3. Publish
   - Commit with traceable message and push branch.

## Commit Fingerprint Standard

Use commit messages that include feature scope and base fingerprint when relevant:

```text
feat(admin-api): migrate to Firebase Admin SDK only
base-sha: <short-sha>
```

Minimum requirement:

- Conventional prefix (`feat`, `fix`, `chore`, etc.)
- Functional scope (`admin-api`, `auth`, `master-ui`, etc.)

## PR Hygiene Rules

- PR source branch must be the verified local branch.
- Before requesting review:
  - build passes locally,
  - route/auth smoke checks pass,
  - no generated artifacts accidentally staged.
- Do not open a second PR for same scope from a different agent snapshot.

## Vercel Stability Flow

1. Merge only green CI into `main`.
2. `main` is deploy-trigger branch.
3. If hotfix is needed:
   - create hotfix branch from current `main`,
   - patch + verify,
   - merge back to `main`.

## Emergency Drift Recovery

If branch content looks stale or inconsistent:

```bash
git fetch origin
git checkout copilot/implement-project-review-plan
git status
git reset --hard origin/copilot/implement-project-review-plan
```

Then re-apply verified local patches intentionally.

## Default Operating Mode for This Repo

- Keep VS Code local workflow as authority.
- Use secondary AI for focused diffs/snippets only.
- Avoid autonomous PR generation from secondary AI unless SHA-locked and freshly synced.
