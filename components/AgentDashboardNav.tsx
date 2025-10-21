import React from "react";
import Link from "next/link";

export default function AgentDashboardNav() {
  return (
    <nav className="flex items-center justify-between px-6 py-4 bg-white shadow-sm">
      <div className="flex items-center gap-3">
        <span className="font-bold text-blue-600 text-xl">🏠 Viventa RD</span>
        <Link href="/dashboard/agent/properties" className="ml-6 text-gray-700 hover:text-blue-600">Properties</Link>
        <Link href="/dashboard/agent/clients" className="ml-4 text-gray-700 hover:text-blue-600">Clients</Link>
        <Link href="/dashboard/agent/analytics" className="ml-4 text-gray-700 hover:text-blue-600">Analytics</Link>
        <Link href="/dashboard/agent/messages" className="ml-4 text-gray-700 hover:text-blue-600">Messages</Link>
        <Link href="/dashboard/agent/settings" className="ml-4 text-gray-700 hover:text-blue-600">Settings</Link>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-700">E</div>
        <div className="relative group">
          <button className="ml-2 px-3 py-1 rounded bg-gray-100 hover:bg-gray-200">▼</button>
          <div className="absolute right-0 mt-2 w-40 bg-white border rounded shadow-lg hidden group-hover:block z-10">
            <Link href="/dashboard/agent/settings" className="block px-4 py-2 hover:bg-gray-100">My Account</Link>
            <button className="block w-full text-left px-4 py-2 hover:bg-gray-100">Switch Role</button>
            <button className="block w-full text-left px-4 py-2 hover:bg-gray-100">Logout</button>
          </div>
        </div>
      </div>
    </nav>
  );
}
