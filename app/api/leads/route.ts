import { NextResponse } from "next/server";

export async function GET() {
  // TODO: Fetch from Firestore
  return NextResponse.json({
    leads: [
      { id: 1, name: "Ana Perez", tag: "Buyer", status: "New" },
      { id: 2, name: "Carlos Gomez", tag: "Seller", status: "Contacted" },
      { id: 3, name: "Lucia Rivera", tag: "Investor", status: "Appointment" },
    ],
  });
}

export async function POST(req: Request) {
  const body = await req.json();
  // TODO: Update lead status in Firestore
  return NextResponse.json({ success: true, message: "Lead updated" });
}
