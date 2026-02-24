# ⚡ VS Code Deployment Checklist

**Safe, repeatable 60-second deployment flow — zero Codex drift.**

---

## 🚀 Quick Reference

**Copy the checks below into your terminal as you go:**

### Phase 1: Pre-Flight (10 seconds)

```bash
# 1. Verify you're on the right branch
git status

# 2. Fetch latest from remote
git fetch origin

# 3. Check recent commits
git log --oneline -n 3

# 4. Ensure working tree is clean
git status --short
# Should output: nothing, or only staged files you intend to commit
```

**Expected output:**
```
On branch copilot/implement-project-review-plan
Your branch is up to date with 'origin/copilot/implement-project-review-plan'.

# (no uncommitted changes)
```

---

### Phase 2: Code Quality (15 seconds)

```bash
# 5. Type-check
npm run -s typecheck

# 6. Lint
npm run -s lint

# 7. Build
npm run -s build
```

**Expected output:**
```
✓ 84 static routes compiled successfully
✓ No TypeScript errors
✓ No ESLint blocking errors
EXIT: 0
```

---

### Phase 3: Commit & Push (20 seconds)

```bash
# 8. Stage changes
git add .

# 9. Commit with semantic message
git commit -m "feat(admin): [clear, specific description]"
# Examples:
# git commit -m "fix(auth): add Build SHA fingerprinting to footer"
# git commit -m "docs(workflow): add deployment checklist guide"
# git commit -m "refactor(api): consolidate admin guards"

# 10. Push to feature branch
git push origin copilot/implement-project-review-plan

# 11. Verify push
git log --oneline origin/copilot/implement-project-review-plan -n 1
# Should show your commit as HEAD on remote
```

**Expected output:**
```
Enumerating objects: 14, done.
Counting objects: 100% (14/14), done.
Delta compression: 100% (8/8), done.
Writing objects: 100% (8/8), 2.87 KiB | 2.87 MiB/s, done.
Total 8 (delta 6), reused 0 (delta 0), pack-pused 0 (from 0)
To https://github.com/eduardoinoa18/viventa-rd.git
   036a8df..7990dd2  copilot/implement-project-review-plan -> copilot/implement-project-review-plan

✓ Remote branch updated
```

---

### Phase 4: Smoke Test (15 seconds)

**Wait 2-3 minutes for Vercel to redeploy, then:**

```bash
# 12. Check production build SHA (in footer)
# Visit: https://viventa.com (or preview URL)
# Footer should show: "Build 7990dd2" (first 7 chars of latest commit)

# 13. Test critical endpoints
curl -s https://viventa.com/api/smoke | jq .
curl -s https://viventa.com/api/health | jq .

# Expected:
# { "status": "ok", "uptime": "..." }
```

**Expected UI behavior:**
```
✓ Footer shows "Build <7-char-sha>"
✓ Public search page loads
✓ Listing detail page loads
✓ Admin portal redirects to login (or loads if authenticated)
✓ No 500 errors in console
```

---

## 📋 Full Checklist (Print & Use)

Use this markdown table as a face-to-face checklist:

| # | Step | Command | Status | Time |
|---|------|---------|--------|------|
| 1 | Verify branch | `git status` | [ ] | 2s |
| 2 | Fetch remote | `git fetch origin` | [ ] | 2s |
| 3 | Check commits | `git log --oneline -n 3` | [ ] | 1s |
| 4 | Clean tree | `git status --short` | [ ] | 1s |
| 5 | Type-check | `npm run -s typecheck` | [ ] | 5s |
| 6 | Lint | `npm run -s lint` | [ ] | 5s |
| 7 | Build | `npm run -s build` | [ ] | 10s |
| 8 | Stage | `git add .` | [ ] | 1s |
| 9 | Commit | `git commit -m "..."` | [ ] | 2s |
| 10 | Push | `git push origin copilot/...` | [ ] | 3s |
| 11 | Verify push | `git log --oneline origin/... -n 1` | [ ] | 2s |
| 12 | Wait for deploy | Vercel builds (2-3 min) | [ ] | 180s |
| 13 | Check footer SHA | Visit site, scroll footer | [ ] | 10s |
| 14 | Smoke test | `curl /api/smoke` | [ ] | 5s |
| **TOTAL** | | | | **~240s (4 min)** |

---

## 🔴 Emergency Rollback

If smoke test fails:

```bash
# Revert last commit locally
git revert HEAD

# Push revert
git push origin copilot/implement-project-review-plan

# Do NOT merge to main until issue is fixed
```

---

## 🧠 Protocol Reminders

1. **One pusher only:** You (VS Code). Never delegate commits to Codex.
2. **Pre-flight always:** Even if "just one small file" — always run the 4-step pre-flight.
3. **Semantic commits:** Use `feat()`, `fix()`, `docs()`, `refactor()` prefixes.
4. **Build always passes:** If `npm run build` fails, do NOT push.
5. **SHA is truth:** The footer build SHA is the single source of truth for what's deployed.

---

## 🎯 When to Use This

- **Before every commit** to main branch merge
- **Quarterly review:** Update this checklist if the build flow changes
- **Onboarding:** Share with any team member who needs to deploy

---

## 📞 Questions?

Refer to [AI-COORDINATION-PROTOCOL.md](./AI-COORDINATION-PROTOCOL.md) for the authoritative guide on Git authority, branch discipline, and why this workflow prevents drift.

---

**Created:** February 23, 2026  
**Last Updated:** February 23, 2026  
**Status:** ✅ Active (VS Code deployment standard)
