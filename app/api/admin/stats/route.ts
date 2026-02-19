// app/api/admin/stats/route.ts
import { NextResponse } from 'next/server'
import { initializeApp, getApps } from 'firebase/app'
import { getFirestore, collection, getCountFromServer, query, where } from 'firebase/firestore'
import { getAdminDb } from '@/lib/firebaseAdmin'
import { Timestamp as AdminTimestamp } from 'firebase-admin/firestore'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const windowParam = (searchParams.get('window') || 'all').toLowerCase()
    const now = new Date()
    const thresholdMap: Record<string, number> = {
      day: 24 * 60 * 60 * 1000,
      week: 7 * 24 * 60 * 60 * 1000,
      month: 30 * 24 * 60 * 60 * 1000,
      all: Infinity,
    }
    const rangeMs = thresholdMap[windowParam] ?? Infinity
    const hasWindow = Number.isFinite(rangeMs)
    const sinceDate = hasWindow ? new Date(Date.now() - rangeMs) : null
    // Prefer Admin SDK for accurate counts without client auth
    const adminDb = getAdminDb()
    if (adminDb) {

      const [
        usersSnap,
        activePropsSnap,
        pendingPropsSnap,
        rejectedPropsSnap,
        draftPropsSnap,
        leadsSnap,
        applicationsSnap,
        agentsSnap,
        brokersSnap,
        regularUsersSnap,
        adminsSnap,
        // Analytics for DAU/WAU/MAU
        dailyActiveSnap,
        weeklyActiveSnap,
        monthlyActiveSnap,
        // Property views
        propertyViewsSnap,
        // Contact submissions
        contactsSnap,
        inquiriesSnap,
      ] = await Promise.all([
        adminDb.collection('users').get(),
        adminDb.collection('properties').where('status', '==', 'active').get(),
        adminDb.collection('properties').where('status', '==', 'pending').get(),
        adminDb.collection('properties').where('status', '==', 'rejected').get(),
        adminDb.collection('properties').where('status', '==', 'draft').get(),
        adminDb.collection('leads').get(),
        adminDb.collection('applications').where('status', '==', 'pending').get(),
        adminDb.collection('users').where('role', '==', 'agent').get(),
        adminDb.collection('users').where('role', '==', 'broker').get(),
        adminDb.collection('users').where('role', '==', 'user').get(),
        adminDb.collection('users').where('role', 'in', ['admin','master_admin']).get(),
        // DAU
        adminDb.collection('analytics_events')
          .where('timestamp', '>=', AdminTimestamp.fromDate(new Date(Date.now() - 24 * 60 * 60 * 1000)))
          .get(),
        // WAU
        adminDb.collection('analytics_events')
          .where('timestamp', '>=', AdminTimestamp.fromDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)))
          .get(),
        // MAU
        adminDb.collection('analytics_events')
          .where('timestamp', '>=', AdminTimestamp.fromDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)))
          .get(),
        // Property views (last 30 days)
        // NOTE: Avoid composite index by querying by timestamp only and filtering in-memory
        adminDb.collection('analytics_events')
          .where('timestamp', '>=', AdminTimestamp.fromDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)))
          .get(),
        // Contact submissions
        adminDb.collection('contacts').get(),
        adminDb.collection('inquiries').get(),
      ])

      // Window-based counts
      let newUsersCount = 0
      let newListingsCount = 0
      let newLeadsCount = 0
      let windowViews = 0
      let windowContacts = 0
      let windowInquiries = 0
      let windowLeads = 0
      if (hasWindow && sinceDate) {
        const [usersCreatedSnap, listingsCreatedSnap] = await Promise.all([
          adminDb.collection('users').where('createdAt', '>=', AdminTimestamp.fromDate(sinceDate)).get(),
          adminDb.collection('properties').where('createdAt', '>=', AdminTimestamp.fromDate(sinceDate)).get(),
        ])
        newUsersCount = usersCreatedSnap.size || 0
        newListingsCount = listingsCreatedSnap.size || 0

        // Windowed leads (in-memory filter on aggregated leads collection)
        windowLeads = leadsSnap.docs.filter((d: any) => {
          const created = d.data()?.createdAt?.toDate?.() || null
          return created && created >= sinceDate
        }).length
        newLeadsCount = windowLeads
      }
      // (Keep processing within adminDb branch)

      // Calculate unique active users
      const dauUsers = new Set()
      dailyActiveSnap.docs.forEach((doc: any) => {
        const data = doc.data()
        if (data.userId) dauUsers.add(data.userId)
      })

      const wauUsers = new Set()
      weeklyActiveSnap.docs.forEach((doc: any) => {
        const data = doc.data()
        if (data.userId) wauUsers.add(data.userId)
      })

      const mauUsers = new Set()
      monthlyActiveSnap.docs.forEach((doc: any) => {
        const data = doc.data()
        if (data.userId) mauUsers.add(data.userId)
      })

      // Calculate property view stats
      // Filter to listing_view events in-memory to avoid composite index requirement
      const listingViewDocs = propertyViewsSnap.docs.filter((doc: any) => doc.data()?.eventType === 'listing_view')
      const propertyViews = listingViewDocs.length
      if (hasWindow && sinceDate) {
        const windowListingViewDocs = listingViewDocs.filter((doc: any) => {
          const ts = doc.data()?.timestamp?.toDate?.() || null
          return ts && ts >= sinceDate
        })
        windowViews = windowListingViewDocs.length
      } else {
        windowViews = propertyViews
      }
      const uniqueViewers = new Set()
      const propertyViewCounts: { [key: string]: number } = {}
      
      listingViewDocs.forEach((doc: any) => {
        const data = doc.data()
        if (data.userId) uniqueViewers.add(data.userId)
        if (data.metadata?.listingId) {
          const id = data.metadata.listingId
          propertyViewCounts[id] = (propertyViewCounts[id] || 0) + 1
        }
      })

      // Top viewed properties
      const topViewedProperties = Object.entries(propertyViewCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([id, count]) => ({ propertyId: id, views: count }))

      // Conversion funnel
      const totalViews = propertyViews
      const totalContacts = contactsSnap.size + inquiriesSnap.size
      const totalLeads = leadsSnap.size
      const conversionRate = totalViews > 0 ? ((totalContacts / totalViews) * 100).toFixed(2) : '0.00'
      const leadConversionRate = totalContacts > 0 ? ((totalLeads / totalContacts) * 100).toFixed(2) : '0.00'

      // Windowed contact + inquiry counts (in-memory filtering)
      if (hasWindow && sinceDate) {
        windowContacts = contactsSnap.docs.filter((d: any) => {
          const c = d.data()?.createdAt?.toDate?.() || null
          return c && c >= sinceDate
        }).length
        windowInquiries = inquiriesSnap.docs.filter((d: any) => {
          const c = d.data()?.createdAt?.toDate?.() || null
          return c && c >= sinceDate
        }).length
        // windowLeads computed earlier as newLeadsCount
      } else {
        windowContacts = contactsSnap.size
        windowInquiries = inquiriesSnap.size
        windowLeads = totalLeads
      }
      const windowTotalContacts = windowContacts + windowInquiries
      const windowViewToContactRate = windowViews > 0 ? ((windowTotalContacts / windowViews) * 100).toFixed(2) : '0.00'
      const windowContactToLeadRate = windowTotalContacts > 0 ? ((windowLeads / windowTotalContacts) * 100).toFixed(2) : '0.00'

      return NextResponse.json({
        ok: true,
        data: {
          totalUsers: usersSnap.size || 0,
          activeListings: activePropsSnap.size || 0,
          pendingApprovals: pendingPropsSnap.size || 0,
          rejectedProperties: rejectedPropsSnap.size || 0,
          draftProperties: draftPropsSnap.size || 0,
          leads: leadsSnap.size || 0,
          newLeads: newLeadsCount,
          monthlyRevenueUSD: 0,
          pendingApplications: applicationsSnap.size || 0,
          window: hasWindow ? windowParam : 'all',
          newUsers: newUsersCount,
          listingsCreated: newListingsCount,
          roleCounts: {
            agents: agentsSnap.size || 0,
            brokers: brokersSnap.size || 0,
            users: regularUsersSnap.size || 0,
            admins: adminsSnap.size || 0,
          },
          userEngagement: {
            dau: dauUsers.size,
            wau: wauUsers.size,
            mau: mauUsers.size,
            dauPercentage: usersSnap.size > 0 ? ((dauUsers.size / usersSnap.size) * 100).toFixed(1) : '0.0',
            wauPercentage: usersSnap.size > 0 ? ((wauUsers.size / usersSnap.size) * 100).toFixed(1) : '0.0',
            mauPercentage: usersSnap.size > 0 ? ((mauUsers.size / usersSnap.size) * 100).toFixed(1) : '0.0',
          },
          propertyMetrics: {
            totalViews: propertyViews,
            uniqueViewers: uniqueViewers.size,
            avgViewsPerProperty: activePropsSnap.size > 0 ? (propertyViews / activePropsSnap.size).toFixed(1) : '0.0',
            topViewedProperties,
          },
          conversionMetrics: {
            totalViews,
            totalContacts,
            totalLeads,
            viewToContactRate: conversionRate + '%',
            contactToLeadRate: leadConversionRate + '%',
            window: {
              views: windowViews,
              contacts: windowTotalContacts,
              leads: windowLeads,
              viewToContactRate: windowViewToContactRate + '%',
              contactToLeadRate: windowContactToLeadRate + '%',
            },
          },
        },
      })
    }

    // Initialize Firebase for server-side if needed
    const firebaseConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    }
    const valid = Boolean(
      firebaseConfig.apiKey &&
      firebaseConfig.authDomain &&
      firebaseConfig.projectId &&
      firebaseConfig.storageBucket &&
      firebaseConfig.messagingSenderId &&
      firebaseConfig.appId
    )

    if (!valid) {
      return NextResponse.json({
        ok: true,
        data: {
          totalUsers: 0,
          activeListings: 0,
          pendingApprovals: 0,
          leads: 0,
          monthlyRevenueUSD: 0,
        },
        note: 'Firebase not configured on server; returning zeros',
      })
    }

    if (!getApps().length) {
      initializeApp(firebaseConfig as any)
    }
  const db = getFirestore()
    // Count users (all-time)
    const usersColl = collection(db, 'users')
    const usersSnap = await getCountFromServer(usersColl)

    // Count active listings
  const propsActiveQ = query(collection(db, 'properties'), where('status', '==', 'active'))
  const propsActiveSnap = await getCountFromServer(propsActiveQ)

    // Count pending approvals (properties pending)
  const propsPendingQ = query(collection(db, 'properties'), where('status', '==', 'pending'))
  const propsPendingSnap = await getCountFromServer(propsPendingQ)

    // Leads count
    const leadsColl = collection(db, 'leads')
    const leadsSnap = await getCountFromServer(leadsColl)

    // Window-based counts (client SDK fallback: we won't implement due to index/SDK overhead)
    const window = hasWindow ? windowParam : 'all'

    // Monthly revenue placeholder (integrate Stripe later)
    const monthlyRevenueUSD = 0

    // Role counts with client SDK are heavier; skip in fallback to avoid complex indexes
    return NextResponse.json({
      ok: true,
      data: {
        totalUsers: usersSnap.data().count || 0,
        activeListings: propsActiveSnap.data().count || 0,
        pendingApprovals: propsPendingSnap.data().count || 0,
        leads: leadsSnap.data().count || 0,
        monthlyRevenueUSD,
        window,
        newUsers: 0,
        listingsCreated: 0,
        newLeads: 0,
      },
    })
  } catch (e) {
    console.error('admin stats error', e)
    return NextResponse.json({ ok: false, error: 'Failed to load stats' }, { status: 500 })
  }
}
