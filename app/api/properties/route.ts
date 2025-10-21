import { NextResponse } from "next/server";

export async function GET() {
  // TODO: Fetch from Firestore
  return NextResponse.json({
    properties: [
      { id: 1, title: "Modern Apartment", status: "Active", price: 120000, city: "Santo Domingo" },
      { id: 2, title: "Cozy Villa", status: "Pending", price: 250000, city: "Punta Cana" },
      { id: 3, title: "Downtown Loft", status: "Sold", price: 180000, city: "Santiago" },
    ],
  });
}

export async function POST(req: Request) {
  const body = await req.json();
  // TODO: Create property in Firestore
  return NextResponse.json({ success: true, message: "Property created", id: Math.random().toString() });
}
