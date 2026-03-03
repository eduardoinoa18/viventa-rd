# VIVENTA PLATFORM ARCHITECTURE UPGRADE
## Structural Evaluation & Strategic Roadmap

**Date**: March 2026  
**Scope**: Transform Admin Portal from Operational Tool → National Command Center  
**Goal**: Build MLS/Zillow-scale ecosystem for Dominican Republic  
**Status**: Strategic Planning Phase (Pre-Implementation)

---

## 🎯 STRATEGIC REALITY

### Your North Star
- **Operate as**: Digital real estate backbone of DR
- **Compete with**: MLS + Zillow + Zillow for Brokers + developer distribution
- **Control**: Listings, transactions, agents, buyers, market data, compliance
- **Monetize**: Subscriptions, commissions, listings, developer packages, data insights

### What Viventa Must Become
Not a website. A **platform operating system** for Dominican real estate.

Brokerages should not want to operate without you.

---

## 📊 CURRENT STATE AUDIT

### What You Have (✅ Strong)
- **Operational Layer**: Lead queue, assignment automation, escalation rules
- **Basic Metrics**: KPI dashboard, agent view, lead pipeline
- **Execution Control**: Auto-assign, SLA enforcement, activity logging
- **User Management**: Admin, agent, broker, buyer role system

### What You're Missing (❌ Critical)
- **Revenue Control**: No subscription management, billing, commission tracking
- **Market Governance**: No market data visibility, sector dominance, competitor tracking
- **Growth Engine**: No signup analytics, funnel visibility, source attribution
- **Data Quality**: No integrity monitoring, duplicate detection, quality scoring
- **Compliance**: Limited audit trails, no exportable logs, no override tracking
- **Financial Intelligence**: No MRR dashboard, no revenue forecasting, no churn analysis
- **Buyer Intelligence**: No CRM, no engagement scoring, no conversion tracking
- **Marketplace Intelligence**: No heatmaps, no inventory metrics, no price anomalies

**Result**: You can operate leads today. You cannot scale or defend the platform.

---

## 🏛 ADMIN PORTAL — 6 MACRO LAYERS

### Layer 1: Executive Layer (Strategic)
CEO/Board visibility into:
- Company health (growth, revenue, risk)
- Market position (share, dominance, gaps)
- System integrity (data quality, compliance, risk)
- Investor readiness (metrics, governance, forecasting)

**Owned by**: Master Dashboard, Executive Overview, Revenue Dashboard

### Layer 2: Operational Layer (Tactical)
Real-time command center for:
- Lead queue management
- Agent assignment & performance
- Escalation & SLA enforcement
- Activity logging & audit

**Owned by**: Control Center, Leads page, Activity logs

### Layer 3: Marketplace Layer (Intelligence)
Market data & ecosystem health:
- Inventory visibility
- Price intelligence
- Sector performance
- Broker dominance mapping
- Lead-to-close conversion

**Owned by**: NEW Marketplace Intelligence tab

### Layer 4: Revenue Layer (Financial)
Monetization control:
- Subscription management
- Seat usage & billing
- Commission splits
- Developer packages
- Payment failure recovery

**Owned by**: NEW Revenue & Billing tab

### Layer 5: Growth Layer (Scaling)
User acquisition & engagement:
- Signup velocity
- Conversion funnels
- Source attribution
- Retention metrics
- Email/push engagement

**Owned by**: NEW Growth Engine tab

### Layer 6: Governance & Compliance Layer (Institutional)
Data integrity & legal readiness:
- Data quality monitoring
- Duplicate detection
- Compliance audit trails
- Export capabilities
- Override logging

**Owned by**: NEW Data Quality tab, Upgraded Audit logs

---

## 🔥 NEW REQUIRED ADMIN TABS (Not Optional)

### 1️⃣ REVENUE & BILLING TAB
**Purpose**: Control subscription monetization, track MRR, manage commissions  
**URL**: `/master/revenue`

#### Core Sections

**A. Subscription Plans**
```
Display:
├─ Plan name (Basic, Professional, Enterprise)
├─ Monthly price (DOP)
├─ Features included
├─ Current subscribers count
├─ MRR from plan
└─ Action: Edit, Duplicate, Archive

Metrics:
├─ Total MRR
├─ MRR growth (30d, 90d)
├─ Churn rate
├─ ARPU (average revenue per user)
└─ Expansion revenue
```

**B. Brokerages Billing**
```
Display:
├─ Brokerage name
├─ Current plan
├─ Seats used / allotted
├─ Monthly cost
├─ Billing cycle
├─ Payment method
├─ Status (active / grace / suspended)
├─ Last payment date
├─ Next billing date
└─ Actions: Upgrade, Downgrade, Grace, Suspend, Manual Refund

Filters:
├─ By status (active / grace / suspended / churned)
├─ By plan (Basic / Professional / Enterprise)
├─ By billing cycle (due soon / overdue / paid)
└─ By revenue (high to low)

Alert:
├─ Payments failing > 3 days
├─ Seat overage (using more than plan allows)
└─ Upcoming churn (low activity + approaching renewal)
```

**C. Constructoras Billing**
```
Display:
├─ Developer company name
├─ Active projects
├─ Listings published (month)
├─ Package (bronze / silver / gold)
├─ Monthly cost
├─ Commission rate
├─ Active deals pipeline (DOP value)
└─ Actions: Edit package, Adjust commission, Enable featured

Metrics:
├─ Developer MRR
├─ Developer commission revenue
└─ Developer CAC (cost to acquire)
```

**D. Transactions & Commissions**
```
Display:
├─ Transaction date
├─ Parties (buyer / seller brokerages)
├─ Property address
├─ Sale value (DOP)
├─ Commission percent
├─ Commission amount (Viventa cut)
├─ Commission split (platform / brokerage)
├─ Status (pending / completed / disputed)
└─ Actions: Force update, Append note, Dispute

Filters:
├─ By date range
├─ By status
├─ By brokerage
├─ By value range
└─ By commission tier

Exports:
├─ CSV with transaction details
├─ Commission reports by brokerage
└─ Commission forecasts (pipeline)
```

**E. Payment Failures**
```
Alert:
├─ Failed payment date
├─ Brokerage name
├─ Amount (DOP)
├─ Failure reason (insufficient funds, expired card, etc.)
├─ Retry count
└─ Days overdue

Actions:
├─ Manual retry
├─ Contact brokerage (email template)
├─ Adjust due date
├─ Apply grace period
└─ Suspend access if critical
```

**F. Stripe Event Logs**
```
Display:
├─ Timestamp
├─ Event type (charge.succeeded, charge.failed, etc.)
├─ Brokerage
├─ Amount
├─ Status
├─ Raw Stripe response (expandable)
└─ Manual override option

Filters:
├─ By event type
├─ By date range
├─ By outcome (success / failure)
└─ By brokerage

Debug:
├─ Raw API logs
├─ Webhook history
└─ Reconciliation checks
```

---

### 2️⃣ MARKETPLACE INTELLIGENCE TAB
**Purpose**: Understand market dominance, pricing, inventory velocity  
**URL**: `/master/marketplace`

#### Core Sections

**A. Listings by Sector**
```
Display (Table + Heatmap):
├─ Sector name (Santo Domingo, Santiago, etc.)
├─ Active listings count
├─ New listings (this month)
├─ Average price (DOP)
├─ Price range (min - max)
├─ Listing velocity (listings/day)
├─ Days on market (average)
├─ Inventory coverage % (Viventa share of market)
└─ Trend (↑ growing, ↓ shrinking)

Filters:
├─ By property type (residential, commercial, land, etc.)
├─ By date range
├─ By price band
└─ By verification status
```

**B. Broker Dominance Map**
```
Display (Geographic Heatmap):
├─ X-axis: Sectors (Santo Domingo, Santiago, Puerto Plata, etc.)
├─ Y-axis: Top brokers (by listing count)
├─ Cell value: Listing count + %

Reveals:
├─ Which brokers dominate which areas
├─ Opportunities (gaps where no broker dominates)
├─ Market concentration risk
└─ Cross-sector strategies

Actions:
├─ Target marketing to brokers in weak areas
├─ Identify developer opportunities
└─ Commission incentives for underserved sectors
```

**C. Inventory Metrics**
```
Real-time Display:
├─ Total active listings
├─ Listings added (today / this week / this month)
├─ Listings sold/archived (this month)
├─ Inventory turnover rate
├─ Average days on market
├─ Fastest selling sectors
├─ Slowest selling sectors
└─ Price trends (↑ up, ↓ down)

Forecasts:
├─ Projected inventory (30d, 90d)
├─ Seasonal patterns
└─ Market saturation index
```

**D. Lead-to-Close Analytics**
```
Display:
├─ Leads generated (this month)
├─ Leads qualified (conversation started)
├─ Leads converted (property inquiry)
├─ Leads closed (transaction)
├─ Conversion rate (%)
├─ Days from inquiry to close
├─ Conversion rate by broker
├─ Conversion rate by segment

By Channel:
├─ Organic search conversion
├─ Referral conversion
├─ Developer sourced conversion
└─ Agent sourced conversion
```

**E. Price Analytics**
```
Display:
├─ Average price by sector
├─ Median property value
├─ Price distribution chart
├─ Year-over-year price change
├─ Price per sqm (market standard)
├─ Anomalies (listings significantly above/below market)
└─ Flags suspicious prices (manual review needed)

Alerts:
├─ Property priced > 50% above market (likely error)
├─ Property priced < 50% below market (likely error)
└─ Recommend repricing
```

---

### 3️⃣ DATA QUALITY & INTEGRITY TAB
**Purpose**: Prevent entropy, maintain data trust and institutional credibility  
**URL**: `/master/data-quality`

#### Core Sections

**A. Data Quality Score**
```
Overall Platform Score: 94/100 (Shows health at-a-glance)

Breakdown by Category:
├─ Listing completeness: 96/100 (images, description, pricing)
├─ User profile completeness: 89/100 (agent photos, licenses, etc.)
├─ Geocoding accuracy: 92/100 (property coordinates verified)
├─ Duplicate detection: 98/100 (false positives < 2%)
├─ Lead follow-up rate: 84/100 (leads with activity in 48h)
└─ Agent responsiveness: 87/100 (response time < 2h average)

Goals:
├─ Set minimum threshold (e.g., 90/100 required)
├─ Track improvement over time
└─ Alert when score drops below threshold
```

**B. Listings Data Issues**
```
Table (Sortable by severity):

Issue Type | Count | Severity | Action
-----------|-------|----------|--------
Missing images | 23 | HIGH | Contact broker, auto-flag listing
Missing geocode | 7 | CRITICAL | Prevent publishing without geo
Duplicate listings | 12 | MEDIUM | Merge or delete manually
Price anomaly | 4 | HIGH | Require manual verification
Incomplete description | 56 | LOW | Auto-suggest improvements
Old photos (>1y) | 34 | MEDIUM | Request refresh

Actions per Issue:
├─ Bulk contact brokerage (email template)
├─ Auto-flag listing (prevents boosting)
├─ Require manual fix before republishing
├─ Schedule compliance check
└─ Escalate to broker admin if unresolved after 7 days
```

**C. User Profile Completeness**
```
Display:
├─ Agents with incomplete profiles: 23
├─ Missing license verification: 8
├─ Missing agent photo: 15
├─ Missing company affiliation: 3
├─ Abandoned buyer profiles (no activity 30d): 156

Actions:
├─ Send compliance email (templated)
├─ Auto-suspend listing ability if critical fields missing
├─ Require photo upload before allowing leads
└─ Schedule manual check if deadline passed

Metric:
├─ Profile completeness trending (should improve over time)
└─ Compliance rate (%)
```

**D. Duplicate Detection**
```
Algorithm Flags:
├─ Same address + same price (100% duplicate risk)
├─ Same address + same owner (likely re-list)
├─ Same photos (likely copy-paste)
├─ Same description + same location (likely copy-paste)
├─ Same coordinates + different address (geo error)

Display:
├─ Duplicate group (often 2-5 listings)
├─ Photos comparison (side-by-side)
├─ Description comparison
├─ Price difference
├─ Listing date difference
├─ Recommended action (merge / archive / keep)

Actions:
├─ Manual merge (combine activity)
├─ Archive primary copy (keep most recent)
├─ Contact owner for clarification
└─ Auto-flag if suspected fraud
```

**E. Abandoned Data**
```
Alert On:
├─ Conversations with no follow-up (48h+ since last message)
├─ Leads assigned but no status change (7d+ idle)
├─ Listings with no views (30d+)
├─ Agent accounts with no activity (30d+)
├─ Buyer accounts created but never logged back in (14d+)

Actions:
├─ Trigger escalation (assign to broker admin)
├─ Send reengagement email
├─ Auto-reassign abandoned leads
├─ Archive archived listings after 90 days
└─ Notify of account at risk of suspension

Metrics:
├─ Abandonment rate trending
└─ Reactivation rate from notifications
```

**F. Orphaned Records**
```
Detect:
├─ Conversations with deleted lead
├─ Leads with deleted buyer
├─ Listings with deleted agent
├─ Transactions with missing parties
├─ Activities referencing deleted objects

Actions:
├─ Show what went wrong
├─ Assign to data engineer for cleanup
├─ Prevent future orphaning (FK constraints)
└─ Archive safely without breaking relationships
```

---

### 4️⃣ AUDIT & COMPLIANCE UPGRADE
**Purpose**: Institutional-grade audit trail for regulators and legal  
**Current**: `/master/activity`  
**Upgrade**: `/master/compliance`

#### Enhanced Features

**A. Advanced Filtering**
```
Current: Basic timestamp + actor display

Upgrade:
├─ Time picker (exact date/time range)
├─ Actor filter (by user, role, permission level)
├─ Object filter (by entity type: lead, listing, user, etc.)
├─ Object ID filter (drill down to specific lead/listing)
├─ Action type filter (by operation: create, update, delete, override)
├─ Outcome filter (success / failure)
└─ IP address filter (track device locations)
```

**B. IP & Device Logging**
```
Track per action:
├─ IP address (show geo location)
├─ User agent (browser, OS)
├─ Session ID
├─ Timestamp
└─ Signature (for disputes)

Use Cases:
├─ Detect suspicious activity (multiple IPs same user)
├─ Prevent fraud (track admin overrides from unusual locations)
├─ Comply with data protection regs
└─ Audit trail for investigations
```

**C. Admin Override Logging**
```
Special tracking for privileged actions:

Title: "Administrator Actions"

Display:
├─ Admin name
├─ Override type (force assignment, suspend account, delete data, etc.)
├─ Target entity (which lead/user/listing)
├─ Reason provided
├─ Timestamp
├─ Approval status (if required)
├─ IP address
└─ Impact (how many records affected)

Approval Workflow:
├─ If override > threshold, require 2nd approval
├─ Track approval chain
└─ Alert CEO if sensitive action (like financial adjustment)
```

**D. Escalation Actions Log**
```
Track all escalations:
├─ Escalation trigger (SLA breach, duplicate, suspicious activity)
├─ Who escalated
├─ To whom (which broker/manager)
├─ Timestamp
├─ Escalation level (1st / 2nd / executive)
├─ Resolution
├─ Time to resolve
└─ Follow-up notes

Metrics:
├─ Escalation volume trending
├─ Most common escalation types
├─ Resolution time trending
└─ Unresolved escalations (>7 days red flag)
```

**E. CSV Export**
```
Functionality:
├─ Select date range
├─ Select filters to apply
├─ Generate CSV
├─ Download with audit signature
├─ Retain export log (who downloaded what when)

Format:
├─ Timestamp | Actor | Role | Action | Object Type | Object ID | Status | IP | Details
├─ Include all fields needed for regulatory audit
└─ Cryptographic signature for legal admissibility

Retention:
├─ Archive exports for 7 years (regulatory requirement)
└─ Alert if export requested for unusual data
```

---

### 5️⃣ GROWTH ENGINE TAB
**Purpose**: Track user acquisition velocity, conversion funnels, retention  
**URL**: `/master/growth`

#### Core Sections

**A. Signup Metrics**
```
Real-time Dashboard:
├─ New signups (today / this week / this month)
├─ Signup velocity (users/day trend)
├─ Signup forecast (projected month-end)
├─ Peak signup hours (when do people register)
├─ By role breakdown (agents / brokers / buyers / developers)

Channels:
├─ Organic search signups
├─ Referral signups (tracking code)
├─ Paid ads signups (Facebook, Google)
├─ Direct signups
├─ Broker invites
└─ Agent invites

Trends:
├─ Week-over-week growth %
├─ Month-over-month growth %
├─ Forecasted annual growth
└─ Churn-adjusted growth (net new users = signups - inactive)
```

**B. Registration Completion Funnel**
```
Funnel Visualization:

Step 1: Email/Phone → 1,250 users (100%)
Step 2: Email verified → 1,180 users (94%)
Step 3: Profile created → 1,050 users (84%)
Step 4: Role selected → 980 users (78%)
Step 5: Brokerage/Company → 920 users (74%)
Step 6: First action taken → 750 users (60%)

Drop-off Analysis:
├─ Why do 50 users leave at Step 2? (email verify barrier)
├─ Why do 131 users abandon at Step 3? (too many profile fields?)
├─ Why do 170 users never take action? (too much friction)

Optimization Actions:
├─ Simplify field requirements
├─ Add progress indicator
├─ Auto-fill known data
├─ Send re-engagement emails
└─ A/B test signup flow
```

**C. Buyer Conversion Funnel**
```
Tracking Customer Journey:

Stage 1: Page visitor → 25,000/month
Stage 2: Property view → 12,500 (50%)
Stage 3: Favorite property → 3,750 (30%)
Stage 4: Create account → 2,100 (56% of property viewers)
Stage 5: Submit inquiry → 750 (36% of registered)
Stage 6: Contacted by agent → 450 (60%)
Stage 7: Property viewing scheduled → 200 (44%)
Stage 8: Offer made → 45 (22%)
Stage 9: Deal closed → 15 (33%)

Conversion Rate: Page View → Closed Deal = 0.06%

Opportunities:
├─ Add soft login (blur-then-unlock) at Stage 2
├─ Simplify inquiry form (currently 8 fields, reduce to 3)
├─ Speed up agent follow-up (target 30min response)
└─ Smooth viewing → offer journey

Benchmarks:
├─ Industry standard buyer conversion: 1-3%
├─ Your target: 0.5% (conservative for market maturity)
└─ Track against target weekly
```

**D. Source Attribution**
```
Tracking where users come from:

Source | Signups | Revenue/User | Cost/User | LTV | ROI
--------|---------|-------------|-----------|-----|-----
Google organic | 450 | $180 | $0 | $180 | ∞
Meta/Facebook ads | 280 | $120 | $45 | $120 | 2.7x
Google Ads | 120 | $240 | $80 | $240 | 3.0x
Referral (broker) | 95 | $300 | $0 | $300 | ∞
Direct | 55 | $150 | $0 | $150 | ∞
Press/PR | 30 | $400 | $10 | $400 | 40x

Insights:
├─ Which channels drive high-value users?
├─ Which channels have best retention?
├─ Which channels have highest CAC (cost to acquire)?
├─ Where to increase marketing spend?

Actions:
├─ Scale high-ROI channels
├─ Test new channels (Zillow partnerships, MLS feeds)
├─ Optimize landing pages by source
└─ Track UTM parameters religiously
```

**E. Email Engagement**
```
Metrics:
├─ Emails sent (by campaign)
├─ Open rate (%)
├─ Click-through rate (%)
├─ Unsubscribe rate (%)
├─ Bounce rate (%)

Campaigns:
├─ Welcome series (5 emails over 30 days)
├─ Weekly digest (new listings in area)
├─ Abandoned property (viewed but not saved)
├─ Inactive user (no login 14 days)
├─ Re-engagement (no login 30 days)

Performance:
├─ Which subject lines win-rates?
├─ Which send times drive highest open?
├─ Which content drives most clicks?

Testing:
├─ A/B test subject lines
├─ A/B test call-to-action button color
├─ A/B test send time (9am vs 7pm)
└─ Track lift over control group
```

**F. Push Notification Engagement**
```
Metrics (for mobile app):
├─ Delivery rate (%)
├─ Open rate (%)
├─ Click-through rate (%)
├─ Uninstall rate (%)

Campaigns:
├─ Price drop alerts
├─ New listings in area
├─ Agent follow-up reminder
├─ Viewing appointment reminder
├─ Offer received alert

Performance:
├─ Best time to send notifications
├─ Best notification copy
├─ Frequency sweet spot (too many = uninstall)

Optimization:
├─ Smart timing (don't send at 3am)
├─ Personalization (by saved properties)
└─ AI prediction (when user is most likely to engage)
```

---

## 📄 EXISTING TABS — PAGE-BY-PAGE UPGRADES

### 🏠 MASTER DASHBOARD
**Current**: Basic KPI cards  
**Upgrade**: Strategic command center

#### Add Elements

**A. Time Range Selector**
```
Currently: Shows today's snapshot only

Add:
├─ Date range picker (custom range)
├─ Quick presets (today, 7d, 30d, 90d, YTD, all-time)
├─ Compare periods (this month vs last month)
└─ Compare to same period last year

Impact:
├─ See trends (growing or shrinking?)
├─ Seasonal patterns
└─ Year-over-year growth
```

**B. Trend Lines**
```
Currently: Static numbers (150 new leads)

Add:
├─ 7-day trend (little sparkline chart)
├─ 30-day trend (line chart)
├─ 90-day trend (line chart with projection)
├─ Trend direction indicator (↑ improving, ↓ declining, → flat)
├─ Percentage change vs last period

Examples:
"Leads 150" → "Leads 150 ↑ 12% vs last week"
"Closed 5" → "Closed 5 ↓ -8% vs last week" [RED ALERT]
"Users 1,200" → "Users 1,200 ↑ 5% vs last week"
```

**C. Top Performing Brokers Section**
```
Add below KPI cards:

Title: "Top Brokers This Month"

Table:
├─ Rank (1, 2, 3, etc.)
├─ Broker name
├─ Listings published
├─ Leads assigned
├─ Deals closed
├─ Revenue (commission)
├─ MRR (subscription)
└─ Total value

Trend:
├─ Last week ranking vs this week (moved up/down)
└─ Growth direction

Alerts:
├─ Broker X jumped from #5 to #2 (momentum)
├─ Broker Y dropped out of top 10 (concern)
└─ New broker entered top 10 (monitor)

Actions:
├─ Click to view broker dashboard
├─ View broker subscription status
└─ View recent escalations from this broker
```

**D. Lead Velocity Chart**
```
Visualization: Line chart

X-axis: Day (last 30 days)
Y-axis: Leads received
Color: Green line = historical average

Shows:
├─ Daily lead count
├─ 7-day moving average
├─ Trend direction (↑ growing, ↓ declining)
├─ Anomalies (spike or dip explanation)
└─ Forecast (projected month-end)

Interpretation:
"We're getting 150 leads/day. This is 12% above our 30-day average. 
At this pace, we'll close the month with 4,500 leads."

Alerts:
├─ If today < 70% of average (unusual drop)
├─ If trend negative 3+ days
└─ If forecast misses target
```

**E. Registration Velocity Chart**
```
Visualization: Line chart

X-axis: Day (last 30 days)
Y-axis: New user signups
Color: Blue line = historical average

Shows:
├─ Daily new users
├─ 7-day moving average
├─ Week-over-week growth
├─ By role (agents, brokers, buyers, separate lines)
└─ Forecast (projected month-end users)

Interpretation:
"We gained 250 users today. We're trending 8% above 30-day average.
By month-end, we'll have 7,500 new users (target: 7,000). ✅"

Alerts:
├─ If any user type drops (e.g., agent signups down 20%)
├─ If churn spikes (weekly)
└─ If buyer signups plateau
```

**F. "Is Viventa Growing?" Summary**
```
Bottom of dashboard (one-line status):

✅ GROWTH STATUS: TRACKING
• New leads: 150/day (↑ 12% vs avg)
• New users: 250/day (↑ 8% vs avg)
• Deal velocity: 15 closed (↑ 5% vs avg)
• MRR: $12,500 (↑ 3% vs last month)
• Status: ON TRACK for quarterly target

🟡 GROWTH STATUS: AT RISK
• New leads: 90/day (↓ 25% vs avg) ⚠️
• New users: 80/day (↓ 40% vs avg) 🔴
• Deal velocity: 3 closed (↓ 60% vs avg) 🔴
• MRR: $11,200 (↓ 5% vs last month)
• Status: MISSING quarterly target - investigation needed
```

---

### 🎯 EXECUTIVE OVERVIEW
**Current**: KPI metrics + risk cards  
**Upgrade**: Investor-ready dashboard

#### Add Elements

**A. Risk Index**
```
Composite Score: 24/100 (LOW RISK ✅)

Components:
├─ SLA Breach Rate: 12/100 (severe: >30% of leads breached) → RED
├─ Agent Inactive: 45/100 (10% of agents inactive 14+ days) → YELLOW
├─ Data Quality: 92/100 (high quality)
├─ Subscription Health: 88/100 (low churn)
├─ Infrastructure: 99/100 (99.9% uptime last 30d)
└─ Compliance: 95/100 (all audit trails clean)

Interpretation:
Score < 30: LOW RISK (green)
Score 30-60: MODERATE RISK (yellow) - watch but manageable
Score > 60: HIGH RISK (red) - immediate action required

Alert Triggers:
├─ If risk index rises 10 points in 1 week
└─ If any component drops below 30
```

**B. Revenue Snapshot (Financial Health)**
```
Display (Card):

Monthly Recurring Revenue (MRR): $12,500 (↑ 3% vs last month)
  Subscriptions: $8,200
  Commissions: $3,100
  Developer fees: $1,200

Forecast (next 12 months): $156,000
  Trend: GROWING (↑ 8% annualized growth assumed)

Outstanding Invoices: $2,100 (overdue)
  Brokers in grace period: 3
  Payment failures this month: 2

Health:
├─ Churn rate: 5% (acceptable < 10%)
├─ Customer acquisition cost: $120/user
├─ Customer lifetime value: $2,100
└─ LTV:CAC ratio: 17.5x (excellent)

Actions:
├─ Click to view full Revenue tab
├─ View payment failures (retry / follow up)
└─ View churn risk brokers (retention campaign)
```

**C. System Health**
```
Real-time Status:

API Availability: 99.9% (last 30d)
  Response time: 145ms (p95)

Database: ✅ Healthy
  Connections: 24/50
  Query time: 82ms (p95)

Errors: 12 (last 24h)
  Critical: 0
  Warning: 4
  Info: 8

Recent Incidents:
├─ Payment webhook delay (2h ago, resolved)
├─ Email delivery failure (4h ago, 5 emails, resolving)
└─ (No critical incidents last 30d) ✅

Monitoring:
├─ Alert if error rate > 1% of requests
├─ Alert if uptime < 99%
└─ Alert if response time > 500ms
```

**D. Market Coverage Map**
```
Visualization: Dominican Republic map (color coded)

Sector color code:
├─ Dark green: >50% of listings (strong coverage)
├─ Light green: 25-50% coverage
├─ Yellow: 10-25% (gaps)
├─ Red: <10% coverage (major gap)

Shows:
├─ Geographic distribution of listings
├─ Market penetration by region
├─ Where competitors might be strong
└─ Opportunity zones (red areas)

Metrics overlay:
├─ Hover sector: "Santo Domingo: 2,150 listings (28% market share)"
├─ Broker count in sector
├─ Average property price
└─ Lead volume this month

Actions:
├─ Click sector to drill into area metrics
└─ View brokers in area (recruitment opportunity)
```

**E. Data Verification Rate**
```
Display:

Overall Verification: 94%
  Verified listings: 4,250 / 4,521 total

Breakdown:
├─ Price verified: 99%
├─ Photos authentic: 91% (using image AI)
├─ Address geocoded: 97%
├─ Broker license verified: 88%
└─ Property ownership verified: 64% (legal check incomplete)

Improvement trend:
├─ Last 30 days: ↑ 2% improvement
├─ 90 days ago: 92%

Risk:
├─ Unverified listings cannot be boosted
├─ Unverified brokers limited to 5 listings
└─ If drops below 90%, trigger compliance alert

Note:
"Verification is our moat. Higher verification = higher trust = higher valuations."
```

**F. Investor-Ready Summary**
```
One-page snapshot (exportable as PDF for investors):

Viventa Platform Health — [Date]

Company:
├─ Monthly Recurring Revenue: $12,500 (↑ 8% YoY)
├─ Total Platform Users: 7,250 (↑ 12% YoY)
├─ Active Brokerages: 45
├─ Total Listings: 4,521
└─ Closed Deals (YTD): 387

Market Position:
├─ Estimated market share: 28% (by listings)
├─ Leading sectors: Santo Domingo, Santiago
├─ Competitive threat: Medium (1 regional competitor)
└─ Regulatory risk: Low (compliance 95%)

Financials:
├─ Player count: Growing (↑ 12% new agents this month)
├─ Revenue trend: Healthy (↑ 3% MoM growth)
├─ Churn: Stable (5% acceptable)
└─ Runway: Strong (cash positive)

Risk Assessment: LOW (24/100 risk index)
Status: READY for Series A / Growth

"Viventa is positioned to become the operational backbone of Dominican real estate."
```

---

### 🎮 CONTROL CENTER
**Current**: Real-time lead queue, routing policy selector  
**Upgrade**: Operations war room

#### Add Elements

**A. Live SLA Timer per Lead**
```
Currently: Leads shown with SLA status (breached/ok)

Upgrade:
├─ Each lead shows countdown timer
├─ Green: >4 hours left before breach
├─ Yellow: 1-4 hours left
├─ Red: <1 hour or already breached
├─ Blinking red: <30 minutes to breach

Timer display: "2h 15m" (and counting down in real-time)

Actions:
├─ Click lead to auto-focus on best agent to assign
├─ Emergency reassign (1-click to top 3 available agents)
└─ Escalate to broker if unable to assign
```

**B. Manual Override Logging**
```
When admin takes manual action (force assign, ignore routing rule):

Log entry auto-created:
├─ Admin name: "John Admin"
├─ Action: "Force reassign lead 12345 to Agent X"
├─ Reason: "Original agent unresponsive >2h, SLA at risk"
├─ Timestamp: "3:45pm today"
├─ Lead context: "Buyer seeking 3BR, $250k, Santo Domingo"
├─ Approval required? (If sensitive action)

This creates complete audit trail.
```

**C. Escalation Preview Simulation**
```
Scenario tool (test before applying policy):

Question: "If I set escalation threshold to 3h, what happens?"

Simulate:
├─ Shows how many leads would be escalated NOW
├─ Which agents would receive escalations
├─ Which brokers would be affected
├─ Estimated workload increase
└─ Revenue impact (more escalations = more commission handling)

Before: "Escalation at SLA breach (arbitrary)"
After: "I can see exactly what happens if I move to 3h threshold"

Actions:
├─ Test multiple thresholds
├─ See agent capacity impact
└─ Approve change with confidence
```

**D. Bulk Reassignment**
```
Currently: Reassign one lead at a time

Add:
├─ Multi-select leads (checkbox)
├─ Filter (all SLA breached leads, all from broker X, etc.)
├─ Action: "Reassign selected 23 leads"
├─ Choose target: "Round-robin to top 10 agents"
├─ Reason template: "SLA escalation - overflow assignment"
└─ Execute (logs all individual assignments)

Use case:
"Broker A's agent is offline. 23 leads need emergency reassignment.
Instead of 23 manual actions, one bulk reassignment. 2 seconds."
```

**E. Routing Test Mode**
```
Before deploying new routing rule:

Test Mode:
├─ Create new routing policy
├─ Apply to 20 random leads (in test mode only)
├─ See what assignments would happen
├─ Review agent load impact
├─ Check for edge cases (e.g., no agents in time zone)

Metrics:
├─ Would assignments improve SLA? (predict)
├─ Would workload be fair? (predict)
├─ Would any agents be overloaded? (predict)
└─ Cost impact? (predict)

Decision:
├─ "Looks good, deploy to all leads"
└─ "Issues found, adjust rules, test again"
```

---

### 📦 LISTINGS TAB (New Governance)
**Current**: List/search/detail view  
**Upgrade**: Quality & monetization control

#### Add Columns to Table

```
Additional fields:
├─ Quality Score: 92/100 (aggregate of photo, description, etc.)
├─ Verification: ✅ (blue check = verified)
├─ Boost Status: ACTIVE / EXPIRED / AVAILABLE
├─ Visibility Score: 87/100 (SEO visibility in search results)
├─ Days on Market: 34
├─ Views: 240 (this month)
├─ Inquiry Count: 12
├─ Flags: ⚠️ (shows if image issue, price anomaly, etc.)
└─ Assigned Broker: "Broker X" (click to view)
```

#### Add Sections

**A. Quality Score Methodology**
```
Interactive breakdown (click listing → see score components):

Photos: 95/100 ✅
  • 8 photos (need 5+)
  • All in focus
  • Professional lighting
  • Diverse angles
  • Recent (within 6 months)
  ✓ No AI-generated images detected

Description: 85/100
  • Word count: 220 (good, 150+ recommended)
  • Mentions key features ✓
  • Typos/grammar: 1 issue (minor)
  • Highlights: 4/5 strong (location, features, condition, price)
  • Missing: Builder/developer mention

Pricing: 92/100 ✅
  • Price aligned with market (within 10%)
  • Price/sqm reasonable
  • Trend: reasonable for area
  ⚠️ Note: 8% above sector average (could deter buyers)

Details: 88/100
  • Property type: Specified ✓
  • Bedrooms/bathrooms: Listed ✓
  • Square meters: Provided ✓
  • Property condition: Specified ✓
  • Amenities: Listed (4/10 common amenities)
  Missing: Year built, HOA fees (if applicable)

Recommendation:
"Add 3 more amenity descriptions and clarify price (brief explanation why at premium).
Score will improve to 96/100, increasing visibility by ~15%."
```

**B. Flagged Listing Queue (Moderation)**
```
Table of flagged listings (auto-identified + manual):

Issue | Listing | Broker | Severity | Action
-------|---------|--------|----------|--------
Missing images | Santo Domingo 3BR | Broker X | HIGH | Contact broker
Duplicate | 2 listings same address | Broker Y | MEDIUM | Merge listings
Price anomaly | Priced 40% above market | Broker Z | MEDIUM | Request verification
Profile incomplete | Agent photo missing | Agent Q | LOW | Require before re-list
No views (30d) | Historic property listing | Broker W | LOW | Suggest refresh

Actions:
├─ Auto-email broker (templated)
├─ Set deadline (14 days to fix)
├─ If not fixed: delist listing (pause visibility)
├─ Escalate to broker manager if critical

Auto-Fixes:
├─ AI can suggest title improvements
├─ AI can suggest description improvements
└─ Admin can apply batch fixes
```

**C. Image AI Quality Detection**
```
Automated Image Analysis (running on every upload):

Per image, detect:
├─ Blur score (is it in focus?)
├─ Lighting (professional or dark?)
├─ Composition (is room well-framed?)
├─ AI-generated risk (is it real or AI-generated?)
├─ Authenticity (does it match property description?)
└─ Duplicate (is this image reused from another listing?)

Results:
✅ Image passes: Professional photo, well-lit 3BR
⚠️ Image warning: Slightly blurry, but acceptable
❌ Image fail: Very dark, cannot see room clearly
🔴 High risk: Likely AI-generated interior

Actions:
├─ Flag photo for manual review if warnings/fails
├─ Prevent listing from being boosted if too many failures
├─ Recommend photo replacement
└─ Provide photography tips to broker
```

**D. Duplicate Detection**
```
Algorithm identifies likely duplicates:

Duplicate Pair Detected:
├─ Listing A: "Beautiful 3BR Home - Santo Domingo" (published 15 days ago)
├─ Listing B: "Beautiful 3BR Apartment - Santo Domingo" (published 2 days ago)
├─ Similarity: 94% (same photos, same description, same price)
├─ Owner: Same broker (Broker X)

Recommendation:
├─ Merge into one listing (keep newer, preserve activity from both)
├─ Archive one copy
├─ Preserve buyer inquiry history from both

Actions:
├─ Merge (auto-consolidate activity)
├─ Archive one (keep other)
├─ Contact broker (let them know)
└─ Track duplicate rate (should be <1%)

Why this matters:
"Duplicates confuse search rankings and split lead attention.
Consolidation improves visibility for both listings."
```

**E. Boost/Promotion Management**
```
Listing boost status visible:

Listing name | Status | Expires | Cost/mo | Visibility Lift | Actions
---|---|---|---|---|---
Home 1 | ACTIVE | 15 days | $50 | +250% views | Renew / Pause
Home 2 | EXPIRED | — | $50 | N/A | Activate / Archive
Home 3 | AVAILABLE | — | $50 | N/A | Boost / Pass

Boost Package Options:
├─ Bronze: $30/mo (+150% visibility, 3 photos highlighted)
├─ Silver: $50/mo (+250% visibility, featured in sector view)
├─ Gold: $100/mo (+400% visibility, #1 position in search results)
└─ Premium: $150/mo (Gold + weekly schedule +  buyer notifications)

Metrics:
├─ Boost active for: 1,250 listings
├─ Monthly boost revenue: $3,500 (growing)
├─ Avg ROI per boost: 8.5x (views → inquiries)

Recommendation:
"Listings with boost get 3x more inquiries. Upsell brokers on boost for premium properties."
```

**F. Visibility & SEO Score**
```
Per-listing metric (transparent to brokers):

Visibility Score: 87/100

Components:
├─ Quality score impact: 92/100 (photos, description)
├─ Recency boost: 95/100 (very recent listing)
├─ Active boost: 99/100 (currently boosted)
├─ Keyword optimization: 72/100 (missing some key terms)
├─ Geographic match: 98/100 (popular search area)
└─ Demand signals: 85/100 (moderate interest in property type)

Prediction:
"This listing appears in search results for ~87 relevant queries.
Estimated views: 250/month. (benchmark: 200)"

Actionable Recommendations:
1. Add these keywords to description: "beachfront," "investment opportunity," "HOA included"
2. Update photos (currently 2 years old) → will boost to 95/100
3. Consider Silver boost → will improve visibility to 95/100
4. Estimated impact: +180 views/month (+100 inquiries/month)

Broker sees:
"Your listing is well-positioned. Small improvements could +40% visibility."
```

---

### 👥 BUYERS TAB (New CRM)
**Currently**: Minimal buyer visibility  
**Upgrade**: Full Buyer CRM

#### Core Sections

**A. Buyer Profile**
```
Per buyer, show:

Name: Juan Pérez
Email: juan@email.com
Phone: +1-809-XXX-XXXX
Location: Santo Domingo
Budget: $150,000 - $250,000 ✅
Preferred areas: Santo Domingo, Santiago, Puerto Plata
Property types: 2-3BR residential, modern
Status: ACTIVE BUYER (logged in 3 days ago)

Engagement Score: 78/100 (HIGHLY ENGAGED ✅)
├─ Visits: 245 (this month)
├─ Favorited properties: 18
├─ Viewed properties: 145
├─ Inquiries sent: 4
├─ Last activity: 3 days ago view property #12345
└─ Predicted buyer quality: HIGH

Assigned Agent: Maria (Agent ID: 5678)
├─ Initial contact: 15 days ago
├─ Last follow-up: 5 days ago (✅ on schedule)
├─ Showings scheduled: 2

Lifecycle Stage:
├─ Awareness → Active searching (current)
├─ Next: Needs viewing scheduled
├─ Stage progression: 60% to Ready to make offer

Actions:
├─ View last 10 properties viewed
├─ See inquiry history
├─ Check follow-up schedule
├─ Trigger bulk email (market update, price drops in area)
└─ Escalate if agent unresponsive
```

**B. Saved Properties**
```
Display:
├─ Property address
├─ Price
├─ Saved date
├─ Notes (buyer's comments: "love the kitchen", etc.)
├─ Status (active / sold / delisted)
└─ Actions: View, Compare, Unsave

Insights:
├─ Favorite areas (clustering: 80% of saves in Santo Domingo)
├─ Favorite price range (most saves $180k-$220k)
├─ Favorite property type (60% 3BR, 35% 2BR)
└─ Days since last save (if >30d, buyer may have lost interest)

Recommendations:
"Similar properties added: Show buyer 3 new listings matching saved criteria"
```

**C. Engagement Analytics**
```
Per buyer:
├─ Total property views: 145
├─ Unique properties viewed: 87
├─ Re-views: 58 (viewing same property 2+ times = interest signal)
├─ Average time per property: 4 min 23s
├─ Properties saved: 18
├─ Inquiries: 4
├─ Showings scheduled: 2
├─ Showings completed: 0
├─ Follow-ups from agent: 3

Engagement Score Breakdown:
├─ High view frequency (245 this month) = VERY ACTIVE
├─ Re-viewing properties (signal of serious interest)
├─ Saving properties (intent signal)
├─ Inquiries sent (initial contact)
├─ Showings scheduled (moving toward close)
├─ Showings completed (deal progression)

Risk Assessment:
├─ Buyer went 8 days without viewing = might be losing interest
├─ Buyer viewed 34 properties but saved only 18 = still exploring
├─ Last showing was 12 days ago = needs nudge

Recommendation:
"Send market update: '3 new listings matching your criteria (2-3BR, $180-220k)'"
```

**D. Inquiry History & Follow-up**
```
Per buyer, show inquiry timeline:

Date | Property | Status | Inquiry | Response Time | Follow-ups
---|---|---|---|---|---
3/2 | Home #12345 | Viewing Scheduled | "When can I see this?" | 2hours | 0
2/28 | Home #11234 | No Response | "Is this still available?" | None | 0 (RED)
2/25 | Home #10456 | Closed | "What's the condition?" | 30min ✓ | 2

Performance:
├─ Agent response time: 2-30 min (good, <1h target)
├─ Agent follow-up rate: 50% (2 out of 4 inquiries escalated to next step)
├─ Conversion (inquiry → showing): 1 out of 4 (25%)

Red Flags:
├─ 1 inquiry without response (2/28) - over 3 days old❌
├─ This is a conversion problem - agent not following up

Actions:
├─ Escalate to broker: "Agent not responding to inquiries"
├─ Auto-email agent: "Follow-up needed on inquiry 2/28"
└─ Reassign inquiry if not claimed within 4 hours
```

**E. Buyer Lifecycle Stage**
```
Visual funnel showing where buyer is:

Stage 1: Awareness (just signed up)
├─ Buyers in stage: 850
├─ Converting to next stage: 65%
└─ Avg time in stage: 3 days

Stage 2: Active Searching (viewing properties regularly)
├─ Buyers in stage: 950 --- [JUAN IS HERE]
├─ Converting to next stage: 40% → Ready to view
└─ Avg time in stage: 15 days

Stage 3: Ready to View (scheduled showing or requested viewing)
├─ Buyers in stage: 380
├─ Converting to next stage: 60% → Viewing
└─ Avg time in stage: 5 days

Stage 4: Viewing (completed property showings)
├─ Buyers in stage: 180
├─ Converting to next stage: 35% → Making offer
└─ Avg time in stage: 8 days

Stage 5: Making Offer (submitted offer on property)
├─ Buyers in stage: 45
├─ Converting to next stage: 65% → Deal pending
└─ Avg time in stage: 3 days

Stage 6: Deal Pending (offer accepted, closing in progress)
├─ Buyers in stage: 15
├─ Conversion to close: 65%
└─ Avg time in stage: 30 days

Stage 7: Closed (deal completed)
├─ Buyers in stage: 95 (lifetime)

Insight for Juan:
"Juan is in 'Active Searching' (stage 2). 40% of buyers in this stage move to 'Ready to View' within 7 days.
He's on pace to schedule a showing in ~5 days."

What gets him to the next stage?
├─ A property that matches budget + area + type
├─ Agent reaching out with recommendations
├─ Price alert for property in saved area
└─ He schedules a showing
```

**F. Assigned Agent & Relationship**
```
Display relationship history:

Assigned to: Maria (Agent ID: 5678)
Since: 2/17 (16 days)
Communication:
├─ Email: 3 (welcome, market update, showing reminder)
├─ Phone: 1 (initial greeting)
├─ In-app message: 0

Touchpoints:
├─ 2/17: Maria sends welcome message
├─ 2/19: Juan views 12 properties
├─ 2/22: Maria sends market update (3 new listings)
├─ 2/24: Juan saves 2 properties, requests showing
├─ 2/25: Maria schedules showing at Home #12345
├─ 2/26: Juan completes showing (notes: "like kitchen, but master too small")
├─ 3/1: Maria sends follow-up with 3 similar properties
├─ 3/2: Juan is viewing those 3 properties

Health:
✅ Communication regular (1-2 touches per week)
✅ Agent following up (within 24-48 hours of Juan's activity)
✅ Relationship progressing (Juan is moving toward making offer)

Risk:
❌ If no showing in next 7 days, Juan may lose interest (escalate)
```

---

### 📈 USERS (PEOPLE) TAB
**Current**: Basic agent/broker listing  
**Upgrade**: Performance & compliance management

#### Add Metrics per User

```
Agent Name | Role | Brokerage | Listings | Leads | Closed | Days | Activity | Risk | Compliance | LTV | Actions
---|---|---|---|---|---|---|---|---|---|---|---
Maria Garcia | Agent | Broker X | 12 | 34 | 5 | 4d | ✅ Active | LOW | ✅ | $15k | View
Juan Lopez | Agent | Broker Y | 5 | 8 | 0 | 12d | ❌ Idle | MEDIUM | ✅ | $2k | Alert
Sofia Chen | Agent | Broker Z | 28 | 156 | 15 | 1h | ✅ Active | LOW | ⚠️ | $48k | Force check
```

#### New Columns Explained

**A. Activity Heatmap**
```
Visual grid showing 30-day activity:

Color intensity = activity level
├─ Dark green: High activity day (5+ actions: login, listing, inquiry response)
├─ Light green: Moderate activity (1-4 actions)
├─ Gray: Low/no activity

Pattern analysis:
├─ If all dark green: Very engaged ✅
├─ If all gray: Inactive (at risk of churn)
├─ If pattern: Active on weekdays, inactive weekends (normal)
├─ If pattern: Active first week of month, then drops (seasonal?)

Use case:
"Maria is consistently active M-F, takes weekends off. Normal healthy pattern.
Juan shows activity only on day 1, then nothing for 11 days. Needs attention."

Actions:
├─ If risky pattern: Trigger re-engagement email
├─ If inactive >14 days: Trigger escalation
└─ If completely inactive >30 days: Flag for suspension
```

**B. Account Risk Score**
```
Per agent:
├─ Compliance risk: License expired? (CRITICAL if yes)
├─ Performance risk: No activity >14 days?
├─ Financial risk: Payment failures?
├─ Reputational risk: Many disputes/complaints?
├─ Data risk: Profile incomplete?
└─ Behavioral risk: Suspicious activity? (unusual login locations, bulk data export, etc.)

Result: RISK SCORE 0-100
├─ 0-20: LOW RISK ✅
├─ 20-50: MEDIUM RISK ⚠️ (monitor)
├─ 50-100: HIGH RISK 🔴 (intervention needed)

Example breakdown:
Maria: 15/100 (LOW) = All green
├─ License valid ✅
├─ Consistent activity ✅
├─ No payment issues ✅
├─ No complaints ✅
└─ Profile complete ✅

Juan: 65/100 (HIGH) = Multiple issues
├─ No activity 12 days ❌
├─ License expires in 10 days ⚠️
├─ Profile missing photo ❌
├─ Payment method outdated ⚠️
└─ 1 complaint (unresponsive) ❌

Actions:
├─ Maria: Monitor, but low priority
└─ Juan: ALERT broker, require license renewal, force compliance check
```

**C. Revenue per Agent**
```
Display (YTD or selected period):
├─ Commission earned (Viventa's cut): $4,500
├─ Deals attributed to this agent: 8
├─ Total deal value: $2.1M
├─ Avg deal size: $262,500
├─ Conversion rate (leads → closed): 3.2%
└─ Estimated LTV (lifetime value to platform): $15,000

Ranking:
├─ Maria: #2 (by commission earned)
├─ Juan: #87 (bottom quartile)
└─ Sofia: #1 (top performer)

Insight:
"Top 10 agents generate 45% of platform revenue.
Bottom 50% generate only 8% of revenue.

Consider: incentives for bottom performers, or consider off-boarding
if risk score + revenue are both low."

Actions:
├─ View commission details (per deal)
├─ Adjust commission rate (incentivize)
├─ View coaching message (if underperforming)
└─ Schedule performance review
```

**D. Suspension History**
```
Display (if any):
├─ Date suspended: 1/15/2026
├─ Reason: Payment failure (3 consecutive months overdue)
├─ Duration: 14 days
├─ Re-activated: 1/29/2026
├─ Reason for reactivation: Payment resolved + manual override by broker
└─ Frequency: 2 suspensions in 12 months (concerning)

Alerts:
├─ If suspended >2x in 12 months: Risk of churning
├─ If suspended >7 days: Likely lost deals during suspension
└─ If pattern: Systematic problem (payment, compliance, or performance)

Actions:
├─ Automatic alerts after 1st suspension
├─ Mandatory compliance check after 2nd suspension
└─ Risk of termination after 3rd suspension
```

**E. Brokerage Tree View**
```
Hierarchical display:

Brokerage: Broker X
├─ Manager: Carlos (Suspended: no)
├─ Agents: 15 (Active: 12, Inactive: 3)
│
├─ Broker X Team A
│  ├─ Team Lead: Maria
│  ├─ Agent: Juan
│  ├─ Agent: Sofia
│  └─ Metrics: 28 listings, 12 closed deals, $8.5k earned
│
├─ Broker X Team B
│  ├─ Team Lead: Diego
│  ├─ Agent: Laura
│  └─ Metrics: 18 listings, 6 closed deals, $3.2k earned
│
└─ Standalone Agents
   ├─ Agent: Miguel
   └─ Agent: Ana

Actions:
├─ Click agent → drill into performance
├─ Click team → see team performance
├─ Click brokerage → manage all suspensions, seats, billing
└─ Drag to reassign agents to teams (org redesign)

Purpose:
"See full org structure. Identify where top performers are, where
bottlenecks are, where to invest in coaching or replacement."
```

**F. Role Change Audit**
```
If admin changes a user's role (agent → broker, or broker → admin):

Audit log shows:
├─ Admin who made change: (name)
├─ User affected: (name)
├─ Old role: Agent
├─ New role: Broker
├─ Timestamp: 2/28/2026 3:45pm
├─ Reason provided: "Promoted due to performance"
├─ Permissions changed:
│  ├─ Can now: Create brokerage, manage agents, view billing
│  └─ Can no longer: Submit listings directly (via brokerage instead)
└─ Approval required? (if security-critical)

Tracking:
├─ Complete audit trail of all permission changes
├─ Alert if sensitive role change (user→admin)
└─ Require 2nd approval if role change made outside US business hours
```

**G. Seat Usage**
```
For brokerages with seat limits:

Brokerage: Broker X
├─ Plan: Professional (10 seats)
├─ Seats used: 8
├─ Seats available: 2
├─ Seat utilization: 80%

Usage breakdown:
├─ 8 active agents (using seats)
├─ 3 inactive agents (paused, not using seats)
├─ 1 agent on leave (not using seat)

Alert:
⚠️ "You're at 80% capacity. Need 2 more agents?
Upgrade to Enterprise (20 seats) for $79/mo, or manage current team."

Actions:
├─ Remove inactive agents (free up seats)
├─ Invite new agents (use available seats)
├─ Upgrade plan (add more seats)
└─ Pause temporary agents (when on leave)
```

**H. "Force Compliance Check" Button**
```
Admin action (per user):

Click button:
├─ Immediate check triggered:
│  ├─ License valid?
│  ├─ Identity verified?
│  ├─ Profile complete?
│  ├─ Payment method valid?
│  ├─ No suspicious activity?
│  └─ No pending escalations?
├─ Results: 6/6 passed ✅ (or X failed ❌)
├─ If failed: Block user, notify, show remediation steps
└─ If passed: Green check, continue

Use case:
"Diego hasn't logged in 20 days. Before we re-activate him,
let's force a compliance check to make sure he's still legitimate."

Audit:
├─ Check logged as admin action
├─ Reason recorded
└─ Timestamp captured
```

---

## 🧲 BUYER LOGIN STRATEGY (Growth Engine)

### The Problem
Right now: Hard wall immediately (must login to see any property)
Result: High bounce rate, low conversion

### The Solution
Soft progression model (progressive disclosure):

```
Stage 1: Anonymous Visitor (No login required)
├─ Can: View property list
├─ Can: View 3 photos (blurred overlay)
├─ Can: See property details (address, bedrooms, price)
├─ Cannot: View full photo gallery
├─ Cannot: See agent details, contact info
├─ Cannot: Send inquiry to agent
├─ Cannot: Save properties
├─ Cannot: Compare properties

CTA: "Create free account to unlock full gallery & contact agent"

Stage 2: Email Registered (Just created account)
├─ Can: View full photo gallery (all photos clear)
├─ Can: See agent name, company
├─ Can: Send inquiry (triggers agent contact)
├─ Can: Save properties (my favorites)
├─ Can: Compare 2-3 properties side-by-side
├─ Cannot: View buyer recommendations
├─ Cannot: Set price alerts
├─ Cannot: See agent's phone number directly

CTA: "Verify email to unlock recommendations & price alerts"

Stage 3: Email Verified (Verified email)
├─ Can: Get price alerts (new listings in area)
├─ Can: See property recommendations (algorithm-based)
├─ Can: View area insights (avg price, days on market)
├─ Can: Set saved areas (track new listings)
├─ Can: Schedule showings (book agent time)
├─ Cannot: See agent phone directly (contact via platform)

CTA: "Add phone number to get instant agent calls"

Stage 4: Phone Verified (Verified phone)
├─ Can: Show agent phone number (they can call directly)
├─ Can: Get SMS alerts (price drops, new listings)
├─ Can: See agent profile (full contact)
├─ Can: Direct message with agent
├─ Can: Schedule multiple showings
├─ Can: Build custom saved searches

CTA: None needed - fully engaged buyer

Next: Make an offer → Close deal
```

### Why This Works

**Habit Formation**
- Each micro-action builds commitment
- Buyer invests time: viewing → saving → comparing
- By email verification, they're already invested

**Conversion Funnel**
1. 10,000 anonymous visitors/month
2. 3,000 create account (30% conversion)
3. 2,100 verify email (70% conversion)
4. 1,470 add phone (70% conversion)
5. 500 schedule showings (34% conversion)
6. 150 make offers (30% conversion)
7. 50 closed deals (33% conversion)

Result: 10,000 visitors → 50 closed deals = 0.5% conversion (industry benchmark)

**Revenue Impact**
- 50 closed deals = $1.5M - $3M in transaction value
- At 2-3% commission: $30k - $90k per 10k visitors
- At buyer signup cost $10: ROI = 3000-9000x

### Implementation

**Buyer Dashboard (After Login)**

```
Homepage shows:
├─ Saved homes (with new properties highlighted)
├─ Recently viewed properties
├─ Price alerts (in your saved areas)
├─ Recommended properties (algorithm: matches your criteria)
├─ Area insights (best neighborhoods for your budget)
├─ Inquiry tracking (status of properties you inquired about)
├─ Agent details (who's helping you, contact options)
└─ Viewing calendar (scheduled showings)

Each section has CTA:
"You've saved 8 homes. Want to compare them side-by-side?"
"Similar homes added in your area - see the best 3"
"New listing in Santiago (your saved area) - view now"

Engagement loop:
Day 1 → Views 20 properties, saves 3
Day 3 → Gets price alert (new listing in area) → clicks
Day 5 → Receives agent follow-up + recommendations
Day 7 → Schedules showing
Day 14 → Completes showing, requests follow-up
Day 21 → Makes offer
Day 45 → Closes deal
```

---

## 🏗️ MISSING CORE SYSTEMS

These are foundational infrastructure features, not immediately visible in admin but needed for scale:

### 1. Commission Tracking System
```
Requirement: For every deal, calculate who gets what

Fields needed:
├─ Total sale price
├─ Buyer broker % commission
├─ Seller broker % commission
├─ Agent % within brokerage
├─ Viventa platform % (if applicable)
├─ Developer commission (if project)
└─ Payment status (paid / pending / disputed)

Workflow:
1. Deal closed (generated by system)
2. Auto-calculate splits
3. Generate invoices
4. Track payment
5. Dispute resolution (if any)

Admin view:
├─ Commission ledger (all time)
├─ Outstanding commissions (waiting payment)
├─ Commission reports (by broker, by agent, by period)
└─ Commission payout status

Developer API:
└─ Brokers can query commission status via API
```

### 2. Agent Performance Leaderboard
```
Real-time rankings (by period):

This Month:
1. Maria Garcia (Broker X): 8 closed deals, $2.1M GCV, $52k commission
2. Sofia Chen (Broker Z): 7 closed deals, $1.8M GCV, $44k commission
3. Diego Lopez (Broker X): 5 closed deals, $1.2M GCV, $32k commission
...
50. Juan Gutierrez (Broker Y): 1 closed deal, $150k GCV, $2.5k commission

Rankings by metric:
├─ Deals closed (this month)
├─ Commission earned (this month)
├─ Sales volume (GCV)
├─ Avg deal size
├─ Conversion rate (leads → deals)
├─ Days to close (average)
└─ Customer satisfaction (ratings)

Badge system:
├─ 🥇 Top performer (rank <10)
├─ 🔥 Momentum (20% growth vs last month)
├─ 📈 Rising star (<1 year, >50 deals)
└─ ⭐ Elite (>$50M career GCV)
```

### 3. Brokerage Performance Leaderboard
```
By brokerage (not individual agents):

Ranking | Brokerage | Agents | Deals | Volume (M) | Commission | Growth | Market Share
---|---|---|---|---|---|---|---
1 | Broker X | 12 | 45 | $12.3 | $328k | +8% | 28%
2 | Broker Z | 8 | 28 | $7.1 | $195k | +12% | 17%
3 | Broker Y | 15 | 22 | $5.8 | $167k | -3% | 14%
...

Metrics:
├─ Market dominance by region
├─ Growth rate trending
├─ Average deal size (efficiency)
├─ Revenue contribution to Viventa
└─ Health score (active agents, low churn, high performance)
```

### 4. Developer Project Dashboard
```
For constructoras publishing projects:

Project overview:
├─ Project name
├─ Developer company
├─ Location (map)
├─ Units total
├─ Units listed
├─ Units sold
├─ Sales to date ($)
├─ Days running

Metrics:
├─ Listing velocity (units/week)
├─ Sales velocity (units/week)
├─ Avg time to sell
├─ Price per unit trend
├─ Lead generation rate
└─ Conversion rate

Performance:
├─ Lead source (organic vs paid)
├─ Lead quality (inquiries that convert)
├─ Top agent selling the project
└─ Commission earned (per dev)

Actions:
├─ Update project status
├─ Adjust pricing
├─ Boost certain units
├─ View builder portal
└─ View commission payouts
```

### 5. Listing Promotion Packages
```
Product offering to brokers:

Bronze Package: $30/mo per listing
├─ List in "featured" section for 30 days
├─ 3 photos highlighted in search
├─ +150% visibility boost
└─ Est. +8-10 inquiries/month

Silver Package: $50/mo per listing
├─ Featured in sector view
├─ #1-5 position in search results
├─ 150% + weekly rotation
├─ Email campaign to nearby buyers
├─ +250% visibility
└─ Est. +12-15 inquiries/month

Gold Package: $100/mo per listing
├─ #1 position in search results
├─ Virtual tour feature
├─ Buyer notification (new in area)
├─ Agent featured profile
├─ +400% visibility
└─ Est. +25-30 inquiries/month

Broker views:
├─ Package options
├─ Package performance (ROI per listing)
├─ Boost management (which listings? which periods?)
└─ Payout schedule for promoted listings
```

### 6. Featured Placement Engine
```
Algorithm determines which listings get "featured" status:

Factors:
├─ Quality score (90+ required)
├─ Verification status (verified preferred)
├─ Recent activity (recently updated > older)
├─ Broker reputation (top brokers get priority)
├─ Package tier (Gold > Silver > Bronze > free)
├─ Geographic fill (don't repeat same sector)
└─ Demand signals (searches + views + saves)

Result:
├─ "Trending now" (high-interest listings)
├─ "Best for your budget" (personalized)
├─ "Top deals in Santo Domingo" (curated by sector)
└─ "New listings" (timely)

Business model:
├─ Brokers can buy featured placement ($30-$100/mo)
├─ Viventa recommends best listings for feature (algorithmic)
└─ Revenue = brokers who buy package + placement fees
```

### 7. Referral Tracking System
```
Enable "refer a friend" for buyers & agents:

Buyer referral:
├─ Buyer A refers Buyer B
├─ Buyer B signs up with referral code
├─ Buyer B completes first inquiry
├─ Referrer A gets: $10 credit or 1 month free (if premium)
└─ Viventa gets: Buyer B (CAC = $10 instead of $50)

Agent referral:
├─ Agent A refers Agent B
├─ Agent B joins brokerage
├─ Agent B reaches 10 closed deals
├─ Referrer gets: $500 bonus or commission cut increase
└─ Viventa gets: Agent B (cost of recruiting reduced)

Tracking:
├─ Referral code per user
├─ Referral status (pending / completed / paid)
├─ Total referrals per user
├─ Referral leaderboard (top referrers)
└─ Referral revenue (tracked per channel)

Why it matters:
"Referrals are cheapest user acquisition. A well-designed referral
program can grow user base 30-50% at near-zero CAC."
```

### 8. Internal Task Management
```
Administrative workflows:

Task types:
├─ Compliance check (license renewal, profile update)
├─ Data cleanup (duplicate detection, image replacement)
├─ Agent coaching (performance issue, escalation)
├─ Broker onboarding (new brokerage setup)
├─ Payment collection (follow up on failed payment)
├─ Dispute resolution (buyer complaint, refund request)
└─ Marketing campaigns (email, push notifications)

Task workflow:
├─ Create task (auto or manual)
├─ Assign to: Admin, Broker, Coordinator
├─ Set deadline (escalate if missed)
├─ Track status (pending / in progress / completed)
├─ Document outcome
└─ Archive for history

Dashboard:
├─ My tasks (assigned to me)
├─ Team tasks (assigned to team)
├─ Overdue tasks (red flag)
├─ Completed this week (for accountability)
└─ Task history (audit trail)

Integration:
├─ Email notifications
├─ Mobile alerts
├─ Calendar sync
└─ Escalation rules (if overdue, notify manager)
```

### 9. Notification Center (In-App)
```
Central place for all system notifications:

Inbox notifications:
├─ "New lead assigned to you" (for agents)
├─ "Payment processed: $2,500" (for brokers)
├─ "SLA breach risk on lead #12345" (for admins)
├─ "Your listing is #1 this week!" (for brokers)
├─ "Price alert: New listing in your area" (for buyers)
└─ "Showing scheduled at 2pm today" (for all)

Personal settings:
├─ Which notifications I want
├─ Delivery mode (in-app / email / SMS)
├─ Quiet hours (don't alert 9pm-9am)
└─ Notification frequency (realtime vs daily digest)

Admin view:
├─ System notifications (outage, maintenance)
├─ Alerts (performance, risk, compliance)
└─ Announcements (policy changes, new features)

Analytics:
├─ Which notifications get opened?
├─ Which drive action?
├─ Which are ignored?
└─ Optimize notification strategy
```

### 10. Legal Document Repository
```
Central location for all legal/compliance documents:

Document types:
├─ User terms & conditions (buyer, agent, broker versions)
├─ Privacy policy
├─ Commission agreement (agent-broker)
├─ GDPR/data protection addendum
├─ Dispute resolution policy
├─ Broker agreement (Viventa-broker)
├─ Developer policies
└─ Tax documentation (for reporting)

Versioning:
├─ Date effective
├─ Previous versions (archive)
├─ Change log (what changed)
└─ Acceptance tracking (who accepted when)

User acceptance:
├─ New users accept before account creation
├─ Existing users: prompt if terms update
├─ Acceptance logged with timestamp + IP
└─ Required for account re-activation if expired

Compliance:
├─ GDPR: Users can request data export
├─ Right to be forgotten: Process if requested
├─ Data retention: Archive per legal requirement
└─ Audit: Show proof of acceptance to regulators
```

---

## 🧠 PRIORITY & EXECUTION ORDER

**Not all at once.** Build in phases:

### Phase 1: Leads Integrity (P0) — 2-3 weeks
**Why**: Leads are your core asset. Fix operational fundamentals first.

Tasks:
1. Leads page: Add duration visibility to automation runs ✅ (DONE)
2. Control center: Upgrade with SLA timer, bulk reassign, routing test mode
3. Add "Leads by broker" leaderboard to Master Dashboard
4. Upgrade leads deduplication detection (auto-flag duplicates)

Output: Brokers can trust lead quality. You can see what's happening in lead system in real-time.

### Phase 2: Buyer CRM Upgrade (P0.5) — 2-3 weeks

Tasks:
1. Create Buyer tab (profile, inquiry history, engagement score)
2. Implement soft login strategy (blurred photos → account → verified)
3. Buyer dashboard (saved homes, recommendations, price alerts)
4. Add buyer lifecycle stage tracking

Output: Buyers are engaged, retained, converted. You understand buyer behavior.

### Phase 3: Revenue & Billing Skeleton (P1) — 1-2 weeks

Tasks:
1. Create Revenue & Billing tab (even if billing not live yet)
2. Add subscription plan management UI
3. Add seats usage per brokerage
4. Add commission tracking (basic)

Output: Infrastructure ready for monetization. Can manage subscriptions when live.

### Phase 4: Data Quality Dashboard (P1.5) — 1-2 weeks

Tasks:
1. Create Data Quality tab
2. Add quality score per listing
3. Add duplicate detection + auto-flagging
4. Add data completeness alerts (missing photos, geocode, etc.)

Output: Prevent entropy. Maintain data trust. Institutional readiness.

### Phase 5: Growth Engine (P2) — 1-2 weeks

Tasks:
1. Create Growth Engine tab
2. Add signup velocity tracking
3. Add conversion funnel (page view → closed deal)
4. Add source attribution (where do users come from?)

Output: Know if company is growing or dying. Optimize CAC.

### Phase 6: Marketplace Intelligence (P2.5) — 1-2 weeks

Tasks:
1. Create Marketplace Intelligence tab
2. Add listings-by-sector heatmap
3. Add broker dominance map
4. Add price analytics

Output: Strategic market understanding. Identify opportunities. Defense against competitors.

### Phase 7: Admin Polish & Drilldowns (P3) — 1-2 weeks

Tasks:
1. Master dashboard upgrade (date range, trends, lead velocity)
2. Executive overview upgrade (risk index, revenue snapshot, market map)
3. Control center upgrade (SLA timer, override logging)
4. Full Audit log upgrade (CSV export, advanced filtering)

Output: Executive-ready admin. Investor-ready metrics.

### Phase 8: Buyer Engagement Dashboard (P3.5) — 1 week

Tasks:
1. Track buyer funnels by broker
2. Add coaching recommendations
3. Add buyer satisfaction polling
4. Add re-engagement campaigns

Output: Brokers know how to improve. Buyers stay engaged.

### Phase 9: Agent & Broker Portals (P4+)

After admin is perfect, build:
1. Agent portal (see my leads, my performance, my commissions)
2. Broker portal (see team performance, team commissions, manage team)
3. Developer portal (project sales tracking, marketing support)

---

## 🎯 SUCCESS METRICS

**You'll know you've succeeded when**:

### 6-Month Targets

- **User Growth**: 7,250 → 15,000 total platform users (2x)
- **Listings**: 4,521 → 8,000+ active listings
- **Deals/Month**: 15 → 40+ closed deals
- **MRR**: $12,500 → $30,000+ (2.4x)
- **Market Share**: 28% → 40%+ (by listings)
- **Data Quality**: 94% → 98%+
- **Buyer Conversion**: 0.06% → 0.3%+ (page view → closed deal)

### 12-Month Vision

- **Users**: 30,000 (4x from now)
- **Brokerages**: 120+ (2.7x from 45)
- **Developers**: 25+ (major projects launching)
- **Annual Revenue**: $500k+ ($40k MRR)
- **Market Dominance**: 60%+ market share in metropolitan areas
- **Institutional Readiness**: Series A -ready platform

### The Goal

In 12 months:
- No brokerage in DR operates without Viventa
- Brokers cannot imagine running business without you
- Your data is most complete property dataset in DR
- You're the trusted MLS standardfor Dominican real estate

---

## 🚀 Next Steps

**When user says "BUILD", execute in this order**:

1. Create `/app/(dashboard)/master/buyers/page.tsx` (NEW)
2. Upgrade `/app/(dashboard)/master/control/ControlCenterClient.tsx` (SLA timer, bulk reassign)
3. Upgrade `/app/(dashboard)/master/leads/page.tsx` (add leaderboard, deduplication)
4. Create `/app/(dashboard)/master/revenue/page.tsx` (NEW skeleton)
5. Create `/app/(dashboard)/master/data-quality/page.tsx` (NEW)
6. Continue through Priority & Execution Order

---

**This document is your blueprint.**  
Not UI refinement.  
**Platform architecture.**

Build this. Dominate DR.
