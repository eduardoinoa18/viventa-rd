import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebaseAdmin'
import { AdminAuthError, requireMasterAdmin } from '@/lib/requireMasterAdmin'
import { sendEmail } from '@/lib/emailService'
import { getPublicAppUrl } from '@/lib/publicAppUrl'
import { getBuyerMatches, normalizeBuyerCriteria } from '@/lib/crmBuyerMatching'

export const dynamic = 'force-dynamic'

function currency(value?: number): string {
  if (!value || Number.isNaN(value)) return 'Price on request'
  return `$${value.toLocaleString()}`
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireMasterAdmin(req)

    const adminDb = getAdminDb()
    if (!adminDb) {
      return NextResponse.json({ ok: false, error: 'Admin SDK not configured' }, { status: 503 })
    }

    const buyerId = params.id
    const buyerSnap = await adminDb.collection('users').doc(buyerId).get()
    if (!buyerSnap.exists) {
      return NextResponse.json({ ok: false, error: 'Buyer not found' }, { status: 404 })
    }

    const buyer = buyerSnap.data() as any
    if (buyer.role !== 'buyer') {
      return NextResponse.json({ ok: false, error: 'User is not a buyer' }, { status: 400 })
    }

    const email = String(buyer.email || '').trim().toLowerCase()
    if (!email) {
      return NextResponse.json({ ok: false, error: 'Buyer email is missing' }, { status: 400 })
    }

    const criteria = normalizeBuyerCriteria((buyer.criteria || {}) as Record<string, any>)
    const result = await getBuyerMatches(adminDb, criteria, 6)
    const listings = result.listings

    const baseUrl = getPublicAppUrl()

    const cards = listings
      .map((listing) => {
        const location = [listing.city, listing.sector].filter(Boolean).join(', ')
        const verifiedBadge = listing.verified
          ? '<span style="display:inline-block;background:#ecfdf5;color:#047857;padding:4px 8px;border-radius:999px;font-size:11px;font-weight:700;">Viventa Verified</span>'
          : ''
        return `
          <div style="border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;margin-bottom:16px;">
            <div style="height:180px;background:#f3f4f6;display:flex;align-items:center;justify-content:center;">
              ${listing.image ? `<img src="${listing.image}" alt="${listing.title}" style="width:100%;height:100%;object-fit:cover;" />` : '<span style="color:#9ca3af;">No Image</span>'}
            </div>
            <div style="padding:16px;">
              <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;">
                <h3 style="margin:0;color:#0B2545;font-size:16px;">${listing.title}</h3>
                ${verifiedBadge}
              </div>
              <p style="margin:8px 0;color:#6b7280;font-size:13px;">${location || 'Dominican Republic'}</p>
              <p style="margin:6px 0;color:#0B2545;font-weight:700;">${currency(listing.price)}</p>
              <p style="margin:6px 0;color:#4b5563;font-size:12px;">${listing.bedrooms} beds • ${listing.bathrooms} baths • ${listing.squareMeters} m²</p>
              <p style="margin:6px 0;color:#4b5563;font-size:12px;">Price/m²: ${listing.pricePerM2 ? `$${listing.pricePerM2.toLocaleString()}` : 'N/A'}</p>
              <a href="${baseUrl}/listing/${listing.id}" style="display:inline-block;margin-top:10px;background:#00A676;color:white;text-decoration:none;padding:10px 14px;border-radius:8px;font-size:12px;font-weight:700;">View Listing</a>
            </div>
          </div>
        `
      })
      .join('')

    const buyerName = String(buyer.name || 'Buyer')
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:720px;margin:0 auto;">
        <div style="background:linear-gradient(135deg,#0B2545 0%,#00A676 100%);padding:20px;border-radius:12px 12px 0 0;color:#fff;">
          <h1 style="margin:0;font-size:24px;">Your Viventa Property Matches</h1>
          <p style="margin:8px 0 0;opacity:.95;">Curated based on your preferences</p>
        </div>
        <div style="border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;padding:20px;">
          <p style="margin:0 0 12px;color:#111827;">Hi ${buyerName},</p>
          <p style="margin:0 0 16px;color:#374151;">We found ${listings.length} listings that match your criteria on Viventa.</p>
          ${cards || '<p style="color:#6b7280;">No listings available right now. We will continue monitoring new properties for you.</p>'}
          <p style="margin-top:18px;color:#6b7280;font-size:12px;">This update is powered by Viventa CRM matching.</p>
          ${result.warning ? `<p style="margin-top:6px;color:#9ca3af;font-size:11px;">${result.warning}</p>` : ''}
        </div>
      </div>
    `

    await sendEmail({
      to: email,
      subject: 'New Property Matches for You · Viventa',
      html,
      from: 'noreply@viventa.com',
    })

    return NextResponse.json({
      ok: true,
      data: {
        buyerId,
        sentTo: email,
        listingsCount: listings.length,
      },
      message: 'Matches email sent successfully',
    })
  } catch (error: any) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json(
        { ok: false, error: error.message, code: error.code },
        { status: error.status }
      )
    }

    console.error('[crm/buyers/[id]/send-matches] error:', error)
    return NextResponse.json({ ok: false, error: 'Failed to send matches email' }, { status: 500 })
  }
}