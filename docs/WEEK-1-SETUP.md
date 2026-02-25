# Week 1: Admin Portal Setup Guide

## Overview

Week 1 delivers a fully functional **Admin Role Management System** that allows Master Admin to:
- Create Brokers
- Create Agents (assign to Brokers)
- Create Constructoras (Developers)
- Create Buyers (with search criteria)
- Enable/disable users
- Edit user profiles
- Delete users

This enables a **controlled ecosystem** where all lead flow and user management is centralized through the Master Admin dashboard.

---

## Access the Admin Portal

**URL:** `https://[your-domain]/master/users`

**Requirements:**
- Must be logged in as Master Admin (requires special admin role)
- Firebase authentication must be configured

---

## Create Demo Data: Paraiso Inmobiliario Beta

### Step 1: Create Broker Account

Navigate to `/master/users` and click the **"Broker"** button.

Fill in:
- **Full Name:** Paraiso Inmobiliario
- **Email:** admin@paraisoinmobiliario.com
- **Company:** Paraiso Inmobiliario
- **Phone:** +1-555-0100

Click "Create Broker" → Success message confirms creation

### Step 2: Create 3 Test Agents Under Paraiso

Click the **"Agent"** button for each agent.

**Agent 1:**
- **Full Name:** María López
- **Email:** maria@paraisoinmobiliario.com
- **Phone:** +1-555-0101
- **Broker:** Paraiso Inmobiliario (select from dropdown)

**Agent 2:**
- **Full Name:** Carlos Rodríguez
- **Email:** carlos@paraisoinmobiliario.com
- **Phone:** +1-555-0102
- **Broker:** Paraiso Inmobiliario

**Agent 3:**
- **Full Name:** Ana García
- **Email:** ana@paraisoinmobiliario.com
- **Phone:** +1-555-0103
- **Broker:** Paraiso Inmobiliario

Click "Create Agent" for each → 3 agents now assigned to Paraiso

### Step 3: Create Test Buyer Accounts (with Criteria)

Click the **"Buyer"** button for each test buyer.

**Buyer 1 - Residential:**
- **Full Name:** Pedro Pérez
- **Email:** pedro@example.com
- **Phone:** +1-555-0201
- **Location:** Santo Domingo
- **Budget Min:** 150,000
- **Budget Max:** 300,000
- **Bedrooms:** 2
- **Purpose:** Residential

**Buyer 2 - Investment:**
- **Full Name:** Jennifer Martinez
- **Email:** jennifer@example.com
- **Phone:** +1-555-0202
- **Location:** Punta Cana
- **Budget Min:** 200,000
- **Budget Max:** 500,000
- **Bedrooms:** 3
- **Purpose:** Investment

**Buyer 3 - Airbnb:**
- **Full Name:** James Wilson
- **Email:** james@example.com
- **Phone:** +1-555-0203
- **Location:** Sosúa
- **Budget Min:** 100,000
- **Budget Max:** 250,000
- **Bedrooms:** 2
- **Purpose:** Airbnb

---

## View & Manage Users

### Admin Dashboard

Navigate to `/master/users` to see:

**Stats Bar:**
- Total Users count
- Agents (blue card - clickable to filter)
- Brokers (purple card - clickable to filter)
- Buyers (green card - clickable to filter)
- Active users count
- Inactive users count

**Filters:**
- Search by name, email, phone, or agent code
- Filter by role (All / Agents / Brokers / Buyers)
- Filter by status (All / Active / Inactive)

**User Actions:**
- **Edit** - Update name, email, phone, company/broker
- **Enable/Disable** - Toggle user active status
- **Delete** - Permanently remove user

---

## Database Structure

Users are stored in Firestore at `collection(db, 'users')` with structure:

```javascript
{
  id: string,                    // Document ID
  name: string,                  // Full name
  email: string,                 // Unique email (lowercase)
  phone: string,                 // Optional phone number
  role: 'broker'|'agent'|'buyer'|'constructora'|'master_admin',
  company: string,               // For brokers/constructoras
  brokerage: string,             // For agents (links to broker ID)
  criteria: {                    // For buyers
    location?: string,
    budgetMin?: number,
    budgetMax?: number,
    bedrooms?: number,
    purpose?: string,
    amenities?: string[],
    projectOnly?: boolean,
  },
  status: 'active'|'pending'|'inactive',
  verified: boolean,
  disabled: boolean,
  createdAt: Timestamp,
  updatedAt: Timestamp,
}
```

---

## API Endpoints Used

### List Users
```bash
GET /api/admin/users?role=broker
```

### Create User
```bash
POST /api/admin/users
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1-555-0000",
  "role": "broker",
  "company": "My Brokerage"
}
```

### Update User
```bash
PATCH /api/admin/users
Content-Type: application/json

{
  "id": "user-doc-id",
  "name": "Jane Doe",
  "email": "jane@example.com",
  "phone": "+1-555-0001",
  "disabled": false,
  "status": "active"
}
```

### Delete User
```bash
DELETE /api/admin/users
Content-Type: application/json

{
  "id": "user-doc-id"
}
```

---

## What's Next (Week 2)

Once you've created the Paraiso Inmobiliario broker and agents:

1. **CRM Foundation**
   - Agents can add buyers manually
   - Agents can set buyer criteria
   - Try matching system logic

2. **Lead Routing Control**
   - All public CTAs (Request Info, Request Call, WhatsApp) route to Master Admin first
   - Admin assigns to agent/broker
   - Conversation opens in internal inbox

3. **Internal Inbox**
   - Agent ↔ Buyer messaging
   - Agent ↔ Agent communication
   - Listing previews in chat
   - Quick action templates

---

## Troubleshooting

**"Failed to create user"**
- Check that name, email, and required fields are filled
- Email must be unique (lowercase)
- Try creating with a different email

**"No brokers found" (when creating agent)**
- First create a Broker account
- Brokers must be created before agents can be assigned

**User data not updating**
- Refresh the page using F5
- Clear browser cache if needed
- Check that you have Master Admin role

---

## Status

✅ **Week 1 Complete**
- Master Admin can authorize entire ecosystem
- Role distribution works (Broker → Agents, etc.)
- User profiles editable
- Buyer criteria stored for later matching

Ready for Week 2: CRM Foundation & Lead Routing
