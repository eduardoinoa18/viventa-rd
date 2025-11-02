"use client"

export default function ListingDetail({ listing }: { listing: any }) {
  if (!listing) return null
  const img = listing.images?.[0]
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="h-72 bg-gray-100 rounded">
        {img && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img} alt="" className="w-full h-full object-cover rounded" />
        )}
      </div>
      <div>
        <h2 className="text-xl font-semibold">{listing.title}</h2>
        <div className="mt-2 text-green-700 font-semibold">USD {listing.price}</div>
        <p className="mt-3 text-gray-700">{listing.description || '—'}</p>
      </div>
    </div>
  )
}
