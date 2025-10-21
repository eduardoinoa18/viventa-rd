import { NextResponse } from "next/server";

export async function GET() {
  // TODO: Fetch from Firestore
  return NextResponse.json({
    conversations: [
      { id: 1, name: "Ana Perez", lastMessage: "Looking for a 3BR apartment...", time: "10 min ago", unread: 2 },
      { id: 2, name: "Carlos Gomez", lastMessage: "What's the closing date?", time: "1 hour ago", unread: 0 },
      { id: 3, name: "Lucia Rivera", lastMessage: "Can we schedule a viewing?", time: "2 hours ago", unread: 1 },
    ],
  });
}

export async function POST(req: Request) {
  const body = await req.json();
  // TODO: Send message via Firestore or WebSocket
  return NextResponse.json({ success: true, message: "Message sent" });
}
