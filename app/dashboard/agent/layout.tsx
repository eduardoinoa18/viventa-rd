"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSession } from "@/lib/authSession";
import AgentDashboardNav from "@/components/AgentDashboardNav";

export default function AgentDashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    async function checkAuth() {
      const session = await getSession();
      if (!session || session.role !== "agent") {
        router.replace("/login");
      }
    }
    checkAuth();
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50">
      <AgentDashboardNav />
      <div>{children}</div>
    </div>
  );
}
