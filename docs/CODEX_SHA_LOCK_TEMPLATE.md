# Codex Strict SHA-Lock Template

Use this exact template before asking Codex to generate or modify code.

```text
Task: <describe task>
Current branch: <branch-name>
Current HEAD: <short-sha>
Authority model:
- VS Code/local Git is the single writer.
- Codex may generate patches only.
- Codex must not push or merge.

Rules for this run:
1) Base all changes on Current HEAD exactly.
2) If HEAD does not match, stop and report mismatch.
3) Return patch/diff + validation commands.
4) Include commit-base footer suggestion in output.
```

## Recommended Preflight (run first)

```bash
git fetch origin
git status
git log --oneline -n 3
npm run ai:preflight -- <short-sha>
```

## Example

```text
Task: Fix /api/admin/users 500 response mapping
Current branch: copilot/implement-project-review-plan
Current HEAD: 6d93f78
Authority model:
- VS Code/local Git is the single writer.
- Codex may generate patches only.
- Codex must not push or merge.

Rules for this run:
1) Base all changes on Current HEAD exactly.
2) If HEAD does not match, stop and report mismatch.
3) Return patch/diff + validation commands.
4) Include commit-base footer suggestion in output.
```
