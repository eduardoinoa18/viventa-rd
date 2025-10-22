"use client";
import React, { useState, useEffect } from "react";
import { getSession } from "@/lib/authSession";

function formatTime(timestamp: any) {
  if (!timestamp) return '';
  const date = timestamp?.toDate?.() || new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

export default function AgentMessagesPage() {
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (activeChat) {
      fetchMessages(activeChat);
    }
  }, [activeChat]);

  async function fetchConversations() {
    try {
      const session = getSession();
      if (!session) return;
      
      const res = await fetch(`/api/messages?userId=${session.uid}`);
      const data = await res.json();
      setConversations(data.conversations || []);
      
      if (data.conversations && data.conversations.length > 0) {
        setActiveChat(data.conversations[0].conversationId);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchMessages(conversationId: string) {
    try {
      const session = getSession();
      if (!session) return;
      
      const res = await fetch(`/api/messages?userId=${session.uid}&conversationId=${conversationId}`);
      const data = await res.json();
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  }

  const handleSend = async () => {
    if (!message.trim() || !activeChat) return;
    
    try {
      const session = getSession();
      if (!session) return;
      
      const activeConv = conversations.find(c => c.conversationId === activeChat);
      const receiverId = activeConv?.senderId === session.uid ? activeConv?.receiverId : activeConv?.senderId;
      const receiverName = activeConv?.senderId === session.uid ? activeConv?.receiverName : activeConv?.senderName;
      
      await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send',
          conversationId: activeChat,
          senderId: session.uid,
          senderName: session.name || '',
          receiverId,
          receiverName,
          content: message,
          read: false
        })
      });
      
      setMessage("");
      fetchMessages(activeChat);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const activeConv = conversations.find(c => c.conversationId === activeChat);

  return (
    <main className="p-6">
      <h2 className="text-2xl font-bold mb-6">Messages & Chat</h2>
      <div className="flex gap-2 mb-4">
        {["All", "Clients", "Brokers", "Support"].map(f => (
          <button 
            key={f} 
            onClick={() => setFilter(f)} 
            className={`px-3 py-1 rounded ${filter === f ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"}`}
          >
            {f}
          </button>
        ))}
      </div>
      <div className="flex gap-4 h-[600px]">
        <aside className="w-1/3 bg-white rounded-xl shadow overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-gray-500">Loading...</div>
          ) : conversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500">No conversations yet</div>
          ) : conversations.map(conv => {
            const session = getSession();
            const isMe = conv.senderId === session?.uid;
            const otherName = isMe ? conv.receiverName : conv.senderName;
            
            return (
              <div 
                key={conv.conversationId} 
                onClick={() => setActiveChat(conv.conversationId)} 
                className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${activeChat === conv.conversationId ? "bg-blue-50" : ""}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold">{otherName}</span>
                  <span className="text-xs text-gray-500">{formatTime(conv.createdAt)}</span>
                </div>
                <p className="text-sm text-gray-600 truncate">{conv.content}</p>
                {!conv.read && !isMe && <span className="inline-block mt-1 px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">New</span>}
              </div>
            );
          })}
        </aside>

        <section className="flex-1 bg-white rounded-xl shadow flex flex-col">
          {activeConv ? (
            <>
              <div className="p-4 border-b font-semibold text-lg">
                {activeConv.senderId === getSession()?.uid ? activeConv.receiverName : activeConv.senderName}
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map(msg => {
                  const isMe = msg.senderId === getSession()?.uid;
                  return (
                    <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-xs px-4 py-2 rounded-xl ${isMe ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-800"}`}>
                        <p>{msg.content}</p>
                        <p className={`text-xs mt-1 ${isMe ? "text-blue-100" : "text-gray-500"}`}>
                          {formatTime(msg.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })}
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
                <button onClick={handleSend} className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700">
                  Send
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              Select a conversation to start messaging
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
