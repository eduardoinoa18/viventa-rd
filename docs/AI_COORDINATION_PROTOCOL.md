# AI Coordination Protocol (Viventa)

This protocol prevents state drift when working with VS Code AI and Codex.

## 1) Source of Truth
- Local Git branch is the **only** source of truth.
- A change is only considered real after:
  1. local build passes,
  2. local typecheck passes,
  3. commit exists locally.

## 2) Agent Roles
- **You (Release Manager)**: control branch/SHA/deploy decisions.
- **VS Code AI**: execution engine (apply changes, run tests, commit, push).
- **Codex**: patch generator/reviewer for backend structure and guardrails.

## 3) Single Writer Rule
Only one agent/system may perform write operations to Git at a time:
- commit
- push
- merge

> Operational default: Codex runs in patch/suggestion mode; VS Code (or human operator) is the writer.

## 4) Mandatory Pre-Work Sync Checklist
Before asking any agent to generate changes, run:

```bash
git fetch origin
git status
git log --oneline -n 3
```

Then run strict preflight:

```bash
npm run ai:preflight -- <expected-short-sha>
```

Confirm:
- current branch is correct,
- HEAD matches expected remote/local source-of-truth SHA,
- no uncommitted changes.

## 5) Codex SHA-Lock Prompt
Use `docs/CODEX_SHA_LOCK_TEMPLATE.md` as the required prompt prefix for Codex patch requests.

## 6) Commit Base Fingerprint
Each meaningful backend commit should include a base fingerprint footer:

```text
commit-base: <sha>
feature-tag: <scope>
```

Example:

```text
feat(admin-api): migrate to Firebase Admin SDK only

commit-base: 6d93f78
feature-tag: admin-api-auth
```

## 7) PR Hygiene
Each PR should include:
- branch name,
- base commit SHA used for development,
- exact validation commands run,
- known environment limitations (if any).

## 8) Drift Recovery Procedure
If drift is suspected:
1. stop new AI writes,
2. inspect divergence with `git log --graph --oneline --decorate -n 20`,
3. rebase or cherry-pick onto the intended branch tip,
4. rerun build/typecheck,
5. continue with single-writer rule.
