"use client";
export const dynamic = 'force-dynamic';
import DashboardHome from './DashboardHome';
import { Suspense, useEffect, useState } from 'react';
import { getSession } from '../../lib/authSession';
import { useSearchParams, useRouter } from 'next/navigation';

function DashboardGate() {
  const [ok, setOk] = useState(false);
  const [welcome, setWelcome] = useState(false);
  const router = useRouter();
  const params = useSearchParams();
  useEffect(() => {
    const s = getSession();
    if (!s) { router.replace('/login'); return; }
    setOk(true);
    if (params.get('welcome') === '1') setWelcome(true);
  }, []);
  if (!ok) return <div className="text-center py-8 text-gray-500">Cargando...</div>;
  return (
    <div>
      {welcome && (
        <div className="bg-blue-50 text-blue-800 text-sm py-2 text-center">Bienvenido de vuelta 👋</div>
      )}
      <DashboardHome />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="text-center py-8 text-gray-500">Cargando...</div>}>
      <DashboardGate />
    </Suspense>
  );
}
