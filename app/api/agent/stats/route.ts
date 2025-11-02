import { NextResponse } from "next/server";

export async function GET() {
  // TODO: Fetch from Firestore
  return NextResponse.json({
    leadsVsDeals: [
      { month: "Jan", leads: 45, deals: 12 },
      { month: "Feb", leads: 52, deals: 14 },
      { month: "Mar", leads: 48, deals: 13 },
      { month: "Apr", leads: 60, deals: 16 },
      { month: "May", leads: 55, deals: 15 },
      { month: "Jun", leads: 48, deals: 13 },
    ],
    viewsByCity: [
      { name: "Santo Domingo", value: 400 },
      { name: "Punta Cana", value: 300 },
      { name: "Santiago", value: 200 },
      { name: "La Romana", value: 100 },
    ],
    trafficSource: [
      { name: "Zillow", value: 35 },
      { name: "Website", value: 40 },
      { name: "Social Media", value: 25 },
    ],
    revenueProjection: [
      { month: "Jan", revenue: 50000 },
      { month: "Feb", revenue: 55000 },
      { month: "Mar", revenue: 52000 },
      { month: "Apr", revenue: 60000 },
      { month: "May", revenue: 58000 },
      { month: "Jun", revenue: 62000 },
    ],
  });
}
