# Week 4 Deployment Runbook: Scheduled Lead Automation
**Deployment Date**: March 2, 2026 | **Status**: ✅ Cloud Functions Live | 🟡 Frontend Deploy Retry

---

## 1. Deployment Summary

### ✅ Completed Components

| Component | Status | Schedule | Region | Notes |
|-----------|--------|----------|--------|-------|
| `scheduledLeadAutoAssign` | **LIVE** | Every 10 minutes | us-central1 | Auto-assigns 'new' stage unowned leads to active agents/brokers |
| `scheduledLeadSlaEscalation` | **LIVE** | Every 15 minutes | us-central1 | Escalates SLA-breached leads (marks escalationStatus='open') |
| Next.js Frontend | 🔄 Rebuild Retry Needed | — | Vercel | Build succeeded; deployment hit internal error |

### Verified in Production

```
✓ scheduledLeadAutoAssign    v1  scheduled  us-central1  256MB  nodejs20
✓ scheduledLeadSlaEscalation v1  scheduled  us-central1  256MB  nodejs20
```

**Artifact Repository Cleanup**: 30-day retention policy configured (prevents cost surprises)

---

## 2. What Each Function Does

### 2.1 Auto-Assign (`scheduledLeadAutoAssign`)
**Trigger**: Every 10 minutes (America/Santo_Domingo timezone)

**Logic**:
1. Queries up to 120 'new' stage leads without owner_agent_id
2. Builds agent/broker pool (active status, role in ['agent','broker'])
3. Loads round-robin counter from `counters/lead_assignment/lastAssignedUid`
4. Assigns up to 50 leads per execution (deterministic ordering)
5. Each assignment updates:
   - `ownerAgentId` → agent UID
   - `assignedTo` → agent name/company
   - `leadStage` → 'assigned'
   - `status` → 'assigned'
   - `assignedAt` → Firestore.FieldValue.serverTimestamp()
   - `slaDueDate` → +2 hours from now (2h SLA for assigned stage)
6. Creates `lead_assignment_logs` entry per assignment
7. Increments counter for next execution

**Expected Monthly Load**: ~3,000 invocations (300 leads/day ÷ 50 per execution × 10-minute intervals)

### 2.2 SLA Escalation (`scheduledLeadSlaEscalation`)
**Trigger**: Every 15 minutes (America/Santo_Domingo timezone)

**Logic**:
1. Scans 300 most recently updated leads
2. Filters: not terminal stage (won/lost/archived), `escalationStatus !== 'open'`, `isSlaBreached === true`
3. For each breached lead:
   - Sets `escalationStatus='open'`
   - Increments `escalationLevel` (0 → 1, 1 → 2, etc.)
   - Records `escalatedAt` and `escalatedBy='system'`
4. Creates `lead_escalation_events` collection entries
5. Logs operation metrics

**Expected Monthly Load**: ~2,880 invocations (4 per hour × 24h × 30 days)

---

## 3. Monitoring & Observability

### Cloud Functions Logs

**View Execution Logs**:
```bash
# All scheduledLeadAutoAssign executions
gcloud functions logs read scheduledLeadAutoAssign --project viventa-2a3fb --limit 50

# All scheduledLeadSlaEscalation executions  
gcloud functions logs read scheduledLeadSlaEscalation --project viventa-2a3fb --limit 50

# Last 100 lines, follow mode (like tail -f)
gcloud functions logs read scheduledLeadAutoAssign --project viventa-2a3fb --limit 100 --follow
```

**In Firebase Console**:
1. Navigate to **Cloud Functions**
2. Click function name (scheduledLeadAutoAssign or scheduledLeadSlaEscalation)
3. Click **Logs** tab → OpenLogs Explorer → Auto-populate query

**Operational Job Telemetry**:
Each function logs to `operational_jobs` collection with structure:
```typescript
{
  job: 'lead_auto_assign' | 'lead_sla_escalation',
  status: 'success' | 'error',
  timestamp: Firestore.Timestamp,
  scanned: number,      // leads evaluated
  assigned: number,     // (auto-assign only)
  escalated: number,    // (escalation only)
  durationMs: number,
  errorMessage?: string // if status=error
}
```

Query operational jobs:
```
db.collection('operational_jobs')
  .where('job', '==', 'lead_auto_assign')
  .orderBy('timestamp', 'desc')
  .limit(10)
  .get()
```

---

## 4. Cost Implications

### Cloud Functions Pricing
- **Free Tier**: 2 million invocations/month (included)
- **Billable**: $0.40 per million invocations after free tier

**Monthly Invocations**:
- Auto-assign: ~3,000 (10m × 24h × 30d × 50 leads/invocation)
- SLA escalation: ~2,880 (15m × 24h × 30d)
- **Total**: ~5,880 invocations/month
- **Cost**: $0 (well below 2M free tier)

### Artifact Registry
- **Policy**: 30-day retention
- **Cost Impact**: Minimal (~$0.10/month for cleanup operations if images persist)

---

## 5. Manual Triggers (On-Demand)

If you need to run auto-assign or escalation immediately (outside scheduled windows):

### Via API Routes

**Manual Auto-Assign** (trigger from leads command center):
```bash
curl -X POST http://localhost:3000/api/admin/leads/auto-assign \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ID_TOKEN" \
  -d '{"limit": 25}'
```

**Manual Escalation** (trigger from leads command center):
```bash
curl -X POST http://localhost:3000/api/admin/leads/escalate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ID_TOKEN" \
  -d '{"limit": 250}'
```

Both endpoints return:
```json
{
  "ok": true,
  "message": "...",
  "data": {
    "scanned": 150,
    "assigned": 23,        // or "escalated"
    "assignedLeadIds": ["..."], // or "escalatedLeadIds"
  }
}
```

### Via Cloud Scheduler (Console)
1. **Cloud Console** → Cloud Scheduler
2. Click job: `projects/viventa-2a3fb/locations/us-central1/jobs/scheduledLeadAutoAssign`
3. Click **Force run** button (top right)
4. Confirm → Function executes immediately

Same for SLA escalation job.

---

## 6. Rollback Procedure

If automation needs to be **disabled** (e.g., bug discovered):

```bash
# Delete the Cloud Function (stops all invocations)
gcloud functions delete scheduledLeadAutoAssign \
  --project viventa-2a3fb \
  --region us-central1

gcloud functions delete scheduledLeadSlaEscalation \
  --project viventa-2a3fb \
  --region us-central1

# Confirm deletion (lists functions)
firebase functions:list --project viventa-2a3fb
```

**To Re-Deploy**:
```bash
cd functions
npm run build
firebase deploy --only "functions:scheduledLeadAutoAssign,functions:scheduledLeadSlaEscalation" \
  --project viventa-2a3fb
```

---

## 7. Infrastructure Code

### Deployment Command (Used)
```bash
# Requires: Node.js 20+, Firebase CLI 13.0+
firebase deploy --only "functions:scheduledLeadAutoAssign,functions:scheduledLeadSlaEscalation" \
  --project viventa-2a3fb

# Set artifact cleanup policy
firebase functions:artifacts:setpolicy \
  --project viventa-2a3fb \
  --location us-central1 \
  --days 30
```

### Function Files Modified
- **functions/src/leadAutomation.ts** (new, 284 lines)
  - `export const scheduledLeadAutoAssign = onSchedule(...)`
  - `export const scheduledLeadSlaEscalation = onSchedule(...)`
- **functions/src/index.ts** (updated)
  - Added exports for both new functions
- **functions/package.json** (updated)
  - `engines.node: "20"` (upgraded from 18)
  - Added `"main": "lib/index.js"`

### Frontend Changes (Week 2-4)
- **app/(dashboard)/master/leads/page.tsx** (828 lines)
  - Handles buttons: `handleRunAutoAssign()`, `handleRunEscalation()`
  - Displays real-time metrics updated on load
  - **Size in production**: 6.8 kB

---

## 8. SLA Rules Reference

These rules are applied identically in API, UI, and Functions:

| Stage | SLA Hours | Notes |
|-------|-----------|-------|
| new | 1 | Assignment deadline |
| assigned | 2 | Contact deadline |
| contacted | 24 | Qualification deadline |
| qualified | 48 | Negotiation deadline |
| negotiating | 72 | Close deadline |
| won / lost / archived | 0 | Terminal; no SLA |

**SLA Breach Calculation**:
```
isSlaBreached = !isTerminalStage && (now - stageEnteredAt > slaDueDate)
```

---

## 9. Firestore Collections Layout

**Leads**:
- `leads/{leadId}`
  - `leadStage`: 'new' | 'assigned' | 'contacted' | 'qualified' | 'negotiating' | 'won' | 'lost' | 'archived'
  - `ownerAgentId`: string (null if unassigned)
  - `assignedAt`: Timestamp
  - `escalationStatus`: 'open' | null
  - `escalationLevel`: number (0, 1, 2, ...)
  - `slaDueDate`: Timestamp

**lead_assignment_logs**:
- `lead_assignment_logs/{docId}` (auto-generated)
  - `leadId`: string
  - `assignedFrom`: 'system' | 'manual'
  - `assignedToUid`: string
  - `assignedToName`: string
  - `timestamp`: Timestamp

**lead_escalation_events**:
- `lead_escalation_events/{docId}`
  - `leadId`: string
  - `escalatedBy`: 'system' | 'manual'
  - `escalationLevel`: number (new value)
  - `timestamp`: Timestamp
  - `reason`: 'sla_breach'

**counters**:
- `counters/lead_assignment`
  - `lastAssignedUid`: string (UID of last agent assigned, for round-robin)
  - `count`: number (lifecycle counter)

**operational_jobs**:
- `operational_jobs/{docId}`
  - `job`: 'lead_auto_assign' | 'lead_sla_escalation'
  - `status`: 'success' | 'error'
  - `timestamp`: Timestamp
  - `scanned`, `assigned` or `escalated`, `durationMs`, `errorMessage?`

---

## 10. Verification Checklist

- [x] Both functions created in Cloud Functions console
- [x] Both functions visible in `firebase functions:list`
- [x] Artifact cleanup policy set (30-day retention)
- [x] Next.js build successful (app size: 6.8 kB for /master/leads)
- [ ] Next.js deployment retry (Vercel internal error - reattempt)
- [ ] Monitor first 3 executions (~30 mins) for logs without errors
- [ ] Verify `operational_jobs` collection receives telemetry
- [ ] Test manual trigger via API buttons in leads command center
- [ ] Review `/master/leads` UI for accuracy with real data

---

## 11. Next Steps

### Immediate (Today)
1. **Retry Vercel deployment** (frontend):
   ```bash
   git add .
   git commit -m "Week 4 runtime upgrade and deployment"
   git push origin main
   ```
   Vercel will auto-redeploy on push.

2. **Monitor Cloud Function logs** for first 30 minutes:
   ```bash
   gcloud functions logs read scheduledLeadAutoAssign --project viventa-2a3fb --follow
   ```

### This Week
3. View `/master/leads` in production and confirm:
   - KPI metrics load
   - Table shows recent auto-assigned leads
   - Escalation counts accurate
   - Broker ranking panel displays correctly

4. Test manual triggers:
   - Click **Run Auto-Assign** button → watch for toast notification
   - Click **Escalate SLA** button → monitor assigned leads jump

### Next Sprint
5. Consider alerting:
   - Cloud Function error notifications (Cloud Monitoring)
   - Daily automation summary email (operational_jobs query)
   - Firestore quota warnings (if usage spikes)

---

## 12. Support References

| Issue | Resource |
|-------|----------|
| Cloud Functions error | [GCP Logs Explorer](https://console.cloud.google.com/logs) |
| Firebase deployment | `firebase deploy --debug` |
| Firestore query help | [Firestore Quickstart](https://firebase.google.com/docs/firestore/quickstart) |
| SLA logic details | [CUSTOM-SEARCH.md](CUSTOM-SEARCH.md) (stage normalization section) |
| UI command center | [/master/leads page](../app/(dashboard)/master/leads/page.tsx) |

---

**Questions?** Check Cloud Functions console → Logs tab for real-time execution feedback.
