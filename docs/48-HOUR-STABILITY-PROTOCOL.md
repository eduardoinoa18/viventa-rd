# 48-Hour Stability Validation Protocol
**Milestone:** master-v1-foundation  
**Commit:** 2c4f888  
**Start Date:** [To be filled]  
**End Date:** [To be filled]  
**Validator:** [To be filled]

---

## 🎯 OBJECTIVE

Validate that `/master/listings` UI extraction is production-stable before proceeding to Stage 2 (native forms migration).

**Critical Question:**  
Does Master feel like "where the company is controlled" or "a new UI over old machinery"?

---

## 📋 PHASE 1: CRUD STRESS TEST

### Create Operations (Target: 7 listings)

| # | Action | Status | Notes | Timestamp |
|---|--------|--------|-------|-----------|
| 1 | Create listing via iframe modal | ⬜ | Check modal loads, form submits, listing appears | |
| 2 | Create with minimal data | ⬜ | Test validation, required fields | |
| 3 | Create with full data + images | ⬜ | Test image upload, all amenities | |
| 4 | Create with special characters in title | ⬜ | Test character encoding | |
| 5 | Create with very long description | ⬜ | Test field limits | |
| 6 | Create and immediately close modal | ⬜ | Test modal dismiss, data persistence | |
| 7 | Create with Spanish characters (ñ, á, é) | ⬜ | Test i18n support | |

**Console Errors:** [Note any warnings/errors]  
**Firestore Writes:** [Verify correct collection/document format]  
**UI Feedback:** [Note loading states, toast messages]

---

### Edit Operations (Target: 7 listings)

| # | Action | Status | Notes | Timestamp |
|---|--------|--------|-------|-----------|
| 1 | Edit listing (redirects to admin) | ⬜ | Note layout switch, navigation change | |
| 2 | Edit title + save | ⬜ | Verify changes persist | |
| 3 | Edit images (add/remove) | ⬜ | Test image upload/delete | |
| 4 | Edit amenities (toggle 10 items) | ⬜ | Verify checkboxes work | |
| 5 | Edit with autosave enabled | ⬜ | Watch for autosave toasts | |
| 6 | Edit with Ctrl+S shortcut | ⬜ | Test keyboard shortcut | |
| 7 | Edit and navigate away (unsaved) | ⬜ | Verify warning modal appears | |

**Redirect Friction:** [Rate 1-10, where is it jarring?]  
**Admin Layout Confusion:** [Note if layout switch feels disruptive]  
**Data Integrity:** [Confirm all edits saved to Firestore]

---

### Status Change Operations (Target: 15 changes)

| # | Action | Status | Notes | Timestamp |
|---|--------|--------|-------|-----------|
| 1 | Approve single listing (pending → active) | ⬜ | Check badge updates, DB writes | |
| 2 | Reject single listing (pending → rejected) | ⬜ | Verify rejection logic | |
| 3 | Approve 5 listings (check UI normalization) | ⬜ | Confirm "Publicada" badge appears | |
| 4 | Reject 3 listings (check archived mapping) | ⬜ | Verify "Archivada" badge appears | |
| 5 | Change status multiple times on same listing | ⬜ | Test state consistency | |
| 6 | Approve listing with missing required fields | ⬜ | Should still allow (admin override) | |
| 7 | Check email notifications sent | ⬜ | Verify approval emails work | |
| 8-15 | Rapid status changes (stress test) | ⬜ | Watch for race conditions | |

**Badge Rendering:** [Verify colors match new UI status]  
**API Responses:** [Check network tab for PATCH calls]  
**Email Delivery:** [Confirm notifications sent]

---

### Bulk Operations (Target: 10+ listings)

| # | Action | Status | Notes | Timestamp |
|---|--------|--------|-------|-----------|
| 1 | Select 5 listings, bulk approve | ⬜ | Check toolbar appears, API call succeeds | |
| 2 | Select 3 listings, bulk reject | ⬜ | Verify batch update | |
| 3 | Select all (toggle all checkbox) | ⬜ | Test select-all logic | |
| 4 | Deselect all | ⬜ | Verify clear selection | |
| 5 | Select 10 listings, bulk approve | ⬜ | Test larger batch | |
| 6 | Attempt bulk update with 0 selected | ⬜ | Should show toast warning | |

**Instant UI Refresh:** [Verify listings update without reload]  
**Bulk API Performance:** [Note response time]  
**Selection State:** [Check checkboxes stay synced]

---

### Delete Operations (Target: 3 listings)

| # | Action | Status | Notes | Timestamp |
|---|--------|--------|-------|-----------|
| 1 | Delete listing (confirm modal) | ⬜ | Verify confirmation appears | |
| 2 | Delete listing (cancel modal) | ⬜ | Ensure cancel works | |
| 3 | Delete listing with images | ⬜ | Check if images remain in storage | |

**Confirmation UX:** [Rate clarity of delete warning]  
**Data Cleanup:** [Verify Firestore document removed]  
**Image Cleanup:** [Note if orphaned images exist]

---

### Search & Filter Operations (Target: 20+ queries)

| # | Query/Filter | Status | Results | Notes |
|---|--------------|--------|---------|-------|
| 1 | Search: "apartment" | ⬜ | | Real-time filtering? |
| 2 | Search: "Santo Domingo" | ⬜ | | Case sensitivity? |
| 3 | Search: "piantini" | ⬜ | | Accent handling? |
| 4 | Filter: Publicadas | ⬜ | | UI status mapping works? |
| 5 | Filter: Borradores | ⬜ | | Maps to pending? |
| 6 | Filter: Archivadas | ⬜ | | Maps to sold/rejected? |
| 7 | Filter: Todos | ⬜ | | Shows all listings? |
| 8 | Search + Filter combo | ⬜ | | Both work together? |
| 9 | Clear search | ⬜ | | Resets to full list? |
| 10-20 | Rapid filter switching | ⬜ | | Performance degradation? |

**Search Performance:** [Note any lag on large datasets]  
**Filter Accuracy:** [Verify correct listings shown]  
**UI Responsiveness:** [Rate 1-10]

---

## 📋 PHASE 2: NAVIGATION PSYCHOLOGY

### Immersion Test

Use `/master/listings` exclusively for 2 full work sessions (2-4 hours total).

**Session 1:**  
- Date/Time: [To be filled]
- Tasks performed: [List activities]
- Observations:

**Session 2:**  
- Date/Time: [To be filled]
- Tasks performed: [List activities]
- Observations:

### Psychological Assessment

Answer each question honestly (1 = Strongly Disagree, 10 = Strongly Agree):

| Question | Score | Notes |
|----------|-------|-------|
| Does it feel **safe**? (No fear of breaking things) | /10 | |
| Does it feel **fast**? (UI responds instantly) | /10 | |
| Does it feel **authoritative**? (I'm in control) | /10 | |
| Does it feel **centralized**? (Everything in one place) | /10 | |
| Does it feel **fragile**? (Worried about errors) | /10 | |
| Does it feel **modern**? (Contemporary UI standards) | /10 | |
| Does it feel **professional**? (Production-grade) | /10 | |
| Does it feel **dominant**? (Command center vibe) | /10 | |

**Average Score:** [Calculate] / 10

### Friction Points (Write freely)

**Where did you hesitate?**

**Where did immersion break?**

**Where did you feel confused?**

**Where did it feel polished?**

**Where did it feel unfinished?**

---

## 📋 PHASE 3: TECHNICAL VALIDATION

### Console Monitoring

Review browser DevTools console during all operations.

**Warnings Logged:** [List all warnings]  
**Errors Logged:** [List all errors]  
**Network Failures:** [List failed API calls]  
**Performance Issues:** [Note slow operations]

### Memory Leak Check

1. Open DevTools → Performance tab
2. Start recording
3. Perform 20 operations (create, edit, search, filter)
4. Stop recording
5. Check for memory spikes

**Memory Growth:** [Note if memory increases abnormally]  
**Garbage Collection:** [Verify cleanup happens]  
**DOM Nodes:** [Check for DOM leaks]

### Firestore Integrity Check

Query Firestore console and verify:

- [x] All created listings exist
- [x] Status values match expected (active/pending/rejected)
- [x] No orphaned documents
- [x] Images stored correctly
- [x] Agent info populated
- [x] Timestamps accurate

**Data Anomalies:** [List any inconsistencies]

### Network Performance

Check Network tab in DevTools:

**Slowest API Call:** [Route + duration]  
**Failed Requests:** [Count + routes]  
**Average Response Time:** [ms]  
**Largest Payload:** [Route + size]

---

## 📋 PHASE 4: LAYOUT SWITCHING ASSESSMENT

### Admin Redirect Friction

When you click "Editar" and get redirected to `/admin/properties/[id]/edit`:

**Mental Model Break:** [Rate 1-10, how jarring is it?]  
**Navigation Confusion:** [Did you get lost?]  
**Layout Consistency:** [Does it feel like the same app?]  
**Desire to Stay in Master:** [How badly do you want this fixed?]

### Iframe Modal Experience

When you click "Nueva Propiedad" and see iframe:

**Loading Time:** [Perceptible delay?]  
**Visual Consistency:** [Does it feel native?]  
**Interaction Quality:** [Does it feel smooth?]  
**Desire for Native Modal:** [How badly do you want this fixed?]

---

## 🎯 DECISION CRITERIA

### Proceed to Stage 2 if:

- [x] Zero critical bugs detected
- [x] No data integrity issues
- [x] Console errors minimal (<5 warnings)
- [x] Average psychological score ≥6/10
- [x] Bulk operations handle 10+ items
- [x] Search/filter responsive (<200ms)
- [x] Build remains passing

### Iterate on Stage 1 if:

- [ ] Critical bug found (data loss, API failure)
- [ ] Psychological score <6/10
- [ ] Significant performance degradation
- [ ] Layout shifts cause confusion
- [ ] UX friction too high

### Block Stage 2 if:

- [ ] Data corruption detected
- [ ] Revenue engine affected
- [ ] Authentication breaks
- [ ] Cannot rollback safely

---

## 📊 FINAL VERDICT

**Date Completed:** [To be filled]  
**Validator:** [To be filled]  
**Overall Assessment:** [PASS / ITERATE / BLOCK]  

**Key Findings:**

**Recommended Next Steps:**

**Blockers for Stage 2:**

**Priority Fixes:**

---

## 🔥 STRATEGIC QUESTION

After 48 hours, answer honestly:

**Does Master now feel like:**

- [ ] A) "This is where the company is controlled" (Proceed to Stage 2)
- [ ] B) "This is a new UI over old machinery" (Iterate on UX)
- [ ] C) "Still transitional but heading right" (Selective Stage 2)

**Explanation:**

---

**Next Phase:** If PASS → Stage 2A (Native Forms Migration)  
**If ITERATE:** Fix identified issues → Retest → Stage 2  
**If BLOCK:** Emergency stabilization → Root cause analysis
