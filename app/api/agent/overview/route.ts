import { NextResponse } from "next/server";

export async function GET() {
  // TODO: Fetch from Firestore
  return NextResponse.json({
    activeListings: 12,
    totalLeads: 48,
    conversionRate: "27%",
    clientReviews: "4.8 / 5",
  });
}
