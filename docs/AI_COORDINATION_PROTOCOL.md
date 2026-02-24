# AI Coordination Protocol (Viventa)

This protocol prevents state drift when working with VS Code AI and Codex.

## 1) Source of Truth
- Local Git branch is the **only** source of truth.
- A change is only considered real after:
  1. local build passes,
  2. local typecheck passes,
  3. commit exists locally.

## 2) Agent Roles
- **VS Code AI**: UI work, small refactors, local polish.
- **Codex**: backend restructuring, auth logic, API guardrails.
- **You/Git maintainer**: final authority for commit/push/merge.

## 3) Single Writer Rule
Only one agent/system may perform write operations to Git at a time:
- commit
- push
- merge

Other agents should operate in suggestion/patch mode.

## 4) Pre-Work Sync Checklist
Before asking any agent to generate changes, run:

```bash
git fetch origin
git status
git log --oneline -n 3
```

Confirm:
- current branch is correct,
- HEAD matches expected remote state,
- no uncommitted changes.

## 5) Commit Base Fingerprint
Each meaningful backend commit should include a base fingerprint footer:

```text
commit-base: <sha>
feature-tag: <scope>
```

Example:

```text
feat(admin-api): migrate to Firebase Admin SDK only

commit-base: 2f1366b
feature-tag: admin-api-auth
```

## 6) PR Hygiene
Each PR should include:
- branch name,
- base commit SHA used for development,
- exact validation commands run,
- known environment limitations (if any).

## 7) Drift Recovery Procedure
If drift is suspected:
1. stop new AI writes,
2. inspect divergence with `git log --graph --oneline --decorate -n 20`,
3. rebase or cherry-pick onto the intended branch tip,
4. rerun build/typecheck,
5. continue with single-writer rule.
