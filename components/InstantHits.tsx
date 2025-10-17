"use client"
import { Hits, Pagination } from 'react-instantsearch'
import HitCard from './HitCard'

export default function InstantHits() {
  return (
    <div className="space-y-3">
      <Hits hitComponent={HitCard as any} />
      <Pagination />
    </div>
  )
}
