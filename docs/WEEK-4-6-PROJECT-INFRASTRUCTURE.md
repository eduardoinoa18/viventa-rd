# 🏗 WEEK 4-6: PROJECT INFRASTRUCTURE EXPANSION
## Real Estate Operating System Evolution

**Strategic Context:**
- Week 1-3: Authority positioning + investment tooling (COMPLETE ✅)
- Week 4-6: Developer-grade system (infrastructure for constructoras + projects)
- Month 2: Verification moat (constructora legitimacy)
- Month 3: Monetization layer (premium tiers, featured projects, API)

**Transformation Goal:**
From: Listing marketplace (single-property focused)
To: Multi-unit operating system (project-based real estate infrastructure)

---

## 📐 PHASE 1: Project Infrastructure Foundation (Week 4-5)
*Duration: 5 days*

### Phase 1 Objectives
- Introduce Project entity (root container for multi-unit offerings)
- Introduce Unit entity (inventory intelligence)
- Enable "Desde" logic (smallest unit size/price)
- Basic status tracking (inventory states)
- Professional project listing display

### Phase 1 Deliverables
1. Firestore schema (Project + Unit collections + indices)
2. API routes (project CRUD, unit management)
3. Project creation flow (tab-based UI)
4. Project listing page (professional display)
5. Unit inventory display
6. Integration test + verification

---

## 🔧 PART 1: FIRESTORE SCHEMA DESIGN

### Collections Structure

```
/projects/
  /{projectId}/
    Basic Info
    ├── id: string (auto-generated)
    ├── developerId: string (FK to users)
    ├── name: string
    ├── description: string
    ├── shortDescription: string (for cards)
    ├── location: GeoPoint or {city, sector, address}
    ├── googleMapsUrl: string
    ├── latitude: number
    ├── longitude: number
    
    Project Status
    ├── status: enum (active | inactive | archived)
    ├── constructionStatus: enum (pre-venta | en-construccion | entrega-proxima | entregado | agotado)
    ├── deliveryDate: timestamp
    ├── completionPercent: number (0-100)
    
    Inventory & Pricing
    ├── totalUnits: number
    ├── availableUnits: number (auto-calculated)
    ├── smallestUnitMeters: number (auto-calculated from units)
    ├── smallestUnitPrice: {usd: number, dop: number} (auto-calculated)
    
    Media & Details
    ├── images: string[] (urls)
    ├── featuredImage: string
    ├── amenities: string[]
    ├── features: string[]
    
    Metadata
    ├── createdAt: timestamp
    ├── updatedAt: timestamp
    ├── verificationStatus: string (verified | pending | unverified)
    ├── views: number
    ├── favorites: number

/projects/{projectId}/units/
  /{unitId}/
    Unit Identification
    ├── id: string
    ├── projectId: string (parent reference)
    ├── unitNumber: string (e.g., "101", "2-B")
    ├── unitType: enum (apartamento | casa | penthouse | estudio | otro)
    
    Physical Properties
    ├── bedrooms: number
    ├── bathrooms: number
    ├── meters: number
    ├── lotMeters: number (for land units)
    
    Pricing
    ├── priceUSD: number
    ├── priceDOP: number
    ├── pricePerM2: number (calculated)
    
    Availability & Status
    ├── status: enum (disponible | separado | en-proceso | vendido | reservado | bloqueado)
    ├── availableDate: timestamp
    
    Financing
    ├── separationAmount: {usd?: number} (separación/deposit amount)
    ├── initialPercent: number (e.g., 20)
    ├── paymentPlan: {type, months, monthlyAmount}
    
    Metadata
    ├── createdAt: timestamp
    ├── updatedAt: timestamp
    ├── floor: number (optional)
    ├── views: number

/promotionalOffers/
  /{offerId}/
    ├── projectId: string (which project this applies to)
    ├── title: string
    ├── description: string
    ├── validFrom: timestamp
    ├── validUntil: timestamp
    ├── discountPercent?: number
    ├── discountAmount?: {usd?: number, dop?: number}
    ├── specialTerms: string
    ├── minimumPurchase?: number
    ├── active: boolean
    ├── createdAt: timestamp

/financingOptions/
  /{financingId}/
    ├── projectId: string
    ├── type: enum (separacion | inicial | contra-entrega | interno | bancario)
    ├── label: string (e.g., "Separated: USD $2,000")
    ├── description: string
    ├── amount?: {usd?: number, dop?: number}
    ├── percent?: number
    ├── monthlyAmount?: {usd?: number, dop?: number}
    ├── months?: number
    ├── terms: string
    ├── order: number (display order)
    ├── active: boolean
```

### Firestore Indices Required

```
Collection: projects
  - Composite Index: (developerId, status, createdAt DESC)
  - Composite Index: (status, constructionStatus, createdAt DESC)
  - Composite Index: (verificationStatus, status, createdAt DESC)

Collection: projects/{projectId}/units
  - Composite Index: (status, availableDate ASC)
  - Composite Index: (status, priceUSD ASC)
  - Composite Index: (unitType, status)

Collection: projects (geospatial)
  - Geo Index: (latitude, longitude) for map queries
```

### Query Patterns (Optimized)

```typescript
// Get all active projects with available units
const q = query(
  collection(db, 'projects'),
  where('status', '==', 'active'),
  orderBy('createdAt', 'desc')
);

// Get projects by developer (with pagination)
const devProjects = query(
  collection(db, 'projects'),
  where('developerId', '==', userId),
  where('status', '!=', 'archived'),
  orderBy('updatedAt', 'desc'),
  limit(20)
);

// Get available units for a project (sorted by price)
const availableUnits = query(
  collection(db, `projects/${projectId}/units`),
  where('status', '==', 'disponible'),
  orderBy('priceUSD', 'asc')
);

// Get projects near location (geospatial - requires GeoFirestore or manual calculation)
// For MVP: Simple bounding box query on latitude/longitude
const nearbyProjects = query(
  collection(db, 'projects'),
  where('latitude', '>=', minLat),
  where('latitude', '<=', maxLat),
  where('longitude', '>=', minLng),
  where('longitude', '<=', maxLng)
);

// Get trending/popular projects
const trendingProjects = query(
  collection(db, 'projects'),
  where('status', '==', 'active'),
  orderBy('views', 'desc'),
  limit(10)
);
```

---

## 🔌 PART 2: API ROUTES (Week 4 Day 2)

### Route: POST `/api/projects/create`
**Purpose:** Create new project with initial metadata

```typescript
// Request
{
  name: string
  description: string
  city: string
  sector: string
  address: string
  latitude: number
  longitude: number
  googleMapsUrl: string
  totalUnits: number
  constructionStatus: enum
  deliveryDate: timestamp
  amenities: string[]
  images: string[]
}

// Response
{
  projectId: string
  status: 'success' | 'error'
  message: string
}

// Logic
1. Validate all required fields
2. Generate projectId (UUID)
3. Auto-set: createdAt, updatedAt, status: 'active', availableUnits: totalUnits
4. Store in /projects/{projectId}
5. Emit event: 'project.created' (for indexing)
6. Return projectId
```

### Route: GET `/api/projects/list`
**Purpose:** Fetch projects with pagination, filters, sorting

```typescript
// Query Parameters
?status=active
&constructionStatus=en-construccion
&city=santo-domingo
&sortBy=createdAt|views|availableUnits
&sortOrder=asc|desc
&page=1
&limit=20

// Response
{
  projects: Project[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

// Query Logic
1. Filter by status (default: active)
2. Filter by constructionStatus (optional)
3. Filter by city (optional)
4. Sort by specified field
5. Paginate (offset-limit)
6. For each project: calculate availableUnits real-time
7. Return with pagination metadata
```

### Route: GET `/api/projects/:projectId`
**Purpose:** Fetch single project with full details

```typescript
// Response
{
  project: Project
  units: Unit[]
  promotionalOffers: PromotionalOffer[]
  financingOptions: FinancingOption[]
  stats: {
    viewsLastWeek: number
    favoritesCount: number
    unitsSeparated: number
  }
}

// Query Logic
1. Fetch project doc
2. Fetch all units subcollection
3. Fetch promotional offers (where projectId)
4. Fetch financing options (where projectId)
5. Calculate stats
6. Auto-update views counter
7. Return aggregated data
```

### Route: POST `/api/projects/:projectId/units/create`
**Purpose:** Create single unit

```typescript
// Request
{
  unitNumber: string
  unitType: enum
  bedrooms: number
  bathrooms: number
  meters: number
  priceUSD: number
  priceDOP: number
  separationAmount: number
  initialPercent: number
}

// Response
{
  unitId: string
  projectId: string
  status: 'success'
}

// Logic
1. Validate data
2. Generate unitId
3. Calculate pricePerM2
4. Create /projects/{projectId}/units/{unitId}
5. Trigger: updateProjectMetadata (recalc smallestPrice, smallestMeters)
6. Return unitId
```

### Route: POST `/api/projects/:projectId/units/bulk`
**Purpose:** Bulk upload units (CSV or JSON)

```typescript
// Request (multipart form)
{
  units: Array<{
    unitNumber: string
    unitType: enum
    bedrooms: number
    bathrooms: number
    meters: number
    priceUSD: number
    priceDOP: number
    separationAmount: number
    initialPercent: number
  }>
}

// Response
{
  created: number
  failed: number
  errors: Array<{lineNumber: number, error: string}>
}

// Logic
1. Validate each unit
2. Create all units as batch write
3. Update project metadata (availableUnits, smallestPrice, etc.)
4. Return summary
5. Trigger reindex/search update
```

### Route: PUT `/api/projects/:projectId/units/:unitId`
**Purpose:** Update unit (status, pricing, etc.)

```typescript
// Request (partial update)
{
  status?: enum
  priceUSD?: number
  priceDOP?: number
  available?: boolean
}

// Logic
1. Validate update
2. Update unit doc
3. If status changed: trigger inventory intelligence (analytics event)
4. Recalc project metadata
5. Return updated unit
```

### Route: GET `/api/projects/:projectId/units`
**Purpose:** Fetch all units for project (with filtering)

```typescript
// Query Parameters
?status=disponible
&sortBy=priceUSD
&sortOrder=asc

// Response
{
  units: Unit[]
  summary: {
    total: number
    disponible: number
    separado: number
    vendido: number
  }
}
```

### Route: POST `/api/projects/:projectId/stats`
**Purpose:** Get project statistics (views, favorites, units sold)

```typescript
// Response
{
  projectId: string
  views: number
  viewsLastWeek: number
  favorites: number
  unitsSold: number
  unitsSeparated: number
  availableUnits: number
  revenue: {usd: number, dop: number}
  avgDaysToSell: number
  conversionRate: number
}
```

---

## 🎨 PART 3: PROJECT CREATION UI (Week 4 Day 3)

### Tab-Based Multi-Step Form

Located: `/master/projects/create`

#### Tab 1: Project Info
```
Inputs:
- Project name (required)
- Short description (50 chars, for cards)
- Full description (rich text)
- City selector (dropdown, autocomplete)
- Sector (text input)
- Address (text input)
- Total units (number)
- Construction status (select: pre-venta, en-construccion, etc.)
- Delivery date (date picker)
- Featured image (file upload)

Validation:
- Name required + min 3 chars
- Description min 20 chars
- City required
- Total units > 0
- Media upload validation

Next Button: Save project basic info, proceed to Tab 2
```

#### Tab 2: Add Units (Bulk)
```
Two input modes:

MODE A: Individual Unit Form
- Unit number (e.g., "101")
- Unit type (select: apartamento, casa, penthouse, estudio)
- Bedrooms (number)
- Bathrooms (number)
- Meters (number)
- Price USD (number)
- Price DOP (auto-calculated at BRL rate)
- Separation amount (optional)
- Initial % (default 20)
- [Add Unit] button → adds to list
- [Bulk Edit] button → switches to MODE B

MODE B: CSV/Paste Table
- Text area for bulk paste (pre-formatted table)
- Format: unitNumber | bedrooms | bathrooms | meters | priceUSD | separationAmount
- [Parse & Validate] button
- Shows preview table
- [Confirm & Add All] button

Display:
- List of added units (table format)
- Summary: {total: X, bedrooms: [1,2,3], priceRange: [X, Y]}
- [Remove] button per unit

Validation:
- unitNumber unique per project
- Price > 0
- Meters > 0
- At least 1 unit required

Next Button: Save all units, proceed to Tab 3
```

#### Tab 3: Amenities & Features
```
Inputs:
- Amenities (checklist + freetext)
  Default options: Piscina, Gym, Seguridad 24/7, Salón comunal, Parque infantil, Cancha deportiva
- Features (checklist + freetext)
  Default options: Agua potable, Electricidad, Terrenos planos, Área verde, Acceso a carretera
- Upload gallery (multiple images)

Validation:
- At least 1 image

Next Button: Proceed to Tab 4
```

#### Tab 4: Financing & Promotions
```
Section A: Financing Options
- Add financing option (button)
  Inputs: type (select), amount/percent, months, terms
  Examples:
    - Separación: USD $2,000
    - Inicial: 20%
    - Contra entrega: 10%
    - Interno: 36 meses sin interés

Section B: Promotional Offers
- Add promotional offer (button)
  Inputs: title, description, discount %, valid until date
  Examples:
    - 10% de descuento por pronto pago
    - Bono línea blanca incluida
    - Financiamiento directo con constructora

Display:
- List of added financing options
- List of promotional offers
- Preview card: How it will display on project page

Next Button: Proceed to Tab 5
```

#### Tab 5: Location & Map
```
Inputs:
- Latitude / Longitude (auto-filled or manual input)
- Google Maps URL (text input)
- Map preview (embed Google Maps preview)
- Address verification

Validation:
- Valid coordinates

Next Button: Proceed to Tab 6
```

#### Tab 6: Review & Publish
```
Display:
- Complete project summary
- Unit summary table (all units)
- Images preview
- Financing preview
- Amendments allowed (Edit button per section)

Actions:
- [Save as Draft] button (status: inactive)
- [Publish] button (status: active)

On Publish:
- Validate schema completeness
- Upload all images (if not already)
- Create project document
- Create all unit documents
- Create financing documents
- Create promotional offer documents
- Redirect to project page
- Show success message
```

---

## 📄 PART 4: PROJECT LISTING PAGE (Week 4 Day 4)

### URL: `/projects/:projectId`

### Page Sections (Top to Bottom)

#### Hero Section
```
Layout: Full width
Content:
- Featured image (large banner)
- Project name (h1, 3xl)
- Construction status badge (colored pill: "Pre-venta", "En construcción", etc.)
- Quick info: {City}, {Sector}, {Total Units}
- "Desde" pricing: "Desde USD $145,000" + "Desde 85m²"
- Action buttons: (WhatsApp CTA + Favorite button)
```

#### Overview Cards Grid
```
3 columns (2 on mobile):
- Card 1: Unidades
  Content: X total, Y disponibles, Z vendidas
  Icon: 🏢

- Card 2: Construcción
  Content: Status badge, Delivery date, Completion % (progress bar)
  Icon: 🏗️

- Card 3: Precios
  Content: "Desde USD $X", "Desde $X m²"
  Icon: 💰
```

#### Construction Status & Timeline
```
Display:
- Current status (highlighted)
- Timeline graphic showing: Pre-venta → En construcción → Entrega → Entregado
- Progress bar (completion %)
- Estimated delivery date
- Key milestones

Example:
┌─ Pre-venta ─┬─ En construcción ─┬─ Entrega ─┬─ Entregado ─┐
│             │ [████████░░░░░░░░] │          │             │ 60%
└─────────────┴──────────────────────┴──────────┴─────────────┘
Estimated: June 2026
```

#### Financing & Offers Section
```
Two subsections:

Subsection A: Financing Options
Display as list of cards (horizontal scroll on mobile):
- Card per option
  Title: "Separación"
  Amount: "USD $2,000"
  Terms: (small text)

Subsection B: Promotional Offers
Display as banners:
- Offer card (full width)
  Title: "10% de descuento por pronto pago"
  Description: "Válido hasta 31 de marzo"
  Valid date countdown
```

#### Amenities Section
```
Display: Grid of amenity icons + labels
- Piscina 🏊
- Gym 💪
- Seguridad 24/7 🔒
- Salón comunal 🎉
etc.
```

#### Map Section
```
Display:
- Google Maps embed (400px height)
- "[Ver en Google Maps]" button
- Address below

Shows:
- Project location pin
- Nearby landmarks
- Route to city center
```

#### Units Display (Inventory)
```
Display mode: Table (2 columns on mobile)

Table Headers:
- Unit # | Bedrooms | Bathrooms | Size | Price | Status | Action

Rows:
- Unit 101 | 2 | 1.5 | 85m² | USD $145,000 | Disponible | [Ver]
- Unit 102 | 2 | 1.5 | 85m² | USD $145,000 | Separado | [contactar]
- Unit 103 | 3 | 2 | 120m² | USD $195,000 | Vendido | [similar]

Filtering:
- Filter by status (buttons above table)
- Sort by: bedrooms, size, price
- Status badge colors:
  - Disponible: green
  - Separado: yellow
  - Vendido: red/grey
  - Reservado: blue

Unit Row Click:
- Opens unit detail modal (optional MVP feature)
- Shows: all specs, pricing, financing options for this unit
```

#### Project Description Section
```
Display: Rich text / markdown
Content from: project.description
```

#### Gallery Section
```
Display: Grid of images (3 columns, 2 on mobile)
Lightbox view on click
```

#### Sidebar (Desktop Only, sticky top-24)
```
Section A: Developer Info
- Developer avatar
- Developer name
- Verification badge (if verified)
- Contact buttons (WhatsApp, Email)

Section B: Quick Contact
- WhatsApp CTA (pre-filled with project name + link)
- Call button
- Email form button

Section C: Project Stats
- Views count
- Favorites count
- Units sold %
- Last updated date
```

#### Footer Section
```
Content:
- Developer name + link to profile
- Verification status
- Legal disclaimer
```

---

## 🚀 PART 5: UNIT INVENTORY DISPLAY (Week 4 Day 5)

### Component: `<ProjectUnitInventory />`

**Props:**
```typescript
{
  projectId: string
  units: Unit[]
  onUnitSelect?: (unit: Unit) => void
  viewMode?: 'table' | 'grid' | 'list'
}
```

**Features:**

1. **Filtering Buttons** (above table)
   ```
   [Todas (X)] [Disponibles (Y)] [Separadas (Z)] [Vendidas (A)]
   ```
   Active state: bold, bg-[#00A6A6]

2. **Sorting Dropdown**
   ```
   Sort by: [Precio ↓] [Tamaño ↓] [Recámara ↓]
   ```

3. **Table Display** (default)
   ```
   | Unit # | Bed | Bath | Size | Price | Status | Action |
   |--------|-----|------|------|-------|--------|--------|
   | 101    | 2   | 1.5  | 85m² | $145k | ✓ Avail| [View] |
   ```

4. **Status Badge Logic**
   ```
   disponible → 🟢 Green ("Disponible")
   separado → 🟡 Yellow ("Separado")
   vendido → 🔴 Red ("Vendido")
   reservado → 🔵 Blue ("Reservado")
   ```

5. **Unit Click Action**
   ```
   If viewMode='table':
     → Open modal with unit details
     → Show financing for this specific unit
     → Show "Contactar" CTA
   
   If viewMode='grid':
     → Card expands to show more info
   ```

6. **Mobile Responsiveness**
   ```
   Desktop: Table (6 columns)
   Mobile: List mode (card per unit, 1 column)
     Display: Unit # | Bed/Bath | Size | Price | Status
     Tap → expand to full details
   ```

---

## ✅ PHASE 1: INTEGRATION CHECKLIST

After implementing Parts 1-5:

- [ ] Firestore schema created (all collections + indices)
- [ ] All API routes responding (test with Postman/curl)
- [ ] Project creation form saves data correctly
- [ ] Project listing page renders with sample project
- [ ] Unit inventory table displays correctly
- [ ] "Desde" pricing calculated correctly
- [ ] All buttons link correctly
- [ ] Mobile responsive on all pages
- [ ] Status badges color correctly
- [ ] Filtering/sorting works on unit table
- [ ] WhatsApp CTA works on project page

---

## 🧪 PHASE 1: TESTING STRATEGY

### Step 1: Firestore Setup Test
```bash
# Verify schema exists
firebase firestore:list-collections --project viventa-rd

# Verify indices deployed
firebase firestore:indexes-list --project viventa-rd
```

### Step 2: API Route Test
```bash
# Create project
curl -X POST http://localhost:3000/api/projects/create \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Proyecto Test",
    "city": "Santo Domingo",
    ...
  }'

# List projects
curl http://localhost:3000/api/projects/list?status=active

# Get project + units
curl http://localhost:3000/api/projects/{projectId}

# Create units
curl -X POST http://localhost:3000/api/projects/{projectId}/units/bulk \
  -H "Content-Type: application/json" \
  -d '{...}'
```

### Step 3: UI Test
1. Navigate to `/master/projects/create`
2. Fill out all tabs
3. Publish project
4. Navigate to `/projects/{projectId}`
5. Verify all sections render
6. Test filtering/sorting on unit table
7. Test WhatsApp CTA

### Step 4: End-to-End Test
1. Create project with 5 units
2. Change unit status to "separado"
3. Verify project metadata updates (availableUnits decreases)
4. Verify listing page reflects changes

---

## 📦 PHASE 1 DEPLOYMENT

After all tests pass:

```bash
git add .
git commit -m "feat(phase-1-projects): multi-unit project infrastructure

PHASE 1 COMPLETE: Developer-Grade System Foundation

NEW ENTITIES:
- Project (root container for multi-unit offerings)
- Unit (inventory tracking with status)
- PromotionalOffers (deal/financing visibility)
- FinancingOptions (structured payment terms)

FIRESTORE SCHEMA:
- 4 root collections with proper indices
- Subcollection: units under each project
- Real-time inventory sync

API ROUTES:
- POST /api/projects/create
- GET /api/projects/list
- GET /api/projects/:projectId
- POST /api/projects/:projectId/units/create
- POST /api/projects/:projectId/units/bulk
- PUT /api/projects/:projectId/units/:unitId
- GET /api/projects/:projectId/units
- GET /api/projects/:projectId/stats

UI COMPONENTS:
- Multi-tab project creation form (6 tabs)
- Professional project listing page
- Unit inventory table with filtering/sorting
- Developer sidebar with contact info

FEATURES:
- 'Desde' logic (smallest unit price + size)
- Real-time availability tracking
- Multi-status inventory (disponible, separado, vendido, etc.)
- Google Maps integration (location + links)
- Bulk unit upload (CSV/paste)

NEXT PHASE:
- Marketing & promotional offers (Phase 2)
- Financing visibility (Phase 2)
- Inventory intelligence dashboard (Month 2)

Transforms Viventa from listing platform to real estate operating system."

git push origin main
```

---

## 📊 WEEK 4-6 FULL ROADMAP

### Week 4 (Days 1-5): Phase 1 - Foundation
- Day 1: Firestore schema + API route setup
- Day 2: API routes (CRUD) + testing
- Day 3: Project creation form (all tabs)
- Day 4: Project listing page
- Day 5: Unit inventory display + full integration test

**Deliverable:** Projects can be created with units, displayed professionally, inventory tracked.

### Week 5 (Days 1-5): Phase 2 - Marketing & Financing
- Day 1: PromotionalOffers UI + API
- Day 2: Financing options display
- Day 3: Google Maps integration
- Day 4: Currency fix (show both USD + DOP)
- Day 5: Full Phase 2 integration test

**Deliverable:** Projects showcase financing, promotions, location. Professional for constructoras.

### Week 6 (Days 1-2): Phase 3 Prep - Inventory Dashboard Planning
- Day 1-2: Schema design for inventory analytics + query optimization

**No shipping yet**, just planning for Month 2 admin rollout.

---

## 💡 Strategic Milestones

**After Week 4:**
- VIVENTA becomes "project-capable"
- Constructoras can list multi-unit offerings
- Professional comparative (vs single-unit only)

**After Week 5:**
- VIVENTA developers see "structured financing"
- Marketing becomes sophisticated (promotions visible)
- Trust increases (location verified, offers transparent)

**After Week 6:**
- Foundation ready for Month 2: Verification moat (constructora legitimacy)
- Infrastructure ready for Month 3: Monetization (premium project tiers)

---

## 🎯 Success Criteria

✅ Projects can be created with 50+ units
✅ Unit filtering/sorting instant (<100ms)
✅ Project page mobile-responsive
✅ 95%+ Lighthouse performance
✅ Constructoras can bulk-upload units
✅ "Desde" pricing accurate
✅ All status transitions work
✅ Financing visible + professional
✅ Maps load correctly
✅ WhatsApp CTAs work on project pages
