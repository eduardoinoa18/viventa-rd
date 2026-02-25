# WEEK 2: CRM Foundation & Lead Routing Control

## Strategic Goal

Build the **intelligence and decision-making layer** that turns Viventa from a listing platform into a **CRM-first operating system**.

After Week 1, Master Admin can create users. Week 2 enables agents to:
1. Add buyers manually with search criteria
2. View matching listings (MLS-style)
3. Send personalized email collections
4. Track buyer engagement metrics

And enables Master Admin to:
1. Control all incoming leads (centralized routing)
2. Assign leads to specific agents/brokers
3. Monitor lead flow and response times

---

## Week 2 Deliverables (4 Tasks)

### Task 1: Buyer Management UI (3-4 days)

**Location:** `/master/buyers` or `/master/crm/buyers`

**What it does:**
- List all buyers with search/filter
- Add new buyer (form)
- View buyer profile
- Edit buyer criteria
- See contact history
- View match recommendations

**Components to Build:**
- `BuyerListPage.tsx` - List view with stats
- `BuyerCard.tsx` - Individual buyer card (summary)
- `BuyerDetailPage.tsx` - Full profile + criteria + matches
- `AddBuyerForm.tsx` - Create new buyer (can embed in modal or page)
- `BuyerCriteriaPicker.tsx` - Location, budget, bedrooms, amenities, etc.

**Database:**
- Extend `users` collection: add `criteria` field (BuyerCriteria type)
- Add `criteria-matches` subcollection or denormalize in buyer doc

**API Endpoints Needed:**
- `GET /api/crm/buyers` - List all buyers (with filters)
- `GET /api/crm/buyers/[id]` - Get buyer detail
- `POST /api/crm/buyers` - Create buyer (or use existing `/api/admin/users`)
- `PATCH /api/crm/buyers/[id]` - Update buyer criteria
- `GET /api/crm/buyers/[id]/matches` - Get matching listings for this buyer

**UI Mockup:**
```
Header: CRM / Buyers
Stats: Total Buyers | Active | Inactive | This Week
Search + Filters (by purpose, location, budget range)

BUYERS TABLE:
- Name | Email | Phone | Purpose | Budget | Location | Created | Actions (View, Edit, Delete)

ACTIONS:
- "Add Buyer" button → form modal
- Click buyer → detail page shows criteria + matching listings
```

---

### Task 2: Email Collection Generator (2-3 days)

**Location:** API endpoint: `GET /api/crm/buyers/[id]/email-collection`

**What it does:**
- Takes a buyer ID
- Queries listings matching buyer criteria
- Generates beautiful HTML email preview
- Returns shareable link
- Logs "sent" event in buyer contact history

**Key Features:**
- Filter listings by: budget, location, bedrooms, amenities
- Calculate price per m²
- Show verified badge
- Include financing options (if available from projects)
- Show property short description
- Show agent contact info
- Mobile responsive

**Database:**
- Create `buyer-communications` collection
  ```
  {
    buyerId: string,
    type: 'email-collection' | 'call' | 'showing',
    sentAt: Timestamp,
    properties: [id1, id2, ...],
    result: 'opened' | 'clicked' | 'contacted' | null,
    details: { ... }
  }
  ```

**API Endpoint:**
```
GET /api/crm/buyers/[id]/email-collection

Response:
{
  ok: true,
  data: {
    buyerId: string,
    listingsCount: number,
    properties: [
      {
        id: string,
        title: string,
        price: number,
        pricePerM2: number,
        beds: number,
        location: string,
        image: url,
        verified: boolean,
      }
    ],
    shareLink: "https://viventa.com/collections/xyz123",
    previewHtml: "<html>...</html>"
  }
}
```

**UI Flow:**
1. Agent views buyer profile
2. Clicks "Send Email Collection"
3. Modal shows preview of matching properties
4. Shows shareable link + copy button
5. Option to send directly or share manually
6. Logs event

---

### Task 3: Lead Queue & Assignment (3 days)

**Location:** `/master/leads` (new admin section)

**What it does:**
- Display all unassigned leads from public CTAs
- Master Admin assigns to Agent/Broker
- Automatically creates inbox conversation
- Tracks lead status (New → Assigned → Contacted → Won/Lost)

**Public CTA Integration:**
Currently, public forms exist:
- Request Info (property detail)
- Request Call
- WhatsApp contact
- Schedule Showing

**Change Required:**
Instead of going directly to agent/broker, all these should:
1. Create a `lead` document in Firestore
2. Assign status: "unassigned"
3. Wait for Master Admin to route

**Lead Document Structure:**
```javascript
{
  id: string,
  type: 'request-info' | 'request-call' | 'whatsapp' | 'showing',
  source: 'property' | 'project' | 'agent', // what was clicked
  sourceId: string,                          // listing/project/agent ID
  buyerName: string,
  buyerEmail: string,
  buyerPhone: string,
  message: string,
  status: 'unassigned' | 'assigned' | 'contacted' | 'won' | 'lost',
  assignedTo?: string,                       // agent/broker ID
  inboxConversationId?: string,              // created when assigned
  createdAt: Timestamp,
  updatedAt: Timestamp,
}
```

**UI Components:**
- `LeadQueuePage.tsx` - Master admin lead management
- `LeadCard.tsx` - Single lead preview
- `LeadAssignModal.tsx` - Assign to Agent/Broker
- `LeadDetailModal.tsx` - View full lead info + history

**API Endpoints Needed:**
- `GET /api/leads/unassigned` - List unassigned leads
- `GET /api/leads?status=assigned` - Filter by status
- `POST /api/leads/assign` - Assign lead to user
- `PATCH /api/leads/[id]` - Update lead status
- `GET /api/leads/[id]` - Get lead detail

**UI Layout:**
```
Header: Lead Queue
Stats: Total | Unassigned | Assigned | Contacted | Won
Filters: Source (Property, Project, Agent) | Status | Date Range

LEADS TABLE:
- From: (buyer name/email) | Source (property/project link) | Type | Status | Actions

ACTIONS PER LEAD:
- View Detail (modal with full message, contact info)
- Assign to... (dropdown to select Agent/Broker)
- Mark as Won / Lost
- Delete

Assign Flow:
1. Click "Assign"
2. Opens modal
3. Select Agent or Broker
4. Add internal note (optional)
5. Click "Assign" → Creates inbox conversation, moves to "assigned"
```

---

### Task 4: Lead Routing Integration (1-2 days)

**Affected Components:**
- Property detail page (Request Info CTA)
- Project detail page (Request Info CTA)
- WhatsApp button click handler
- Schedule Showing modal

**Change:**
Instead of:
```javascript
// OLD: Direct to agent
await sendEmail(agentEmail, buyerMessage)
```

Change to:
```javascript
// NEW: Create lead, notify Master Admin
const leadRef = await addDoc(collection(db, 'leads'), {
  type: 'request-info',
  source: 'property',
  sourceId: propertyId,
  buyerName: formData.name,
  buyerEmail: formData.email,
  buyerPhone: formData.phone,
  message: formData.message,
  status: 'unassigned',
  createdAt: new Date(),
})

// Notify Master Admin
await fetch('/api/notifications/send', {
  method: 'POST',
  body: JSON.stringify({
    to: MASTER_ADMIN_ID,
    type: 'new-lead',
    leadId: leadRef.id,
    title: `New lead from ${buyerName}`,
  })
})
```

---

## Implementation Order (By Dependency)

1. **Database Schema** (first)
   - Add `buyer-communications` collection structure
   - Extend `users.criteria` field for buyers
   - Create `leads` collection structure

2. **API Routes** (second)
   - POST /api/crm/buyers
   - GET /api/crm/buyers
   - GET /api/crm/buyers/[id]
   - GET /api/crm/buyers/[id]/matches
   - GET /api/crm/buyers/[id]/email-collection
   - POST /api/leads
   - GET /api/leads
   - POST /api/leads/assign

3. **UI Pages** (third)
   - `/master/buyers` (list page)
   - `/master/buyers/[id]` (detail page)
   - `/master/leads` (lead queue page)
   - Add modals to existing pages

4. **Public CTA Integration** (fourth)
   - Wire Request Info → Create Lead
   - Wire Request Call → Create Lead
   - Wire WhatsApp → Create Lead
   - Wire Schedule Showing → Create Lead

---

## Testing Strategy (Week 2 End)

### Scenario 1: Buyer Matching
1. Create test buyer (Pedro Pérez, Santo Domingo, 2-bed, $150-300k, Residential)
2. Click "View Matches"
3. Should see 3-5 matching properties
4. Click "Send Email Collection"
5. See preview, copy link
6. Share link, confirm it works

### Scenario 2: Lead Routing
1. Go to public property listing
2. Click "Request Info"
3. Fill form with test data
4. In Master Admin `/master/leads`, see new lead
5. Assign to Agent María López
6. Confirm inbox conversation created
7. Agent receives notification

### Scenario 3: Master Admin Control
1. 5 leads in queue
2. Assign 3 to different agents
3. Filter to show "assigned only"
4. See the 3 assigned leads
5. Mark one as "won"
6. See stats update

---

## Estimated Timeline

- **Task 1 (Buyer Management):** 3-4 days
- **Task 2 (Email Collection):** 2-3 days  
- **Task 3 (Lead Queue):** 3 days
- **Task 4 (CTA Integration):** 1-2 days
- **Testing + Refinement:** 2-3 days

**Total:** 11-15 days (fits in 2-week sprint with buffer)

---

## Success Criteria (Week 2 Complete)

✅ Agents can create buyers with detailed criteria
✅ Email collection generator creates personalized property lists
✅ Master Admin sees all unassigned leads in queue
✅ Master Admin can assign leads to agents/brokers
✅ Inbox conversation auto-creates on assignment
✅ All public CTAs route through Master Admin first
✅ Lead status tracking (New → Assigned → Contacted → Won/Lost)
✅ Build passes with 0 TypeScript errors
✅ E2E tests cover buyer matching + lead assignment flows

---

## Paraiso Inmobiliario Beta Testing

Once Week 2 is complete:

1. **Paraiso Broker (Admin):**
   - Creates 3 test buyers (residential, investment, airbnb)
   - Sees matching listings for each
   - Sends email collections (tests sharing)

2. **Paraiso Agent (María López):**
   - Receives assigned lead
   - Opens inbox conversation
   - Responds to buyer inquiry

3. **Master Admin:**
   - Monitors lead flow
   - Sees 3 agents actively responding to leads
   - Tracks response times
   - Analyzes which properties getting most interest

This tests:
- System stability under real workflow
- Lead routing accuracy
- Email collection quality
- Inbox performance
- Data accuracy

---

## Success = Controlled Ecosystem Proven

After Week 2, Viventa has a **proven, working CRM** that:
- Masters Admin controls all lead distribution
- Agents manage buyer relationships
- Platform tracks everything
- System is measurable and controllable

Ready for Week 3: Dashboard KPIs & Market Intelligence
