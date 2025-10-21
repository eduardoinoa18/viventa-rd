import { NextResponse } from 'next/server'

export async function GET(){
  // Demo widgets
  return NextResponse.json({
    listings: 5,
    leads: 12,
    sales: 3,
    commissions: 18500
  })
}
