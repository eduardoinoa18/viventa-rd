// Stage 1: Edit page (Modal-driven workflow coming in Stage 2)
// Currently redirects to admin edit for stability
// TODO Stage 2: Convert to native modal with shared form components

'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function EditListingPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  useEffect(() => {
    // Stage 1: Redirect to admin edit (functional, stable)
    // Stage 2: Will replace with modal-driven edit form
    if (id) {
      router.push(`/admin/properties/${id}/edit`)
    }
  }, [id, router])

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            Redirecting to edit...
          </h3>
          <p className="text-blue-800">
            Stage 1 uses legacy admin edit for stability. Redirecting now.
          </p>
        </div>
      </div>
    </div>
  )
}
