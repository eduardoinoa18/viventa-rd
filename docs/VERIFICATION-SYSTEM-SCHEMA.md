# VERIFICATION SYSTEM SCHEMA
## Database Architecture & Implementation Guide

> **Strategic Purpose**: Build structural trust infrastructure that becomes competitive moat

**Impact**: Verification = differentiation vs Facebook/Corotos, enables premium tier monetization, drives agent applications

---

## 🎯 System Overview

### Verification Tiers

| Tier | Requirements | Badge | Benefits |
|------|--------------|-------|----------|
| **Unverified** | Default | None | Free, 3 listings max |
| **Verified** 🟢 | ID + Phone | Green checkmark | 10 listings, priority support |
| **Pro** 🔵 | + License + History | Blue badge | 25 listings, analytics, verification priority |
| **Elite** 🟣 | + Performance metrics | Purple gradient | Unlimited, featured placement, API access |

### Verification Flow

```
Agent Signup
    ↓
Submit Application (ID, Phone, License)
    ↓
Phone SMS Verification (automated)
    ↓
Admin Manual Review (documents)
    ↓
Approved / Rejected / Request More Info
    ↓
Badge Assigned + Email Notification
    ↓
Performance Tracking (for Elite upgrade)
```

---

## 🗄️ Database Schema

### Collection 1: `agentVerifications`

**Purpose**: Track agent verification applications and status

```typescript
interface AgentVerification {
  // Core identifiers
  id: string; // Auto-generated Firestore doc ID
  agentId: string; // Reference to users/{userId}
  
  // Status tracking
  status: 'pending' | 'approved' | 'rejected' | 'incomplete' | 'more_info_requested';
  tier: 'verified' | 'pro' | 'elite' | null;
  
  // Submission metadata
  submittedAt: Timestamp;
  submittedBy: string; // Always same as agentId
  
  // Document uploads
  documents: {
    nationalId: {
      url: string; // Firebase Storage URL
      fileName: string;
      uploadedAt: Timestamp;
      verified: boolean;
      verifiedAt: Timestamp | null;
      verifiedBy: string | null; // Admin userId
      notes: string | null;
    };
    
    professionalLicense: {
      url: string | null;
      fileName: string | null;
      licenseNumber: string | null;
      uploadedAt: Timestamp | null;
      verified: boolean;
      verifiedAt: Timestamp | null;
      verifiedBy: string | null;
      notes: string | null;
    };
    
    proofOfAddress: {
      url: string | null;
      fileName: string | null;
      uploadedAt: Timestamp | null;
      verified: boolean;
      verifiedAt: Timestamp | null;
      verifiedBy: string | null;
      notes: string | null;
    };
  };
  
  // Phone verification
  phoneVerification: {
    phone: string; // E.164 format: +18095551234
    verified: boolean;
    verifiedAt: Timestamp | null;
    smsCode: string | null; // Hashed in production
    smsCodeExpiresAt: Timestamp | null;
    smsSentAt: Timestamp | null;
    attempts: number; // Rate limiting
  };
  
  // Admin review
  reviewedAt: Timestamp | null;
  reviewedBy: string | null; // Admin userId
  reviewNotes: string | null;
  requestedInfo: string | null; // What to resubmit if incomplete
  
  // Performance metrics (for Elite tier qualification)
  performanceMetrics: {
    avgResponseTime: number | null; // Minutes (calculated from messages)
    listingsPublished: number;
    activeListings: number;
    successfulTransactions: number;
    clientRatings: {
      average: number | null; // 0-5
      count: number;
    };
    accountAge: number; // Days since signup
    lastActive: Timestamp | null;
  };
  
  // Audit trail
  history: Array<{
    action: 'submitted' | 'approved' | 'rejected' | 'info_requested' | 'resubmitted';
    timestamp: Timestamp;
    performedBy: string; // userId
    notes: string | null;
  }>;
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Firestore Indexes Required**:
```json
[
  {
    "collectionGroup": "agentVerifications",
    "queryScope": "COLLECTION",
    "fields": [
      { "fieldPath": "status", "order": "ASCENDING" },
      { "fieldPath": "submittedAt", "order": "DESCENDING" }
    ]
  },
  {
    "collectionGroup": "agentVerifications",
    "queryScope": "COLLECTION",
    "fields": [
      { "fieldPath": "tier", "order": "ASCENDING" },
      { "fieldPath": "createdAt", "order": "DESCENDING" }
    ]
  }
]
```

---

### Collection 2: `propertyVerifications`

**Purpose**: Track property verification status and trust scores

```typescript
interface PropertyVerification {
  // Core identifiers
  id: string; // Same as listing ID
  propertyId: string; // Reference to listings/{listingId}
  agentId: string;
  
  // Status
  status: 'unverified' | 'pending' | 'verified' | 'flagged' | 'rejected';
  
  // Automated checks (run on listing creation/update)
  autoChecks: {
    hasPriceData: boolean;
    hasLocation: boolean;
    hasImages: boolean;
    hasMinimumImages: boolean; // At least 3 photos
    imagesNotDuplicates: boolean; // Cross-reference other listings
    priceReasonable: boolean; // Within 2 std dev of zone average
    descriptionLength: boolean; // At least 100 characters
    hasContactInfo: boolean;
    completedAt: Timestamp | null;
    score: number; // 0-100 based on passed checks
  };
  
  // Manual review (admin)
  manualReview: {
    reviewed: boolean;
    reviewedAt: Timestamp | null;
    reviewedBy: string | null;
    approved: boolean;
    notes: string | null;
    checklist: {
      photosAuthentic: boolean | null; // Not stock photos
      addressValid: boolean | null;
      priceRealistic: boolean | null;
      descriptionAccurate: boolean | null;
      agentAuthorized: boolean | null; // Agent authorized to list
    };
  };
  
  // Document verification (optional, for premium listings)
  documents: {
    titleDeed: {
      url: string | null;
      uploadedAt: Timestamp | null;
      verified: boolean;
    };
    ownershipProof: {
      url: string | null;
      uploadedAt: Timestamp | null;
      verified: boolean;
    };
  };
  
  // Trust score (0-100, composite)
  trustScore: number;
  trustScoreBreakdown: {
    autoChecks: number; // 0-40 points
    manualReview: number; // 0-40 points
    agentTier: number; // 0-10 points (Elite=10, Pro=7, Verified=4)
    performance: number; // 0-10 points (views, engagement, no flags)
  };
  
  // Flags and reports
  flags: Array<{
    id: string;
    type: 'price_outlier' | 'duplicate_images' | 'suspicious_text' | 'user_report' | 'expired';
    severity: 'low' | 'medium' | 'high';
    flaggedAt: Timestamp;
    flaggedBy: string; // System or userId
    reason: string;
    resolved: boolean;
    resolvedAt: Timestamp | null;
    resolvedBy: string | null;
    resolution: string | null;
  }>;
  
  // Verification history
  verifiedAt: Timestamp | null;
  lastCheckedAt: Timestamp | null;
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Firestore Indexes Required**:
```json
[
  {
    "collectionGroup": "propertyVerifications",
    "queryScope": "COLLECTION",
    "fields": [
      { "fieldPath": "status", "order": "ASCENDING" },
      { "fieldPath": "trustScore", "order": "DESCENDING" }
    ]
  },
  {
    "collectionGroup": "propertyVerifications",
    "queryScope": "COLLECTION",
    "fields": [
      { "fieldPath": "flags", "arrayConfig": "CONTAINS" },
      { "fieldPath": "createdAt", "order": "DESCENDING" }
    ]
  }
]
```

---

### Collection 3: `verificationStats` (Singleton)

**Purpose**: Global statistics for trust page and homepage

```typescript
interface VerificationStats {
  id: 'global'; // Singleton document
  
  // Agent stats
  agents: {
    total: number;
    verified: number;
    pro: number;
    elite: number;
    pending: number;
    rejected: number;
  };
  
  // Property stats
  properties: {
    total: number;
    verified: number;
    pending: number;
    flagged: number;
    unverified: number;
  };
  
  // Verification performance
  verificationRate: number; // Percentage of verified agents
  propertyVerificationRate: number; // Percentage of verified properties
  avgAgentReviewTime: number; // Hours
  avgPropertyReviewTime: number; // Hours
  
  // Trust metrics
  avgTrustScore: number; // Platform average
  highTrustListings: number; // Trust score >80
  
  // Activity stats
  applicationsThisWeek: number;
  applicationsThisMonth: number;
  approvalsThisWeek: number;
  approvalsThisMonth: number;
  
  // Metadata
  lastUpdated: Timestamp;
  lastCalculatedBy: string; // Cloud Function or admin userId
}
```

**Update Trigger**: Cloud Function runs every 6 hours to recalculate stats

---

## 🔧 API Endpoints

### Agent Verification Endpoints

#### 1. Submit Verification Application

**Endpoint**: `POST /api/verification/agent/submit`

**Auth**: Requires authenticated user with `role: agent`

**Request Body**:
```typescript
{
  phone: string;          // E.164 format
  documents: {
    nationalId: File;     // PDF or image
    license?: File;       // Optional for Verified tier
    address?: File;       // Optional
  };
  tierRequested: 'verified' | 'pro';
}
```

**Process**:
1. Validate user is agent
2. Check if existing application (prevent duplicates)
3. Upload files to Firebase Storage (`/verifications/{userId}/`)
4. Create `agentVerifications` document with status `pending`
5. Send SMS verification code
6. Send confirmation email
7. Notify admins (email or dashboard notification)

**Response**:
```typescript
{
  success: true;
  verificationId: string;
  smsCodeSent: boolean;
  estimatedReviewTime: number; // Hours
}
```

**Storage Structure**:
```
/verifications/
  /{userId}/
    /national-id-{timestamp}.pdf
    /license-{timestamp}.pdf
    /address-{timestamp}.pdf
```

---

#### 2. Verify Phone (SMS Code)

**Endpoint**: `POST /api/verification/agent/verify-phone`

**Request Body**:
```typescript
{
  verificationId: string;
  code: string; // 6-digit code
}
```

**Process**:
1. Fetch verification document
2. Check code matches (hashed comparison)
3. Check expiration (15 minutes)
4. Update `phoneVerification.verified = true`
5. Return success

**Response**:
```typescript
{
  success: boolean;
  message: string;
}
```

**Rate Limiting**: 
- Max 3 attempts per verification
- Max 1 SMS resend per 5 minutes

---

#### 3. Get Verification Status

**Endpoint**: `GET /api/verification/agent/status`

**Auth**: Requires authenticated agent

**Response**:
```typescript
{
  hasApplication: boolean;
  status: 'pending' | 'approved' | 'rejected' | 'incomplete' | null;
  tier: 'verified' | 'pro' | 'elite' | null;
  submittedAt: string | null;
  reviewedAt: string | null;
  estimatedReviewTime: number | null; // Hours remaining
  requestedInfo: string | null; // If more info needed
  canResubmit: boolean;
}
```

---

### Admin Verification Endpoints

#### 4. Get Pending Verifications

**Endpoint**: `GET /api/admin/verifications/pending`

**Auth**: Requires `role: admin` or `role: master`

**Query Params**:
- `page`: number (default 1)
- `limit`: number (default 20)
- `status`: 'pending' | 'all' (default 'pending')
- `tier`: 'verified' | 'pro' | 'all' (default 'all')

**Response**:
```typescript
{
  verifications: Array<{
    id: string;
    agentId: string;
    agentName: string;
    agentEmail: string;
    status: string;
    tierRequested: string;
    submittedAt: string;
    phoneVerified: boolean;
    documents: {
      nationalId: { url: string; verified: boolean };
      license: { url: string | null; verified: boolean };
    };
  }>;
  total: number;
  page: number;
  totalPages: number;
}
```

---

#### 5. Approve Verification

**Endpoint**: `POST /api/admin/verifications/approve`

**Auth**: Requires admin role

**Request Body**:
```typescript
{
  verificationId: string;
  tier: 'verified' | 'pro' | 'elite';
  notes?: string;
}
```

**Process**:
1. Update `agentVerifications` status to `approved`
2. Update `users` document: set `verificationTier: tier`
3. Update `users` document: update `role` if needed
4. Add to history log
5. Send approval email with badge
6. Update global stats
7. Grant tier benefits (listing limits, features)

**Response**:
```typescript
{
  success: true;
  agent: {
    id: string;
    name: string;
    email: string;
    tier: string;
  };
}
```

**Email Template** (Approval):
```
Subject: ¡Tu cuenta ha sido verificada! ✅

Hola {agentName},

¡Felicidades! Tu solicitud de verificación ha sido aprobada.

Tu nuevo nivel: {tier} {badge}

Beneficios desbloqueados:
- {listingLimit} publicaciones
- Badge de verificación en tu perfil
- Prioridad en soporte
- {otherBenefits}

Empieza a publicar: https://viventa.com.do/dashboard/listings/create

¡Éxito!
Equipo VIVENTA
```

---

#### 6. Reject Verification

**Endpoint**: `POST /api/admin/verifications/reject`

**Request Body**:
```typescript
{
  verificationId: string;
  reason: string;
  allowResubmit: boolean;
}
```

**Process**:
1. Update status to `rejected`
2. Add to history log
3. Send rejection email with reason
4. Update stats

**Email Template** (Rejection):
```
Subject: Actualización sobre tu solicitud de verificación

Hola {agentName},

Hemos revisado tu solicitud de verificación y necesitamos información adicional:

Razón: {reason}

{if allowResubmit}
Puedes volver a enviar tu solicitud con los documentos correctos aquí:
https://viventa.com.do/dashboard/get-verified
{/if}

Si tienes preguntas, contáctanos: soporte@viventa.com.do

Equipo VIVENTA
```

---

### Property Verification Endpoints

#### 7. Trigger Auto-Verification

**Endpoint**: `POST /api/verification/property/auto-check`

**Triggered**: Automatically when listing is created or updated

**Request Body**:
```typescript
{
  propertyId: string;
}
```

**Process**:
1. Fetch listing data
2. Run automated checks:
   - Has price? ✓
   - Has location coordinates? ✓
   - Has at least 3 images? ✓
   - Images unique (not used in other listings)? ✓
   - Price within 2 std dev of zone average? ✓
   - Description >100 chars? ✓
3. Calculate auto-check score (0-100)
4. Check agent verification tier (bonus points)
5. Calculate total trust score
6. Create/update `propertyVerifications` document
7. If trust score >70 && agent verified, auto-approve

**Response**:
```typescript
{
  trustScore: number;
  autoApproved: boolean;
  requiresManualReview: boolean;
  checks: {
    hasPriceData: boolean;
    hasLocation: boolean;
    // ... all checks
  };
}
```

---

#### 8. Flag Property

**Endpoint**: `POST /api/verification/property/flag`

**Request Body**:
```typescript
{
  propertyId: string;
  type: 'price_outlier' | 'duplicate_images' | 'suspicious_text' | 'user_report';
  reason: string;
  reporterEmail?: string;
}
```

**Process**:
1. Add flag to `propertyVerifications.flags` array
2. If high severity → mark property as `flagged`
3. Notify admin
4. Send confirmation to reporter (if email provided)

---

## 🎨 UI Components

### 1. Agent Verification Form

**File**: `app/dashboard/get-verified/page.tsx`

**Features**:
- Multi-step wizard (4 steps)
- Progress indicator
- Document upload with preview
- SMS verification
- Tier selection

**Steps**:

**Step 1: Choose Tier**
```
┌─────────────────────────────────────┐
│  Elige tu nivel de verificación    │
│                                     │
│  [🟢 Verificado]  [🔵 Pro]          │
│   Gratis          $29/mes           │
│   10 listados     25 listados       │
│   Badge verde     Badge azul        │
│                                     │
│  [Continuar →]                      │
└─────────────────────────────────────┘
```

**Step 2: Upload Documents**
```
┌─────────────────────────────────────┐
│  Sube tus documentos                │
│                                     │
│  📄 Cédula de Identidad *           │
│  [Subir archivo] [✓ Cargado]       │
│                                     │
│  📜 Licencia Profesional (Pro)      │
│  [Subir archivo]                    │
│                                     │
│  📍 Comprobante de Domicilio        │
│  [Subir archivo]                    │
│                                     │
│  [← Atrás]  [Continuar →]          │
└─────────────────────────────────────┘
```

**Step 3: Verify Phone**
```
┌─────────────────────────────────────┐
│  Verifica tu teléfono               │
│                                     │
│  Número: +1 (809) 555-1234          │
│  [Editar]                           │
│                                     │
│  Te hemos enviado un código SMS     │
│                                     │
│  Código: [___][___][___][___]       │
│                                     │
│  ¿No recibiste el código?           │
│  [Reenviar (59s)]                   │
│                                     │
│  [← Atrás]  [Verificar →]          │
└─────────────────────────────────────┘
```

**Step 4: Review & Submit**
```
┌─────────────────────────────────────┐
│  Revisa tu solicitud                │
│                                     │
│  Nivel: Pro 🔵                      │
│  Documentos: 3 archivos ✓           │
│  Teléfono: Verificado ✓             │
│                                     │
│  Tiempo de revisión estimado:       │
│  24-48 horas                        │
│                                     │
│  Recibirás un email cuando tu       │
│  cuenta sea aprobada.               │
│                                     │
│  [← Atrás]  [Enviar Solicitud]     │
└─────────────────────────────────────┘
```

---

### 2. Admin Verification Dashboard

**File**: `app/master/verifications/page.tsx`

**Layout**:
```
┌──────────────────────────────────────────────────────┐
│  Verificaciones Pendientes                           │
│                                                      │
│  Filtros: [Todas ▼] [Nivel ▼] [Fecha ▼]            │
│  Buscar: [____________]  [23 pendientes]            │
├──────────────────────────────────────────────────────┤
│                                                      │
│  ┌────────────────────────────────────────────────┐ │
│  │  Juan Pérez                                    │ │
│  │  juan@example.com | +1 (809) 555-1234         │ │
│  │  Enviado: hace 2 días | Nivel: Pro            │ │
│  │  ✓ Teléfono verificado                        │ │
│  │                                                │ │
│  │  [Ver Documentos] [Aprobar ✓] [Rechazar ✗]   │ │
│  └────────────────────────────────────────────────┘ │
│                                                      │
│  ┌────────────────────────────────────────────────┐ │
│  │  María González                                │ │
│  │  maria@example.com | +1 (829) 555-5678        │ │
│  │  Enviado: hace 5 días | Nivel: Verificado     │ │
│  │  ⚠ Teléfono NO verificado                     │ │
│  │                                                │ │
│  │  [Ver Documentos] [Aprobar ✓] [Rechazar ✗]   │ │
│  └────────────────────────────────────────────────┘ │
│                                                      │
└──────────────────────────────────────────────────────┘
```

**Document Viewer Modal**:
```
┌──────────────────────────────────────────────┐
│  Revisión: Juan Pérez                  [✗]  │
├──────────────────────────────────────────────┤
│                                              │
│  [Documento 📄]          [Información 📋]    │
│                                              │
│  ┌──────────────────┐   Nivel: Pro 🔵       │
│  │                  │   Email: juan@...      │
│  │   [PDF/Image]    │   Phone: ✓ Verificado  │
│  │                  │                        │
│  │                  │   Documentos:          │
│  │                  │   ✓ Cédula            │
│  │                  │   ✓ Licencia          │
│  └──────────────────┘   ✓ Comprobante       │
│  [◄] [1/3] [►]                              │
│  [↻ Rotar] [+/-]         Enviado: 2d ago    │
│                                              │
│  Notas del revisor:                          │
│  [_____________________]                     │
│                                              │
│  [Rechazar] [Pedir más info] [✓ Aprobar]   │
└──────────────────────────────────────────────┘
```

---

## 🔐 Security Considerations

### Document Storage
- **Location**: Firebase Storage `/verifications/{userId}/`
- **Access**: Private (only accessible by admin + owner)
- **Retention**: Keep for 90 days after approval/rejection
- **Encryption**: Firebase Storage uses AES-256 encryption at rest

### SMS Verification
- **Code Generation**: 6-digit random number
- **Storage**: Hash with bcrypt before storing
- **Expiration**: 15 minutes
- **Rate Limiting**: 
  - Max 3 verification attempts
  - Max 1 SMS per 5 minutes per phone
  - Max 5 SMS per day per phone

### Admin Actions
- **Audit Logging**: All approve/reject actions logged in `history` array
- **Role Check**: Verify admin role on every endpoint
- **Email Notifications**: Admin receives copy of all approval/rejection emails

### Anti-Fraud Measures
- **Duplicate Detection**: Check if phone/email already verified
- **Document Analysis**: Manual review catches fake IDs
- **Behavioral Analysis**: Track agent actions post-approval
- **Revocation**: Admin can revoke verification if fraud detected

---

## 📊 Performance Tracking

### Cloud Function: Calculate Performance Metrics

**Trigger**: Nightly (3am) + on-demand

**Function**: `calculateAgentPerformance(agentId)`

**Calculates**:
```typescript
{
  avgResponseTime: average(
    time from first customer message to agent reply
    for last 30 days
  ),
  
  listingsPublished: count(
    listings created by agent, all time
  ),
  
  activeListings: count(
    listings with status = 'active'
  ),
  
  successfulTransactions: count(
    // Future: from transaction tracking
  ),
  
  clientRatings: {
    average: average(reviews.rating),
    count: count(reviews)
  },
  
  accountAge: days since user.createdAt,
  
  lastActive: max(lastLoginAt, lastListingCreatedAt, lastMessageSentAt)
}
```

**Elite Tier Qualification Criteria**:
- Avg response time < 2 hours
- Active listings ≥ 5
- Client rating ≥ 4.5 (if rated)
- Account age ≥ 90 days
- No violations/flags

---

## 🚀 Implementation Timeline

### Week 2 (Days 4-5)
- [x] Design database schema
- [ ] Create Firestore collections
- [ ] Build API endpoints (submit, status, verify-phone)
- [ ] Implement SMS verification (Twilio)
- [ ] Test API flows

### Week 2-3 (Days 6-7)
- [ ] Build agent verification form UI
- [ ] Multi-step wizard
- [ ] Document upload component
- [ ] Phone verification flow
- [ ] Form validation

### Week 3 (Days 8-9)
- [ ] Build admin verification dashboard
- [ ] Pending applications list
- [ ] Document viewer modal
- [ ] Approve/reject actions
- [ ] Email notifications

### Week 3 (Day 10)
- [ ] Property auto-verification logic
- [ ] Trust score calculation
- [ ] Flag system
- [ ] Integration testing

---

## 🎯 Success Metrics

| Metric | Target | Timeline |
|--------|--------|----------|
| Agent applications | 10+/week | Week 3 |
| Approval rate | >80% | Week 4 |
| Avg review time | <48 hours | Week 4 |
| Verified agents | 50+ | Month 3 |
| Elite agents | 10+ | Month 6 |
| Property trust score avg | >75 | Month 3 |

---

**This verification system becomes Viventa's competitive moat.**

**Market positioning: Verified Marketplace (not chaotic Facebook groups).**
