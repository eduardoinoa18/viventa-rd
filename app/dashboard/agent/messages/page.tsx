"use client";
import React, { useState } from "react";

const mockConversations = [
  { id: 1, name: "Ana Perez", lastMessage: "Looking for a 3BR apartment...", time: "10 min ago", unread: 2 },
  { id: 2, name: "Carlos Gomez", lastMessage: "What's the closing date?", time: "1 hour ago", unread: 0 },
  { id: 3, name: "Lucia Rivera", lastMessage: "Can we schedule a viewing?", time: "2 hours ago", unread: 1 },
];

const mockMessages = [
  { id: 1, sender: "Ana Perez", text: "Looking for a 3BR apartment in Santo Domingo.", time: "10:30 AM", isMe: false },
  { id: 2, sender: "Me", text: "Hi Ana! I have several options. Let me send you some details.", time: "10:32 AM", isMe: true },
  { id: 3, sender: "Ana Perez", text: "Great! I'm looking for something modern.", time: "10:35 AM", isMe: false },
];

export default function AgentMessagesPage() {
  const [activeConvo, setActiveConvo] = useState(mockConversations[0]);
  const [message, setMessage] = useState("");
  const [filter, setFilter] = useState("All");

  const handleSend = () => {
    if (message.trim()) {
      // TODO: POST /api/messages/send
      console.log("Sending:", message);
      setMessage("");
    }
  };

  return (
    <main className="p-6">
      <h2 className="text-2xl font-bold mb-6">Messages & Chat</h2>
      <div className="flex gap-2 mb-4">
        {["All", "Clients", "Brokers", "Support"].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1 rounded ${filter === f ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"}`}>{f}</button>
        ))}
      </div>
      <div className="flex gap-4 h-[600px]">
        {/* Inbox List */}
        <aside className="w-1/3 bg-white rounded-xl shadow overflow-y-auto">
          {mockConversations.map(convo => (
            <div key={convo.id} onClick={() => setActiveConvo(convo)} className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${activeConvo.id === convo.id ? "bg-blue-50" : ""}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold">{convo.name}</span>
                {convo.unread > 0 && <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-0.5">{convo.unread}</span>}
              </div>
              <p className="text-sm text-gray-600 truncate">{convo.lastMessage}</p>
              <p className="text-xs text-gray-400 mt-1">{convo.time}</p>
            </div>
          ))}
        </aside>

        {/* Active Chat */}
        <section className="flex-1 bg-white rounded-xl shadow flex flex-col">
          <div className="p-4 border-b font-semibold text-lg">{activeConvo.name}</div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {mockMessages.map(msg => (
              <div key={msg.id} className={`flex ${msg.isMe ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-xs px-4 py-2 rounded-xl ${msg.isMe ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-800"}`}>
                  <p>{msg.text}</p>
                  <p className={`text-xs mt-1 ${msg.isMe ? "text-blue-100" : "text-gray-500"}`}>{msg.time}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 border-t flex gap-2">
            <input
              type="text"
              placeholder="Type a message..."
              value={message}
              onChange={e => setMessage(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSend()}
              className="flex-1 border rounded-xl px-4 py-2"
            />
            <button className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700">😊</button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700">📎</button>
            <button onClick={handleSend} className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700">Send</button>
          </div>
        </section>
      </div>
    </main>
  );
}
