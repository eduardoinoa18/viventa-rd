import { cookies } from 'next/headers';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { algoliaClient } from '@/lib/algoliaClient';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/sync-search
 * Syncs all active properties to Algolia search index
 * Admin only
 */
export async function POST() {
  try {
    const cookieStore = await cookies();
    const role = cookieStore.get('viventa_role')?.value;

    if (!role || !['admin', 'master_admin'].includes(role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminDb = getAdminDb();
    if (!adminDb) {
      return NextResponse.json({ error: 'Firebase Admin not initialized' }, { status: 500 });
    }

    const propertiesRef = adminDb.collection('properties');
    const snapshot = await propertiesRef.where('status', '==', 'active').get();

    if (snapshot.empty) {
      return NextResponse.json({ message: 'No active properties to sync', count: 0 });
    }

    const index = algoliaClient.initIndex('properties');
    const records = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        objectID: doc.id,
        listingId: data.listingId || doc.id,
        title: data.title || 'Sin título',
        location: data.location || '',
        city: data.city || '',
        neighborhood: data.neighborhood || '',
        price: data.price || 0,
        currency: data.currency || 'USD',
        priceUSD: data.currency === 'USD' ? data.price : Math.round((data.price || 0) / 58),
        area: data.area || 0,
        bedrooms: data.bedrooms || 0,
        bathrooms: data.bathrooms || 0,
        propertyType: data.propertyType || 'Residencial',
        listingType: data.listingType || 'Venta',
        status: data.status || 'active',
        featured: data.featured || false,
        images: data.images || [],
        publicRemarks: data.publicRemarks || '',
        amenities: data.amenities || [],
        agentId: data.agentId || '',
        agentName: data.agentName || '',
        createdAt: data.createdAt?._seconds || Date.now() / 1000,
        updatedAt: data.updatedAt?._seconds || Date.now() / 1000,
      };
    });

    await index.saveObjects(records);

    return NextResponse.json({
      message: 'Properties synced to Algolia successfully',
      count: records.length,
    });
  } catch (error: unknown) {
    console.error('Algolia sync error:', error);
    return NextResponse.json(
      { error: 'Failed to sync properties', details: (error as Error).message },
      { status: 500 }
    );
  }
}
