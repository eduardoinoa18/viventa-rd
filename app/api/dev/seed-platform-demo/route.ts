import { NextRequest, NextResponse } from 'next/server'
import { getAdminAuth, getAdminDb } from '@/lib/firebaseAdmin'
import { requireMasterAdmin } from '@/lib/adminApiAuth'

const DEMO_SEED_TAG = 'demo_dr_prime_2026'

function safeText(value: unknown): string {
  return String(value ?? '').trim()
}

type DemoUserInput = {
  role: 'constructora' | 'agent' | 'broker'
  email: string
  password: string
  name: string
  phone: string
  city: string
  areasServed: string
  companyName?: string
  professionalCode: string
  agentCode?: string
  brokerCode?: string
  constructoraCode?: string
}

const DEMO_USERS: DemoUserInput[] = [
  {
    role: 'constructora',
    email: 'constructora.demo@viventa.com',
    password: 'ConstructoraDemo#2026',
    name: 'Caribe Prime Constructora',
    phone: '+1 (809) 555-2101',
    city: 'Santo Domingo',
    areasServed: 'Distrito Nacional, Punta Cana, Santiago',
    companyName: 'Caribe Prime Constructora',
    professionalCode: 'CON-CARIBE-001',
    constructoraCode: 'CON-CARIBE-001',
  },
  {
    role: 'broker',
    email: 'broker.norte.demo@viventa.com',
    password: 'BrokerNorteDemo#2026',
    name: 'Ingrid Santos',
    phone: '+1 (809) 555-3101',
    city: 'Santiago',
    areasServed: 'Santiago, Puerto Plata, Jarabacoa',
    companyName: 'Norte Realty Group',
    professionalCode: 'BRK-NORTE-101',
    brokerCode: 'BRK-NORTE-101',
  },
  {
    role: 'broker',
    email: 'broker.este.demo@viventa.com',
    password: 'BrokerEsteDemo#2026',
    name: 'Luis de León',
    phone: '+1 (809) 555-3102',
    city: 'Punta Cana',
    areasServed: 'Punta Cana, Bávaro, Cap Cana, La Romana',
    companyName: 'Este Luxury Brokers',
    professionalCode: 'BRK-ESTE-201',
    brokerCode: 'BRK-ESTE-201',
  },
  {
    role: 'agent',
    email: 'agent.piantini.demo@viventa.com',
    password: 'AgentPiantiniDemo#2026',
    name: 'María Fernanda López',
    phone: '+1 (809) 555-4101',
    city: 'Santo Domingo',
    areasServed: 'Piantini, Naco, Bella Vista',
    companyName: 'Norte Realty Group',
    professionalCode: 'AGT-PIAN-301',
    agentCode: 'AGT-PIAN-301',
    brokerCode: 'BRK-NORTE-101',
  },
  {
    role: 'agent',
    email: 'agent.capcana.demo@viventa.com',
    password: 'AgentCapCanaDemo#2026',
    name: 'Carlos Eduardo Mejía',
    phone: '+1 (809) 555-4102',
    city: 'Punta Cana',
    areasServed: 'Cap Cana, Punta Cana Village, Bávaro',
    companyName: 'Este Luxury Brokers',
    professionalCode: 'AGT-CAP-302',
    agentCode: 'AGT-CAP-302',
    brokerCode: 'BRK-ESTE-201',
  },
]

const DEMO_LISTINGS = [
  {
    title: 'Penthouse de lujo con vista al mar en Cap Cana',
    city: 'Punta Cana',
    sector: 'Cap Cana Marina',
    location: 'Cap Cana Marina, Punta Cana',
    price: 850000,
    bedrooms: 4,
    bathrooms: 4.5,
    area: 420,
    propertyType: 'penthouse',
    listingType: 'sale',
    lat: 18.5068,
    lng: -68.3832,
    commissionOffered: 4,
    status: 'active',
    featured: true,
    description: 'Penthouse de dos niveles con terraza panorámica, jacuzzi privado y acabados premium. Ideal para inversión de alto valor en zona turística prime.',
    publicRemarks: 'Incluye línea blanca, 3 parqueos, acceso a marina y club de playa.',
    professionalRemarks: 'Propietario flexible para cierre en 30 días. Comisionable al 4%.',
    showingInstructions: 'Cita con 24h de anticipación. Requiere identificación al ingreso.',
    internalNotes: 'Cliente internacional, prioriza compradores cash o preaprobados.',
    privateContactName: 'Ingrid Santos',
    privateContactPhone: '+1 (809) 555-3101',
    privateContactEmail: 'broker.este.demo@viventa.com',
    image: '/demo1.jpg',
  },
  {
    title: 'Apartamento ejecutivo en Piantini con amenidades premium',
    city: 'Santo Domingo',
    sector: 'Piantini',
    location: 'Piantini, Distrito Nacional',
    price: 315000,
    bedrooms: 3,
    bathrooms: 3.5,
    area: 180,
    propertyType: 'apartment',
    listingType: 'sale',
    lat: 18.4701,
    lng: -69.9396,
    commissionOffered: 3,
    status: 'active',
    featured: true,
    description: 'Apartamento moderno con lobby climatizado, gimnasio, rooftop social y seguridad 24/7 en el corazón financiero de Santo Domingo.',
    publicRemarks: 'Excelente ubicación a pasos de centros corporativos y gastronómicos.',
    professionalRemarks: 'Unidad modelo lista para entrega inmediata.',
    showingInstructions: 'Mostrar de lunes a sábado 10:00-6:00 PM.',
    internalNotes: 'Ideal para ejecutivo expatriado o renta corporativa.',
    privateContactName: 'María Fernanda López',
    privateContactPhone: '+1 (809) 555-4101',
    privateContactEmail: 'agent.piantini.demo@viventa.com',
    image: '/demo2.jpg',
  },
  {
    title: 'Villa contemporánea en Punta Cana Village',
    city: 'Punta Cana',
    sector: 'Punta Cana Village',
    location: 'Punta Cana Village, La Altagracia',
    price: 690000,
    bedrooms: 5,
    bathrooms: 5.5,
    area: 510,
    propertyType: 'villa',
    listingType: 'sale',
    lat: 18.5711,
    lng: -68.3648,
    commissionOffered: 4,
    status: 'active',
    featured: true,
    description: 'Residencia nueva de diseño abierto, patio privado y piscina. Terminaciones en mármol y madera natural.',
    publicRemarks: 'Comunidad cerrada, cerca del aeropuerto internacional y playa.',
    professionalRemarks: 'Permite financiamiento con banco local aliado.',
    showingInstructions: 'Coordinar cita 48h antes con broker principal.',
    internalNotes: 'Dueño acepta negociación razonable para cierre rápido.',
    privateContactName: 'Luis de León',
    privateContactPhone: '+1 (809) 555-3102',
    privateContactEmail: 'broker.este.demo@viventa.com',
    image: '/demo3.jpg',
  },
  {
    title: 'Proyecto residencial en Naco con unidades tipo estudio',
    city: 'Santo Domingo',
    sector: 'Naco',
    location: 'Naco, Distrito Nacional',
    price: 145000,
    bedrooms: 1,
    bathrooms: 1,
    area: 62,
    propertyType: 'condo',
    listingType: 'sale',
    lat: 18.4839,
    lng: -69.929,
    commissionOffered: 3,
    status: 'pending',
    featured: false,
    description: 'Concepto urbano para inversión en renta corta y larga con gran potencial de ocupación.',
    publicRemarks: 'Fecha estimada de entrega: Q2 2027.',
    professionalRemarks: 'Inventario inicial con precios de preventa.',
    showingInstructions: 'Presentación virtual + recorrido de showroom.',
    internalNotes: 'Pendiente completar set fotográfico final.',
    privateContactName: 'Caribe Prime Constructora',
    privateContactPhone: '+1 (809) 555-2101',
    privateContactEmail: 'constructora.demo@viventa.com',
    image: '/demo4.jpg',
  },
  {
    title: 'Casa familiar en Cerro Alto, Santiago',
    city: 'Santiago',
    sector: 'Cerro Alto',
    location: 'Cerro Alto, Santiago',
    price: 420000,
    bedrooms: 4,
    bathrooms: 4,
    area: 320,
    propertyType: 'house',
    listingType: 'sale',
    lat: 19.4352,
    lng: -70.7043,
    commissionOffered: 3,
    status: 'active',
    featured: false,
    description: 'Casa de dos niveles con patio, terraza y excelente distribución para familia grande.',
    publicRemarks: 'Urbanización cerrada con control de acceso y áreas verdes.',
    professionalRemarks: 'Cliente motivado, abierto a ofertas.',
    showingInstructions: 'Visitas de 11:00 AM a 5:00 PM con cita.',
    internalNotes: 'Compra ideal para cliente final, no inversionista.',
    privateContactName: 'Ingrid Santos',
    privateContactPhone: '+1 (809) 555-3101',
    privateContactEmail: 'broker.norte.demo@viventa.com',
    image: '/demo5.jpg',
  },
  {
    title: 'Solar premium para desarrollo mixto en Bella Vista',
    city: 'Santo Domingo',
    sector: 'Bella Vista',
    location: 'Bella Vista, Distrito Nacional',
    price: 980000,
    bedrooms: 0,
    bathrooms: 0,
    area: 1450,
    propertyType: 'land',
    listingType: 'sale',
    lat: 18.4497,
    lng: -69.955,
    commissionOffered: 2.5,
    status: 'active',
    featured: false,
    description: 'Terreno estratégico para torre residencial/comercial con frente amplio y excelente conectividad.',
    publicRemarks: 'Zona de alto crecimiento y plusvalía sostenida.',
    professionalRemarks: 'Cuenta con documentación al día y deslinde.',
    showingInstructions: 'Visitas técnicas con ingeniero disponible.',
    internalNotes: 'Prioridad a desarrolladores con carta de intención formal.',
    privateContactName: 'María Fernanda López',
    privateContactPhone: '+1 (809) 555-4101',
    privateContactEmail: 'agent.piantini.demo@viventa.com',
    image: '/demo6.jpg',
  },
  {
    title: 'Condo frente al mar en Juan Dolio',
    city: 'Juan Dolio',
    sector: 'Playa Real',
    location: 'Juan Dolio, San Pedro de Macorís',
    price: 265000,
    bedrooms: 2,
    bathrooms: 2.5,
    area: 132,
    propertyType: 'condo',
    listingType: 'sale',
    lat: 18.4374,
    lng: -69.4341,
    commissionOffered: 3,
    status: 'active',
    featured: true,
    description: 'Condominio amueblado con balcón panorámico, amenidades tipo resort y acceso directo a playa.',
    publicRemarks: 'Excelente opción para renta vacacional.',
    professionalRemarks: 'Ingreso histórico comprobable en plataformas de short-term rent.',
    showingInstructions: 'Disponibilidad limitada fines de semana.',
    internalNotes: 'Se vende con mobiliario completo.',
    privateContactName: 'Luis de León',
    privateContactPhone: '+1 (809) 555-3102',
    privateContactEmail: 'broker.este.demo@viventa.com',
    image: '/demo1.jpg',
  },
  {
    title: 'Apartamento de lujo en La Trinitaria, Santiago',
    city: 'Santiago',
    sector: 'La Trinitaria',
    location: 'La Trinitaria, Santiago',
    price: 355000,
    bedrooms: 3,
    bathrooms: 3,
    area: 205,
    propertyType: 'apartment',
    listingType: 'sale',
    lat: 19.4388,
    lng: -70.6808,
    commissionOffered: 3,
    status: 'active',
    featured: false,
    description: 'Apartamento de alto nivel con diseño contemporáneo, balcón amplio y amenidades familiares.',
    publicRemarks: 'Ubicación premium con rápida conexión a vías principales.',
    professionalRemarks: 'Unidad con alta demanda en segmento familiar premium.',
    showingInstructions: 'Cita previa con 12h de antelación.',
    internalNotes: 'Incluir estrategia de pricing competitivo al presentar.',
    privateContactName: 'Ingrid Santos',
    privateContactPhone: '+1 (809) 555-3101',
    privateContactEmail: 'broker.norte.demo@viventa.com',
    image: '/demo2.jpg',
  },
  {
    title: 'Villa boutique en Las Terrenas para inversión turística',
    city: 'Las Terrenas',
    sector: 'Playa Bonita',
    location: 'Playa Bonita, Samaná',
    price: 575000,
    bedrooms: 4,
    bathrooms: 4,
    area: 350,
    propertyType: 'villa',
    listingType: 'sale',
    lat: 19.3223,
    lng: -69.5562,
    commissionOffered: 4,
    status: 'active',
    featured: true,
    description: 'Villa tropical con piscina privada y diseño caribeño premium a minutos de Playa Bonita.',
    publicRemarks: 'Zona de alta demanda internacional.',
    professionalRemarks: 'Ideal para buyer inversionista en hospitality.',
    showingInstructions: 'Tour virtual previo recomendado para leads internacionales.',
    internalNotes: 'Propietario acepta estructura de pago mixta.',
    privateContactName: 'Carlos Eduardo Mejía',
    privateContactPhone: '+1 (809) 555-4102',
    privateContactEmail: 'agent.capcana.demo@viventa.com',
    image: '/demo3.jpg',
  },
  {
    title: 'Local comercial estratégico en Ensanche Naco',
    city: 'Santo Domingo',
    sector: 'Ensanche Naco',
    location: 'Ensanche Naco, Distrito Nacional',
    price: 245000,
    bedrooms: 0,
    bathrooms: 1,
    area: 118,
    propertyType: 'commercial',
    listingType: 'sale',
    lat: 18.483,
    lng: -69.925,
    commissionOffered: 2.5,
    status: 'active',
    featured: false,
    description: 'Local comercial en avenida de alto tránsito con excelente visibilidad y flujo de clientes.',
    publicRemarks: 'Apto para consultorio, showroom o oficina boutique.',
    professionalRemarks: 'Documentación lista para cierre inmediato.',
    showingInstructions: 'Coordinar visita fuera de horario pico.',
    internalNotes: 'Ideal para clientes corporativos con expansión en DN.',
    privateContactName: 'María Fernanda López',
    privateContactPhone: '+1 (809) 555-4101',
    privateContactEmail: 'agent.piantini.demo@viventa.com',
    image: '/demo4.jpg',
  },
]

function userDocFromInput(input: DemoUserInput, uid: string, linkedBrokerId?: string) {
  return {
    uid,
    email: input.email.toLowerCase(),
    name: input.name,
    role: input.role,
    status: 'active',
    profileComplete: true,
    city: input.city,
    areasServed: input.areasServed,
    phone: input.phone,
    companyName: input.companyName || '',
    professionalCode: input.professionalCode,
    agentCode: input.agentCode || '',
    brokerCode: input.brokerCode || '',
    constructoraCode: input.constructoraCode || '',
    brokerId: linkedBrokerId || '',
    emailVerified: true,
    identityVerified: true,
    activeSubscription: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    isDemo: true,
    demoSeedTag: DEMO_SEED_TAG,
  }
}

export async function POST(req: NextRequest) {
  try {
    if (process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production') {
      return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 })
    }

    const authError = await requireMasterAdmin(req)
    if (authError) return authError

    const adminAuth = getAdminAuth()
    const adminDb = getAdminDb()
    if (!adminAuth || !adminDb) {
      return NextResponse.json({ ok: false, error: 'Admin SDK not configured' }, { status: 500 })
    }

    const payload = await req.json().catch(() => ({} as any))
    const reset = payload?.reset === true

    if (reset) {
      const oldListings = await adminDb.collection('properties').where('demoSeedTag', '==', DEMO_SEED_TAG).get()
      await Promise.all(oldListings.docs.map((doc) => doc.ref.delete()))
    }

    const userMap = new Map<string, { uid: string; input: DemoUserInput }>()

    for (const input of DEMO_USERS) {
      let record
      try {
        record = await adminAuth.getUserByEmail(input.email)
      } catch {
        record = await adminAuth.createUser({
          email: input.email,
          password: input.password,
          displayName: input.name,
          emailVerified: true,
          disabled: false,
        })
      }

      await adminAuth.setCustomUserClaims(record.uid, { role: input.role }).catch(() => null)
      userMap.set(input.email, { uid: record.uid, input })
    }

    const brokerNorteUid = userMap.get('broker.norte.demo@viventa.com')?.uid || ''
    const brokerEsteUid = userMap.get('broker.este.demo@viventa.com')?.uid || ''

    for (const entry of Array.from(userMap.values())) {
      const linkedBrokerId =
        entry.input.role === 'agent'
          ? entry.input.brokerCode === 'BRK-NORTE-101'
            ? brokerNorteUid
            : brokerEsteUid
          : ''

      await adminDb
        .collection('users')
        .doc(entry.uid)
        .set(userDocFromInput(entry.input, entry.uid, linkedBrokerId), { merge: true })
    }

    const listingOwners = [
      userMap.get('agent.piantini.demo@viventa.com')?.uid,
      userMap.get('agent.capcana.demo@viventa.com')?.uid,
      userMap.get('broker.norte.demo@viventa.com')?.uid,
      userMap.get('broker.este.demo@viventa.com')?.uid,
      userMap.get('constructora.demo@viventa.com')?.uid,
    ].filter(Boolean) as string[]

    const existingListings = await adminDb.collection('properties').where('demoSeedTag', '==', DEMO_SEED_TAG).get()
    const existingByTitle = new Map(existingListings.docs.map((doc) => [String(doc.data().title || ''), doc.ref]))

    let created = 0
    let updated = 0

    for (let index = 0; index < DEMO_LISTINGS.length; index++) {
      const row = DEMO_LISTINGS[index]
      const ownerUid = listingOwners[index % listingOwners.length]
      const ownerUser = ownerUid ? await adminDb.collection('users').doc(ownerUid).get() : null
      const owner = ownerUser?.data() as any

      const constructoraName =
        safeText(owner?.role) === 'constructora'
          ? safeText(owner?.companyName || owner?.name)
          : 'Caribe Prime Constructora'

      const payloadDoc = {
        listingId: `DEMO-${String(index + 1).padStart(3, '0')}`,
        title: row.title,
        description: row.description,
        publicRemarks: row.publicRemarks,
        professionalRemarks: row.professionalRemarks,
        internalNotes: row.internalNotes,
        price: row.price,
        currency: 'USD',
        location: row.location,
        city: row.city,
        sector: row.sector,
        neighborhood: row.sector,
        lat: row.lat,
        lng: row.lng,
        bedrooms: row.bedrooms,
        bathrooms: row.bathrooms,
        area: row.area,
        propertyType: row.propertyType,
        listingType: row.listingType,
        images: [row.image],
        coverImage: row.image,
        features: ['Seguridad 24/7', 'Parqueo', 'Ubicación Prime', 'Alta Plusvalía'],
        maintenanceFee: Math.round(row.price * 0.0012),
        maintenanceFeeCurrency: 'USD',
        mlsOnly: true,
        commissionOffered: row.commissionOffered,
        cobrokeCommissionPercent: row.commissionOffered,
        showingInstructions: row.showingInstructions,
        privateContactName: row.privateContactName,
        privateContactPhone: row.privateContactPhone,
        privateContactEmail: row.privateContactEmail,
        status: row.status,
        featured: row.featured,
        createdByUserId: ownerUid,
        ownerId: ownerUid,
        agentId: ownerUid,
        agentName: owner?.name || row.privateContactName,
        agentEmail: owner?.email || row.privateContactEmail,
        ownerRole: owner?.role || '',
        professionalCode: owner?.professionalCode || '',
        agentCode: owner?.agentCode || '',
        brokerCode: owner?.brokerCode || '',
        constructoraCode: owner?.constructoraCode || '',
        brokerName: owner?.brokerCode ? owner?.companyName || owner?.name : row.privateContactName,
        companyName: owner?.companyName || '',
        builderName: constructoraName,
        constructora: constructoraName,
        views: Math.floor(Math.random() * 400) + 45,
        favoriteCount: Math.floor(Math.random() * 70) + 8,
        createdAt: new Date(),
        updatedAt: new Date(),
        isDemo: true,
        demoSeedTag: DEMO_SEED_TAG,
      }

      const existingRef = existingByTitle.get(row.title)
      if (existingRef) {
        await existingRef.set(payloadDoc, { merge: true })
        updated++
      } else {
        await adminDb.collection('properties').add(payloadDoc)
        created++
      }
    }

    return NextResponse.json({
      ok: true,
      message: 'Demo platform seeded successfully',
      summary: {
        users: DEMO_USERS.length,
        listingsCreated: created,
        listingsUpdated: updated,
      },
      credentials: DEMO_USERS.map((user) => ({
        role: user.role,
        email: user.email,
        password: user.password,
        name: user.name,
      })),
    })
  } catch (error) {
    console.error('Seed demo platform failed', error)
    return NextResponse.json({ ok: false, error: 'Internal error' }, { status: 500 })
  }
}
