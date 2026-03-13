/**
 * VIVENTA RD — Full Platform Demo Seed Script
 * Run: npx ts-node --project tsconfig.scripts.json scripts/seed.ts
 *
 * Requires a valid Firebase service-account JSON at:
 *   GOOGLE_APPLICATION_CREDENTIALS env var  OR
 *   ./service-account.json (gitignored)
 *
 * What this seeds:
 *  • 1  Constructora  (developer)  account + profile
 *  • 2  Broker        accounts + profiles
 *  • 3  Agent         accounts + profiles
 *  • 10 Premium DR    listings (draft → active) assigned to the above
 */

import * as admin from 'firebase-admin'
import * as fs from 'fs'
import * as path from 'path'

// ─── Init ────────────────────────────────────────────────────────────────────

function initAdmin() {
  if (admin.apps.length) return

  const saPath = path.resolve(__dirname, '../service-account.json')
  if (fs.existsSync(saPath)) {
    const sa = JSON.parse(fs.readFileSync(saPath, 'utf8'))
    admin.initializeApp({ credential: admin.credential.cert(sa) })
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    admin.initializeApp({ credential: admin.credential.applicationDefault() })
  } else {
    throw new Error(
      'No Firebase credentials found.\n' +
      'Place service-account.json in project root OR set GOOGLE_APPLICATION_CREDENTIALS.'
    )
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function ts() {
  return admin.firestore.FieldValue.serverTimestamp()
}

function randId() {
  return Math.random().toString(36).slice(2, 10)
}

/** Unsplash curated real-estate photos (stable IDs, 800×600 crop) */
const PHOTO_SETS = {
  penthouse: [
    'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=1200&q=80',
    'https://images.unsplash.com/photo-1600607687939-ce8a6d349a58?w=1200&q=80',
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&q=80',
  ],
  villa: [
    'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=1200&q=80',
    'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200&q=80',
    'https://images.unsplash.com/photo-1505843513577-22bb7d21e455?w=1200&q=80',
  ],
  condo: [
    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&q=80',
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&q=80',
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&q=80',
  ],
  land: [
    'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200&q=80',
    'https://images.unsplash.com/photo-1440342359743-84fcb8c21f21?w=1200&q=80',
  ],
  apartment: [
    'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=1200&q=80',
    'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=1200&q=80',
    'https://images.unsplash.com/photo-1554995207-c18c203602cb?w=1200&q=80',
  ],
}

// ─── Demo Users ───────────────────────────────────────────────────────────────

const CONSTRUCTORA = {
  uid: 'demo-constructora-001',
  email: 'constructoras@viventa.demo',
  password: 'Demo@Viventa2026!',
  displayName: 'Caribeño Group RD — Demo',
  role: 'constructora',
  constructoraCode: 'CARIB-001',
  companyName: 'Caribeño Group RD',
  phone: '+1-809-555-0100',
  website: 'https://caribeno.demo',
  bio: 'Desarrolladora líder en proyectos residenciales y turísticos en el Caribe dominicano. Con más de 20 años de trayectoria y más de 3,000 unidades entregadas.',
  logoUrl: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=400&q=80',
  province: 'La Altagracia',
  city: 'Punta Cana',
  verified: true,
  plan: 'enterprise',
}

const BROKERS = [
  {
    uid: 'demo-broker-001',
    email: 'broker1@viventa.demo',
    password: 'Demo@Viventa2026!',
    displayName: 'Carlos Martínez Peña',
    role: 'broker',
    slug: 'carlos-martinez-pena',
    officeId: 'office-001',
    officeName: 'Realty Quisqueya',
    phone: '+1-809-555-0201',
    licenseNumber: 'RD-BRK-2021-0042',
    bio: 'Corredor certificado con 12 años de experiencia en el mercado inmobiliario del Distrito Nacional y el Este. Especialista en inversiones cap-cana y turísticas.',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',
    province: 'Distrito Nacional',
    city: 'Santo Domingo',
    languages: ['Español', 'English'],
    totalSalesVolume: 12500000,
    verified: true,
    plan: 'pro',
  },
  {
    uid: 'demo-broker-002',
    email: 'broker2@viventa.demo',
    password: 'Demo@Viventa2026!',
    displayName: 'María Elena Suárez',
    role: 'broker',
    slug: 'maria-elena-suarez',
    officeId: 'office-002',
    officeName: 'Luxury Homes Caribe',
    phone: '+1-809-555-0202',
    licenseNumber: 'RD-BRK-2019-0017',
    bio: 'Especialista en propiedades de lujo y villas turísticas en Cap Cana, Casa de Campo y Bávaro. Representación bilingüe para compradores internacionales.',
    photoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80',
    province: 'La Romana',
    city: 'La Romana',
    languages: ['Español', 'English', 'Français'],
    totalSalesVolume: 21800000,
    verified: true,
    plan: 'elite',
  },
]

const AGENTS = [
  {
    uid: 'demo-agent-001',
    email: 'agent1@viventa.demo',
    password: 'Demo@Viventa2026!',
    displayName: 'Jorge Luis Familia',
    role: 'agent',
    slug: 'jorge-luis-familia',
    brokerId: 'demo-broker-001',
    officeName: 'Realty Quisqueya',
    phone: '+1-809-555-0301',
    licenseNumber: 'RD-AGT-2022-0188',
    bio: 'Agente especializado en propiedades residenciales en Santo Domingo Este y Punta Cana. Enfocado en primeros compradores e inversiones de corto plazo.',
    photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80',
    province: 'Santo Domingo',
    city: 'Santo Domingo Este',
    languages: ['Español'],
    totalSalesVolume: 3200000,
    verified: true,
    plan: 'basic',
  },
  {
    uid: 'demo-agent-002',
    email: 'agent2@viventa.demo',
    password: 'Demo@Viventa2026!',
    displayName: 'Valeria Rojas Castro',
    role: 'agent',
    slug: 'valeria-rojas-castro',
    brokerId: 'demo-broker-002',
    officeName: 'Luxury Homes Caribe',
    phone: '+1-809-555-0302',
    licenseNumber: 'RD-AGT-2023-0057',
    bio: 'Agente junior con enfoque en alquileres vacacionales y propiedades de pre-construcción en el corredor turístico de La Romana – Bayahíbe.',
    photoUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&q=80',
    province: 'La Romana',
    city: 'Bayahíbe',
    languages: ['Español', 'English'],
    totalSalesVolume: 1100000,
    verified: false,
    plan: 'basic',
  },
  {
    uid: 'demo-agent-003',
    email: 'agent3@viventa.demo',
    password: 'Demo@Viventa2026!',
    displayName: 'Roberto Almonte Díaz',
    role: 'agent',
    slug: 'roberto-almonte-diaz',
    brokerId: 'demo-broker-001',
    officeName: 'Realty Quisqueya',
    phone: '+1-809-555-0303',
    licenseNumber: 'RD-AGT-2021-0124',
    bio: 'Agente senior especializado en inversiones en la zona colonial y negocios comerciales en el Área Metropolitana de Santo Domingo.',
    photoUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&q=80',
    province: 'Distrito Nacional',
    city: 'Santo Domingo',
    languages: ['Español', 'English'],
    totalSalesVolume: 4750000,
    verified: true,
    plan: 'pro',
  },
]

// ─── Listings ─────────────────────────────────────────────────────────────────

const LISTINGS = [
  {
    id: 'listing-001',
    title: 'Penthouse de Lujo con Vista al Mar — Cap Cana',
    description:
      'Espectacular penthouse de 4 habitaciones ubicado en la exclusiva zona de Cap Cana, con vistas panorámicas al océano Atlántico. Acabados europeos de primera calidad: pisos de mármol italiano, cocina Modulnova, piscina privada en terraza y sistema de domótica completo. A 5 minutos de la Marina de Cap Cana y a 15 del Aeropuerto Internacional de Punta Cana. Ideal para uso personal o como inversión de alto rendimiento en el mercado de alquiler vacacional.',
    publicRemarks:
      'Penthouse premium en Cap Cana. Piscina privada, vistas al mar, acabados europeos. Entrega inmediata.',
    price: 2_450_000,
    currency: 'USD',
    propertyType: 'penthouse',
    listingType: 'sale',
    bedrooms: 4,
    bathrooms: 4.5,
    area: 380,
    parking: 2,
    maintenanceFee: 1200,
    maintenanceFeeCurrency: 'USD',
    hoaIncludedItems: ['Agua', 'Seguridad 24/7', 'Piscina comunitaria', 'Gimnasio'],
    city: 'Cap Cana',
    sector: 'Marina Zone',
    province: 'La Altagracia',
    address: 'Cap Cana Marina, La Altagracia 23000',
    lat: 18.5258,
    lng: -68.3708,
    deslindadoStatus: 'deslindado',
    furnishedStatus: 'amueblado',
    features: ['Piscina Privada', 'Vista al Mar', 'Terraza', 'Jacuzzi', 'Domótica', 'Gym', 'Concierge'],
    images: PHOTO_SETS.penthouse,
    coverImage: PHOTO_SETS.penthouse[0],
    status: 'active',
    mlsOnly: false,
    cobrokeCommissionPercent: 3,
    commissionType: 'cobroke',
    showingInstructions: 'Contactar con 24hr de anticipación. Acceso con guardia de seguridad requerido. Preguntar por Ing. Ramírez en la caseta.',
    internalNotes: 'Vendedor motivado. Acepta oferta a partir de USD 2.2M. Propietario ecuatoriano, representado por su abogado local. No divulgar información de precio sin CAPC firmado.',
    privateContactName: 'María Elena Suárez',
    privateContactPhone: '+1-809-555-0202',
    privateContactEmail: 'broker2@viventa.demo',
    agentId: 'demo-agent-002',
    createdByUserId: 'demo-broker-002',
    brokerId: 'office-002',
    brokerName: 'Luxury Homes Caribe',
    isVerified: true,
    qualityScore: 97,
    visibilityScore: 95,
    featured_until: new Date('2026-09-30'),
  },
  {
    id: 'listing-002',
    title: 'Villa Beachfront 6 Hab. — Casa de Campo, La Romana',
    description:
      'Exclusiva villa frente al mar en el resort privado Casa de Campo, La Romana. La propiedad cuenta con 6 suites master con baño en suite, sala de estar formal e informal, sala de juegos, cine privado, piscina infinity a nivel del mar, muelles privados con capacidad para embarcaciones de hasta 50 pies, y personal de servicio completo incluido. Seguridad 24/7 dentro del resort.',
    publicRemarks:
      'Villa beachfront de 6 habitaciones en Casa de Campo. Piscina infinity, muelle privado. Propiedad de resort de clase mundial.',
    price: 8_900_000,
    currency: 'USD',
    propertyType: 'villa',
    listingType: 'sale',
    bedrooms: 6,
    bathrooms: 7,
    area: 1200,
    parking: 4,
    maintenanceFee: 8500,
    maintenanceFeeCurrency: 'USD',
    hoaIncludedItems: ['Seguridad', 'Campo de Golf', 'Beach Club', 'Mantenimiento de jardines'],
    city: 'La Romana',
    sector: 'Casa de Campo',
    province: 'La Romana',
    address: 'Casa de Campo Resort, La Romana 22000',
    lat: 18.4247,
    lng: -68.9622,
    deslindadoStatus: 'deslindado',
    furnishedStatus: 'amueblado',
    features: ['Frente al Mar', 'Muelle Privado', 'Piscina Infinity', 'Cine Privado', 'Golf Access', 'Helipad'],
    images: PHOTO_SETS.villa,
    coverImage: PHOTO_SETS.villa[0],
    status: 'active',
    mlsOnly: true,
    cobrokeCommissionPercent: 2.5,
    commissionType: 'cobroke',
    showingInstructions: 'Tour por invitación únicamente. Requiere NDA previo. Coordinar con la oficina de la correduría con 48hr de anticipación mínima.',
    internalNotes: 'Estate sale. Tres herederos, proceso legal abierto. Tasación más reciente: $9.4M (2025). Urgencia de cierre antes de Q3-2026. Comisión negociable en cierre over asking.',
    privateContactName: 'María Elena Suárez',
    privateContactPhone: '+1-809-555-0202',
    privateContactEmail: 'broker2@viventa.demo',
    agentId: 'demo-agent-002',
    createdByUserId: 'demo-broker-002',
    brokerId: 'office-002',
    brokerName: 'Luxury Homes Caribe',
    isVerified: true,
    qualityScore: 99,
    visibilityScore: 98,
    featured_until: new Date('2026-12-31'),
  },
  {
    id: 'listing-003',
    title: 'Apartamento moderno 3 Hab. — Piantini, Santo Domingo',
    description:
      'Moderno apartamento ubicado en el corazón de Piantini, la zona más cotizada del Distrito Nacional. Edificio boutique de 8 pisos con solo 2 unidades por planta, balcón corrido con vista a la ciudad, cocina completamente equipada con electrodomésticos Miele, pisos de porcelanato italiano y espacios de almacenamiento abundantes. A 3 minutos del Ágora Mall y colegios top del sector.',
    publicRemarks:
      'Apartamento de lujo en Piantini. 3 habitaciones, balcón, edificio boutique. Excelente ubicación.',
    price: 320_000,
    currency: 'USD',
    propertyType: 'apartment',
    listingType: 'sale',
    bedrooms: 3,
    bathrooms: 2.5,
    area: 185,
    parking: 2,
    maintenanceFee: 18500,
    maintenanceFeeCurrency: 'DOP',
    hoaIncludedItems: ['Agua', 'Seguridad', 'Área de lavandería', 'Terraza común'],
    city: 'Santo Domingo',
    sector: 'Piantini',
    province: 'Distrito Nacional',
    address: 'Av. Gustavo Mejía Ricart, Piantini, Santo Domingo 10148',
    lat: 18.4753,
    lng: -69.9370,
    deslindadoStatus: 'deslindado',
    furnishedStatus: 'semi-amueblado',
    features: ['Balcón', 'Vista a la Ciudad', 'Lobby 24/7', 'Roof Garden Privado'],
    images: PHOTO_SETS.apartment,
    coverImage: PHOTO_SETS.apartment[0],
    status: 'active',
    mlsOnly: false,
    cobrokeCommissionPercent: 3,
    commissionType: 'cobroke',
    showingInstructions: 'Disponible para visitas lunes-sábado 9am-6pm. Coordinación directa al contacto del listado.',
    internalNotes: 'Propietario transfirió al extranjero; quiere cerrar en 60 días. Precio tasado en $348,000 — hay margen para negociar.',
    privateContactName: 'Carlos Martínez Peña',
    privateContactPhone: '+1-809-555-0201',
    privateContactEmail: 'broker1@viventa.demo',
    agentId: 'demo-agent-001',
    createdByUserId: 'demo-broker-001',
    brokerId: 'office-001',
    brokerName: 'Realty Quisqueya',
    isVerified: true,
    qualityScore: 91,
    visibilityScore: 88,
  },
  {
    id: 'listing-004',
    title: 'Solar Frente a la Playa 3,200 m² — Bávaro, Punta Cana',
    description:
      'Terreno excepcional de 3,200 m² con frente de playa de 40 metros lineales en la zona de Bávaro. Zonificado turístico (ZT-3), permite construcción de hotel boutique, residencias vacacionales o villa privada de gran escala. Todos los servicios disponibles: agua, luz, internet y acceso vial pavimentado. A 20 minutos del aeropuerto y colindante con desarrollo hotelero de 5 estrellas.',
    publicRemarks:
      'Solar frente al mar en Bávaro, 3,200 m². Zonificación turística. Ideal para villa privada u hotel boutique.',
    price: 1_850_000,
    currency: 'USD',
    propertyType: 'land',
    listingType: 'sale',
    bedrooms: 0,
    bathrooms: 0,
    area: 3200,
    parking: 0,
    city: 'Bávaro',
    sector: 'Playa Arena Gorda',
    province: 'La Altagracia',
    address: 'Carretera Bávaro km 2.4, La Altagracia',
    lat: 18.7052,
    lng: -68.4530,
    deslindadoStatus: 'deslindado',
    furnishedStatus: 'sin-amueblar',
    features: ['Frente al Mar', 'Zona Turística', 'Deslindado', 'Acceso Vial', 'Servicios Completos'],
    images: PHOTO_SETS.land,
    coverImage: PHOTO_SETS.land[0],
    status: 'active',
    mlsOnly: true,
    cobrokeCommissionPercent: 4,
    commissionType: 'cobroke',
    showingInstructions: 'Visita sin cita previa permitida. Coordinar con agente para acceso al tramo de playa. Traer mapas catastrales si es cliente constructor.',
    internalNotes: 'Vendedor acepta cartas de intención. Proceso de due diligence puede comenzar sin oferta formal. Hay 2 interesados activos en negociación.',
    privateContactName: 'Roberto Almonte Díaz',
    privateContactPhone: '+1-809-555-0303',
    privateContactEmail: 'agent3@viventa.demo',
    agentId: 'demo-agent-003',
    createdByUserId: 'demo-broker-001',
    brokerId: 'office-001',
    brokerName: 'Realty Quisqueya',
    isVerified: true,
    qualityScore: 85,
    visibilityScore: 82,
  },
  {
    id: 'listing-005',
    title: 'Condo en Pre-Construcción 2 Hab.— Caribeño Residences Punta Cana',
    description:
      'Unidad de 2 habitaciones en el proyecto Caribeño Residences Punta Cana, desarrollado por Caribeño Group RD. El complejo incluye 4 torres de 12 pisos con amenidades de resort: piscinas, spa, restaurantes, playa privada y área de kids club. Entrega proyectada Q4-2027. Plan de pago: 30% inicial, 40% durante construcción, 30% en entrega.',
    publicRemarks:
      'Pre-construcción en Punta Cana. 2 hab., complejo resort, entrega Q4-2027. Plan de pago flexible.',
    price: 189_000,
    currency: 'USD',
    propertyType: 'condo',
    listingType: 'sale',
    bedrooms: 2,
    bathrooms: 2,
    area: 102,
    parking: 1,
    maintenanceFee: 320,
    maintenanceFeeCurrency: 'USD',
    hoaIncludedItems: ['Piscinas', 'Spa', 'Beach Club', 'Seguridad'],
    city: 'Punta Cana',
    sector: 'Cabeza de Toro',
    province: 'La Altagracia',
    address: 'Caribeño Residences, Cabeza de Toro, La Altagracia 23000',
    lat: 18.7158,
    lng: -68.4672,
    deslindadoStatus: 'en-proceso',
    furnishedStatus: 'sin-amueblar',
    features: ['Pre-construcción', 'Resort Amenities', 'Playa Privada', 'Kids Club', 'Spa', 'Restaurante'],
    images: PHOTO_SETS.condo,
    coverImage: PHOTO_SETS.condo[0],
    status: 'active',
    mlsOnly: false,
    cobrokeCommissionPercent: 5,
    commissionType: 'cobroke',
    showingInstructions: 'Tour de modelo disponible martes, jueves y sábados 10am-3pm en la sala de ventas Caribeño. No requiere cita.',
    internalNotes: 'Proyecto de constructora CARIB-001. Inventario limitado de unidades 2BR — solo 8 disponibles. Comisión del 5% garantizada en escritura. No negociar precio base; hay descuentos pre-aprobados por floor y orientación.',
    privateContactName: 'Caribeño Group RD — Ventas',
    privateContactPhone: '+1-809-555-0100',
    privateContactEmail: 'constructoras@viventa.demo',
    agentId: 'demo-agent-001',
    createdByUserId: 'demo-constructora-001',
    constructoraCode: 'CARIB-001',
    constructora: 'Caribeño Group RD',
    projectId: 'project-carib-residences-001',
    inventoryMode: 'project',
    totalUnits: 48,
    availableUnits: 8,
    soldUnits: 40,
    isVerified: true,
    qualityScore: 93,
    visibilityScore: 96,
    featured_until: new Date('2027-01-15'),
  },
  {
    id: 'listing-006',
    title: 'Penthouse 3 Hab. Rooftop Pool — Naco, Santo Domingo',
    description:
      'Excepcional penthouse doble en edificio de lujo en Naco, Distrito Nacional. Terraza privada de 120 m² con piscina plunge, outdoor lounge y vistas a 360° de la ciudad. Interior de 210 m² con sala de doble altura, cocina de isla con acabados Poliform, 3 habitaciones en suite, cuarto de servicio y sala de estar secundaria. Dirección premium, acceso a lobby de conserje.',
    publicRemarks:
      'Penthouse en Naco con terraza + piscina privada. 3 suites, vista panorámica ciudad. Lujo sin igual.',
    price: 780_000,
    currency: 'USD',
    propertyType: 'penthouse',
    listingType: 'sale',
    bedrooms: 3,
    bathrooms: 3.5,
    area: 330,
    parking: 3,
    maintenanceFee: 45000,
    maintenanceFeeCurrency: 'DOP',
    hoaIncludedItems: ['Seguridad', 'Concierge', 'Cuarto de basura', 'Generador'],
    city: 'Santo Domingo',
    sector: 'Naco',
    province: 'Distrito Nacional',
    address: 'Calle Gustavo Mejía Ricart 74, Naco, Distrito Nacional 10147',
    lat: 18.4799,
    lng: -69.9247,
    deslindadoStatus: 'deslindado',
    furnishedStatus: 'amueblado',
    features: ['Piscina Privada en Terraza', 'Vista Panorámica', 'Doble Altura', 'Concierge', 'Cuarto de Servicio'],
    images: PHOTO_SETS.penthouse,
    coverImage: PHOTO_SETS.penthouse[1],
    status: 'active',
    mlsOnly: true,
    cobrokeCommissionPercent: 2,
    commissionType: 'cobroke',
    showingInstructions: 'Disponible para mostrar solo a compradores calificados con carta bancaria o prueba de fondos. Coordinar exclusivamente por WhatsApp al número del listado.',
    internalNotes: 'Comprador ideal: ejecutivo expatriado o dominicano regresando del exterior. El propietario bajó de $850,000 y no bajará de $750,000. Urgencia media. Banco preaprueba financiamiento hasta el 70%.',
    privateContactName: 'Jorge Luis Familia',
    privateContactPhone: '+1-809-555-0301',
    privateContactEmail: 'agent1@viventa.demo',
    agentId: 'demo-agent-001',
    createdByUserId: 'demo-broker-001',
    brokerId: 'office-001',
    brokerName: 'Realty Quisqueya',
    isVerified: true,
    qualityScore: 94,
    visibilityScore: 90,
  },
  {
    id: 'listing-007',
    title: 'Villa de 5 Hab. con Golf View — Puntacana Village',
    description:
      'Hermosa villa contemporánea dentro del exclusivo Puntacana Village, a metros del campo de golf Punta Espada y La Cana. La propiedad de 580 m² ofrece 5 habitaciones, sala de estar y comedor en planta abierta, piscina desbordante rodeada de jardines tropicales, cocina de chef con isla central, bodega climatizada y terraza panorámica con vista al fairway.',
    publicRemarks:
      'Villa con golf view en Puntacana Village, 5 hab., piscina, jardines tropicales. Estilo de vida de resort.',
    price: 3_200_000,
    currency: 'USD',
    propertyType: 'villa',
    listingType: 'sale',
    bedrooms: 5,
    bathrooms: 5.5,
    area: 580,
    parking: 3,
    maintenanceFee: 4200,
    maintenanceFeeCurrency: 'USD',
    hoaIncludedItems: ['Mantenimiento de jardinería', 'Seguridad perimetral', 'Acceso a Club de Playa'],
    city: 'Punta Cana',
    sector: 'Puntacana Village',
    province: 'La Altagracia',
    address: 'Puntacana Village, La Altagracia 23000',
    lat: 18.5519,
    lng: -68.3640,
    deslindadoStatus: 'deslindado',
    furnishedStatus: 'amueblado',
    features: ['Golf View', 'Piscina', 'Jardín Tropical', 'Bodega', 'Terraza Panorámica', 'Seguridad 24/7'],
    images: PHOTO_SETS.villa,
    coverImage: PHOTO_SETS.villa[1],
    status: 'active',
    mlsOnly: true,
    cobrokeCommissionPercent: 3,
    commissionType: 'cobroke',
    showingInstructions: 'Acceso por portón principal de Puntacana Village. Identificación requerida. Tour disponible con cita, mínimo 48hr de anticipación.',
    internalNotes: 'Propietario abierto a leaseback por 12 meses post-cierre. Rentabilidad bruta estimada: 8% anual. Excelente candidata para programa de rental pool de PHVC.',
    privateContactName: 'Valeria Rojas Castro',
    privateContactPhone: '+1-809-555-0302',
    privateContactEmail: 'agent2@viventa.demo',
    agentId: 'demo-agent-002',
    createdByUserId: 'demo-broker-002',
    brokerId: 'office-002',
    brokerName: 'Luxury Homes Caribe',
    isVerified: true,
    qualityScore: 96,
    visibilityScore: 94,
  },
  {
    id: 'listing-008',
    title: 'Apartamento 1 Hab. en Alquiler — Los Cacicazgos, Santo Domingo',
    description:
      'Moderno apartamento de 1 habitación en Los Cacicazgos, totalmente amueblado y equipado. Ideal para ejecutivos o jóvenes profesionales. Edificio con seguridad 24/7, área de BBQ, piscina y coworking. A 5 minutos de Plaza Central, CCSD y múltiples restaurantes. Incluye servicio de internet de fibra 600Mbps y un parqueo cubierto.',
    publicRemarks:
      'Alquiler: apto 1 hab. en Los Cacicazgos. Amueblado, piscina, coworking. Disponible de inmediato.',
    price: 1_450,
    currency: 'USD',
    propertyType: 'apartment',
    listingType: 'rent',
    bedrooms: 1,
    bathrooms: 1,
    area: 78,
    parking: 1,
    maintenanceFee: 0,
    city: 'Santo Domingo',
    sector: 'Los Cacicazgos',
    province: 'Distrito Nacional',
    address: 'Av. Cayetano Germosén, Los Cacicazgos, D.N.',
    lat: 18.4662,
    lng: -69.9542,
    deslindadoStatus: 'deslindado',
    furnishedStatus: 'amueblado',
    features: ['Amueblado', 'Piscina', 'Coworking', 'Fibra 600Mbps', 'Seguridad 24/7'],
    images: PHOTO_SETS.apartment,
    coverImage: PHOTO_SETS.apartment[1],
    status: 'active',
    mlsOnly: false,
    cobrokeCommissionPercent: 50,
    commissionType: 'rental-split',
    showingInstructions: 'Disponible para mostrar de lunes a sábado 9am-7pm. Cita no requerida.',
    internalNotes: 'Propietario quiere inquilino de largo plazo (mínimo 1 año). Acepta mascotas pequeñas con depósito adicional. Primer mes + 2 meses de depósito al inicio.',
    privateContactName: 'Roberto Almonte Díaz',
    privateContactPhone: '+1-809-555-0303',
    privateContactEmail: 'agent3@viventa.demo',
    agentId: 'demo-agent-003',
    createdByUserId: 'demo-broker-001',
    brokerId: 'office-001',
    brokerName: 'Realty Quisqueya',
    isVerified: true,
    qualityScore: 82,
    visibilityScore: 79,
  },
  {
    id: 'listing-009',
    title: 'Condo Frente al Mar 2 Hab.— Residencias Playa Nueva Romana',
    description:
      'Residencia frente al mar en el complejo Playa Nueva Romana, La Romana. Apartamento de 2 habitaciones en piso 7 con balcón corrido frente al Caribe, acceso directo a playa privada de arena blanca, piscina infinita con borde en el mar, restaurante y bar de playa. Turnkey — completamente amueblado con diseño de interiores caribeño contemporáneo.',
    publicRemarks:
      'Condo frente al mar en La Romana. 2 hab., balcón, piscina infinity, playa privada. Turnkey.',
    price: 495_000,
    currency: 'USD',
    propertyType: 'condo',
    listingType: 'sale',
    bedrooms: 2,
    bathrooms: 2,
    area: 135,
    parking: 1,
    maintenanceFee: 680,
    maintenanceFeeCurrency: 'USD',
    hoaIncludedItems: ['Playa Privada', 'Piscina Infinity', 'Restaurante', 'Bar de Playa', 'Seguridad'],
    city: 'La Romana',
    sector: 'Playa Nueva Romana',
    province: 'La Romana',
    address: 'Playa Nueva Romana Resort, La Romana 22000',
    lat: 18.4159,
    lng: -68.9773,
    deslindadoStatus: 'deslindado',
    furnishedStatus: 'amueblado',
    features: ['Frente al Mar', 'Playa Privada', 'Piscina Infinity', 'Bar de Playa', 'Turnkey'],
    images: PHOTO_SETS.condo,
    coverImage: PHOTO_SETS.condo[1],
    status: 'active',
    mlsOnly: true,
    cobrokeCommissionPercent: 3,
    commissionType: 'cobroke',
    showingInstructions: 'Tour disponible cualquier día 9am-4pm. Registrarse en la recepción del resort.',
    internalNotes: 'Excelente candidata para programa de rental pool. Rendimiento anual proyectado: 9.5%. El vendedor transfirió y debe cerrar antes de junio.',
    privateContactName: 'Valeria Rojas Castro',
    privateContactPhone: '+1-809-555-0302',
    privateContactEmail: 'agent2@viventa.demo',
    agentId: 'demo-agent-002',
    createdByUserId: 'demo-broker-002',
    brokerId: 'office-002',
    brokerName: 'Luxury Homes Caribe',
    isVerified: true,
    qualityScore: 95,
    visibilityScore: 93,
  },
  {
    id: 'listing-010',
    title: 'Penthouse Duplex 4 Hab. — Blue Mall Residences, Santo Domingo',
    description:
      'Penthouse duplex de última generación en la torre residencial de Blue Mall, Piantini. Planta abierta de 420 m² más terraza privada de 180 m² con piscina, jacuzzi outdoor y lounge. Cocina italiana Boffi, sistema Bang & Olufsen, closets walk-in en cada habitación, sala de cine, cuarto de staff con baño. Vista a la ciudad y al mar Caribe en días despejados. Acceso exclusivo por ascensor privado.',
    publicRemarks:
      'Penthouse duplex en Blue Mall Residences. 4 hab., terraza 180m², piscina. Acceso privado. Lo mejor de Santo Domingo.',
    price: 1_900_000,
    currency: 'USD',
    propertyType: 'penthouse',
    listingType: 'sale',
    bedrooms: 4,
    bathrooms: 5,
    area: 420,
    parking: 4,
    maintenanceFee: 95000,
    maintenanceFeeCurrency: 'DOP',
    hoaIncludedItems: ['Concierge 24/7', 'Valet Parking', 'Seguridad Perimetral', 'Piscina Común', 'Spa'],
    city: 'Santo Domingo',
    sector: 'Piantini',
    province: 'Distrito Nacional',
    address: 'Blue Mall Tower, Av. Winston Churchill, Piantini, Santo Domingo',
    lat: 18.4741,
    lng: -69.9400,
    deslindadoStatus: 'deslindado',
    furnishedStatus: 'amueblado',
    features: ['Piscina Privada', 'Jacuzzi', 'Vista al Mar', 'Cine Privado', 'Ascensor Privado', 'Bang & Olufsen', 'Valet'],
    images: PHOTO_SETS.penthouse,
    coverImage: PHOTO_SETS.penthouse[2],
    status: 'active',
    mlsOnly: true,
    cobrokeCommissionPercent: 2,
    commissionType: 'cobroke',
    showingInstructions: 'Acceso exclusivo con escolta de seguridad. Reserva previa obligatoria. Solo se muestran compradores con carta de preaprobación o prueba de fondos. Contactar a Roberto Almonte para coordinar.',
    internalNotes: 'La propiedad sigue ocupada. Necesita 30 días para desalojar post-cierre. Precio final negociable de $1.75M. Hay un proceso de herencia internacional que requiere validación notarial adicional pero no bloquea la venta.',
    privateContactName: 'Roberto Almonte Díaz',
    privateContactPhone: '+1-809-555-0303',
    privateContactEmail: 'agent3@viventa.demo',
    agentId: 'demo-agent-003',
    createdByUserId: 'demo-broker-001',
    brokerId: 'office-001',
    brokerName: 'Realty Quisqueya',
    isVerified: true,
    qualityScore: 98,
    visibilityScore: 97,
    featured_until: new Date('2026-12-31'),
  },
]

// ─── Seeder Functions ─────────────────────────────────────────────────────────

async function upsertFirebaseUser(uid: string, email: string, password: string, displayName: string, role: string) {
  const auth = admin.auth()
  try {
    await auth.updateUser(uid, { email, displayName })
    console.log(`  ↳ Updated Firebase Auth user: ${email}`)
  } catch {
    try {
      await auth.createUser({ uid, email, password, displayName })
      console.log(`  ↳ Created Firebase Auth user: ${email}`)
    } catch (err: any) {
      if (err.code === 'auth/uid-already-exists') {
        console.log(`  ↳ Existing user skipped: ${email}`)
      } else {
        throw err
      }
    }
  }
  await auth.setCustomUserClaims(uid, { role })
}

async function seedConstructora(db: admin.firestore.Firestore) {
  console.log('\n[1/4] Seeding Constructora...')
  const u = CONSTRUCTORA
  await upsertFirebaseUser(u.uid, u.email, u.password, u.displayName, u.role)

  await db.collection('users').doc(u.uid).set({
    uid: u.uid,
    email: u.email,
    displayName: u.displayName,
    role: u.role,
    constructoraCode: u.constructoraCode,
    companyName: u.companyName,
    phone: u.phone,
    website: u.website,
    bio: u.bio,
    logoUrl: u.logoUrl,
    province: u.province,
    city: u.city,
    verified: u.verified,
    plan: u.plan,
    createdAt: ts(),
    updatedAt: ts(),
  }, { merge: true })

  await db.collection('constructoras').doc(u.uid).set({
    uid: u.uid,
    constructoraCode: u.constructoraCode,
    companyName: u.companyName,
    displayName: u.displayName,
    email: u.email,
    phone: u.phone,
    website: u.website,
    bio: u.bio,
    logoUrl: u.logoUrl,
    province: u.province,
    city: u.city,
    verified: u.verified,
    plan: u.plan,
    totalProjects: 1,
    totalUnits: 48,
    deliveredUnits: 0,
    createdAt: ts(),
    updatedAt: ts(),
  }, { merge: true })

  console.log(`  ✓ Constructora seeded: ${u.email}  (password: ${u.password})`)
}

async function seedBrokers(db: admin.firestore.Firestore) {
  console.log('\n[2/4] Seeding Brokers...')
  for (const b of BROKERS) {
    await upsertFirebaseUser(b.uid, b.email, b.password, b.displayName, b.role)

    await db.collection('users').doc(b.uid).set({
      uid: b.uid,
      email: b.email,
      displayName: b.displayName,
      role: b.role,
      slug: b.slug,
      officeId: b.officeId,
      officeName: b.officeName,
      phone: b.phone,
      licenseNumber: b.licenseNumber,
      bio: b.bio,
      photoUrl: b.photoUrl,
      province: b.province,
      city: b.city,
      languages: b.languages,
      totalSalesVolume: b.totalSalesVolume,
      verified: b.verified,
      plan: b.plan,
      createdAt: ts(),
      updatedAt: ts(),
    }, { merge: true })

    await db.collection('professionals').doc(b.uid).set({
      uid: b.uid,
      email: b.email,
      displayName: b.displayName,
      role: b.role,
      slug: b.slug,
      officeId: b.officeId,
      officeName: b.officeName,
      phone: b.phone,
      licenseNumber: b.licenseNumber,
      bio: b.bio,
      photoUrl: b.photoUrl,
      province: b.province,
      city: b.city,
      languages: b.languages,
      totalSalesVolume: b.totalSalesVolume,
      verified: b.verified,
      plan: b.plan,
      createdAt: ts(),
      updatedAt: ts(),
    }, { merge: true })

    console.log(`  ✓ Broker seeded: ${b.email}  (password: ${b.password})`)
  }
}

async function seedAgents(db: admin.firestore.Firestore) {
  console.log('\n[3/4] Seeding Agents...')
  for (const a of AGENTS) {
    await upsertFirebaseUser(a.uid, a.email, a.password, a.displayName, a.role)

    await db.collection('users').doc(a.uid).set({
      uid: a.uid,
      email: a.email,
      displayName: a.displayName,
      role: a.role,
      slug: a.slug,
      brokerId: a.brokerId,
      officeName: a.officeName,
      phone: a.phone,
      licenseNumber: a.licenseNumber,
      bio: a.bio,
      photoUrl: a.photoUrl,
      province: a.province,
      city: a.city,
      languages: a.languages,
      totalSalesVolume: a.totalSalesVolume,
      verified: a.verified,
      plan: a.plan,
      createdAt: ts(),
      updatedAt: ts(),
    }, { merge: true })

    await db.collection('professionals').doc(a.uid).set({
      uid: a.uid,
      email: a.email,
      displayName: a.displayName,
      role: a.role,
      slug: a.slug,
      brokerId: a.brokerId,
      officeName: a.officeName,
      phone: a.phone,
      licenseNumber: a.licenseNumber,
      bio: a.bio,
      photoUrl: a.photoUrl,
      province: a.province,
      city: a.city,
      languages: a.languages,
      totalSalesVolume: a.totalSalesVolume,
      verified: a.verified,
      plan: a.plan,
      createdAt: ts(),
      updatedAt: ts(),
    }, { merge: true })

    console.log(`  ✓ Agent seeded: ${a.email}  (password: ${a.password})`)
  }
}

async function seedListings(db: admin.firestore.Firestore) {
  console.log('\n[4/4] Seeding Listings...')

  for (const l of LISTINGS) {
    const publicData = {
      listingId: l.id,
      title: l.title,
      description: l.description,
      publicRemarks: l.publicRemarks,
      price: l.price,
      currency: l.currency,
      propertyType: l.propertyType,
      listingType: l.listingType,
      bedrooms: l.bedrooms,
      bathrooms: l.bathrooms,
      area: l.area,
      parking: l.parking ?? 0,
      maintenanceFee: l.maintenanceFee ?? 0,
      maintenanceFeeCurrency: l.maintenanceFeeCurrency ?? 'USD',
      hoaIncludedItems: l.hoaIncludedItems ?? [],
      city: l.city,
      sector: l.sector,
      province: l.province,
      address: l.address,
      lat: l.lat,
      lng: l.lng,
      deslindadoStatus: l.deslindadoStatus,
      furnishedStatus: l.furnishedStatus,
      features: l.features ?? [],
      images: l.images ?? [],
      coverImage: l.coverImage ?? '',
      status: l.status,
      mlsOnly: l.mlsOnly ?? false,
      cobrokeCommissionPercent: l.cobrokeCommissionPercent ?? 0,
      commissionType: (l as any).commissionType ?? 'cobroke',
      agentId: l.agentId,
      createdByUserId: l.createdByUserId,
      brokerId: l.brokerId ?? '',
      brokerName: l.brokerName ?? '',
      constructoraCode: (l as any).constructoraCode ?? '',
      constructora: (l as any).constructora ?? '',
      projectId: (l as any).projectId ?? '',
      inventoryMode: (l as any).inventoryMode ?? 'single',
      totalUnits: (l as any).totalUnits ?? 0,
      availableUnits: (l as any).availableUnits ?? 0,
      soldUnits: (l as any).soldUnits ?? 0,
      isVerified: l.isVerified ?? false,
      qualityScore: l.qualityScore ?? 0,
      visibilityScore: l.visibilityScore ?? 0,
      featured_until: l.featured_until ?? null,
      views: 0,
      // internal fields — readable only by auth'd professionals
      showingInstructions: l.showingInstructions,
      internalNotes: l.internalNotes,
      privateContactName: l.privateContactName,
      privateContactPhone: l.privateContactPhone,
      privateContactEmail: l.privateContactEmail,
      // approval workflow
      submittedAt: ts(),
      approvedAt: ts(),
      approvedBy: 'system-seed',
      approvalNotes: 'Seeded demo listing — auto-approved.',
      createdAt: ts(),
      updatedAt: ts(),
    }

    await db.collection('properties').doc(l.id).set(publicData, { merge: true })
    console.log(`  ✓ Listing seeded: ${l.id} — ${l.title.slice(0, 60)}`)
  }
}

// ─── Run ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('╔══════════════════════════════════════════════════════════╗')
  console.log('║  VIVENTA RD — Full Platform Demo Seed                    ║')
  console.log('╚══════════════════════════════════════════════════════════╝')

  initAdmin()
  const db = admin.firestore()

  await seedConstructora(db)
  await seedBrokers(db)
  await seedAgents(db)
  await seedListings(db)

  console.log('\n╔══════════════════════════════════════════════════════════╗')
  console.log('║  ✅ Seed complete!                                        ║')
  console.log('╟──────────────────────────────────────────────────────────╢')
  console.log('║  Accounts created / updated:                             ║')
  console.log('║    constructoras@viventa.demo    Demo@Viventa2026!        ║')
  console.log('║    broker1@viventa.demo          Demo@Viventa2026!        ║')
  console.log('║    broker2@viventa.demo          Demo@Viventa2026!        ║')
  console.log('║    agent1@viventa.demo           Demo@Viventa2026!        ║')
  console.log('║    agent2@viventa.demo           Demo@Viventa2026!        ║')
  console.log('║    agent3@viventa.demo           Demo@Viventa2026!        ║')
  console.log('║  10 listings written to: properties/listing-001..010     ║')
  console.log('╚══════════════════════════════════════════════════════════╝\n')

  process.exit(0)
}

main().catch((err) => {
  console.error('\n❌ Seed failed:', err)
  process.exit(1)
})
