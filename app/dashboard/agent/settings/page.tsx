"use client";
import React, { useState } from "react";

export default function AgentSettingsPage() {
  const [tab, setTab] = useState("profile");

  return (
    <main className="p-6">
      <h2 className="text-2xl font-bold mb-6">Settings & Account</h2>
      <div className="flex gap-6 mb-6">
        <button onClick={() => setTab("profile")} className={`px-4 py-2 rounded-xl font-semibold ${tab === "profile" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"}`}>Profile Info</button>
        <button onClick={() => setTab("notifications")} className={`px-4 py-2 rounded-xl font-semibold ${tab === "notifications" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"}`}>Notifications</button>
        <button onClick={() => setTab("password")} className={`px-4 py-2 rounded-xl font-semibold ${tab === "password" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"}`}>Password</button>
        <button onClick={() => setTab("integrations")} className={`px-4 py-2 rounded-xl font-semibold ${tab === "integrations" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"}`}>Integrations</button>
      </div>

      {tab === "profile" && <ProfileTab />}
      {tab === "notifications" && <NotificationsTab />}
      {tab === "password" && <PasswordTab />}
      {tab === "integrations" && <IntegrationsTab />}
    </main>
  );
}

function ProfileTab() {
  return (
    <section className="bg-white rounded-xl shadow p-6 max-w-2xl">
      <h3 className="text-lg font-semibold mb-4">Profile Information</h3>
      <form className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Profile Photo</label>
          <input type="file" className="border rounded px-3 py-2 w-full" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Full Name</label>
          <input type="text" defaultValue="Eduardo Inoa" className="border rounded px-3 py-2 w-full" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input type="email" defaultValue="eduardo@viventa.com" className="border rounded px-3 py-2 w-full" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Phone</label>
          <input type="tel" defaultValue="809-555-1234" className="border rounded px-3 py-2 w-full" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">License Number</label>
          <input type="text" defaultValue="RE-12345" className="border rounded px-3 py-2 w-full" />
        </div>
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700">Save Changes</button>
      </form>
    </section>
  );
}

function NotificationsTab() {
  return (
    <section className="bg-white rounded-xl shadow p-6 max-w-2xl">
      <h3 className="text-lg font-semibold mb-4">Notification Preferences</h3>
      <div className="space-y-4">
        <label className="flex items-center gap-3">
          <input type="checkbox" defaultChecked className="w-5 h-5" />
          <span>Email notifications for new leads</span>
        </label>
        <label className="flex items-center gap-3">
          <input type="checkbox" defaultChecked className="w-5 h-5" />
          <span>SMS notifications for appointments</span>
        </label>
        <label className="flex items-center gap-3">
          <input type="checkbox" className="w-5 h-5" />
          <span>Weekly performance summary</span>
        </label>
        <label className="flex items-center gap-3">
          <input type="checkbox" className="w-5 h-5" />
          <span>Marketing updates from Viventa RD</span>
        </label>
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700">Save Preferences</button>
      </div>
    </section>
  );
}

function PasswordTab() {
  return (
    <section className="bg-white rounded-xl shadow p-6 max-w-2xl">
      <h3 className="text-lg font-semibold mb-4">Change Password</h3>
      <form className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Current Password</label>
          <input type="password" className="border rounded px-3 py-2 w-full" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">New Password</label>
          <input type="password" className="border rounded px-3 py-2 w-full" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Confirm New Password</label>
          <input type="password" className="border rounded px-3 py-2 w-full" />
        </div>
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700">Update Password</button>
      </form>
    </section>
  );
}

function IntegrationsTab() {
  return (
    <section className="bg-white rounded-xl shadow p-6 max-w-2xl">
      <h3 className="text-lg font-semibold mb-4">Integrations</h3>
      <div className="space-y-4">
        <div className="flex items-center justify-between border rounded p-4">
          <div>
            <p className="font-semibold">CRM Integration</p>
            <p className="text-sm text-gray-600">Connect your CRM for seamless lead management</p>
          </div>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700">Connect</button>
        </div>
        <div className="flex items-center justify-between border rounded p-4">
          <div>
            <p className="font-semibold">Social Media</p>
            <p className="text-sm text-gray-600">Link your social media accounts for cross-posting</p>
          </div>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700">Connect</button>
        </div>
        <div className="flex items-center justify-between border rounded p-4">
          <div>
            <p className="font-semibold">Google Calendar</p>
            <p className="text-sm text-gray-600">Sync appointments to your calendar</p>
          </div>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700">Connect</button>
        </div>
      </div>
    </section>
  );
}
