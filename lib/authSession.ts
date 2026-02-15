import type { UserRole } from '@/types/user';

export type UserSession = {
  uid: string;
  role: UserRole;
  email?: string;
  token?: string;
  profileComplete?: boolean;
  name?: string;
  displayName?: string;
  phone?: string;
};

const KEY = 'viventa:session';

export function saveSession(session: UserSession) {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(KEY, JSON.stringify(session));
  // Also set lightweight cookies so middleware can enforce role-based access
  try {
    const maxAge = 60 * 60 * 24 * 7; // 7 days
    document.cookie = `viventa_role=${encodeURIComponent(session.role)}; path=/; max-age=${maxAge}; samesite=lax`;
    if (typeof session.profileComplete !== 'undefined') {
      document.cookie = `viventa_profile=${session.profileComplete ? '1' : '0'}; path=/; max-age=${maxAge}; samesite=lax`;
    }
    if (session.uid) {
      document.cookie = `viventa_uid=${encodeURIComponent(session.uid)}; path=/; max-age=${maxAge}; samesite=lax`;
    }
    if (session.name) {
      document.cookie = `viventa_name=${encodeURIComponent(session.name)}; path=/; max-age=${maxAge}; samesite=lax`;
    }
    if (session.phone) {
      document.cookie = `viventa_phone=${encodeURIComponent(session.phone)}; path=/; max-age=${maxAge}; samesite=lax`;
    }
  } catch {}
}

export function saveSessionLocal(session: UserSession) {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(KEY, JSON.stringify(session));
}

export function getSession(): UserSession | null {
  if (typeof window === 'undefined') return null;
  const raw = sessionStorage.getItem(KEY);
  if (raw) return JSON.parse(raw);

  // Fallback: hydrate from cookies when sessionStorage is empty (e.g., mobile refresh/PWA)
  try {
    const cookies = document.cookie || '';
    const map = new Map<string, string>();
    cookies.split(';').forEach((pair) => {
      const [k, ...rest] = pair.trim().split('=');
      if (!k) return;
      map.set(k, decodeURIComponent(rest.join('=')));
    });

    const uid = map.get('viventa_uid');
    const role = map.get('viventa_role') as UserSession['role'] | undefined;
    if (uid && role) {
      const name = map.get('viventa_name');
      const profileComplete = map.get('viventa_profile') === '1';
      const session: UserSession = { uid, role, name, profileComplete };
      // Persist back to sessionStorage for faster subsequent reads
      sessionStorage.setItem(KEY, JSON.stringify(session));
      return session;
    }
  } catch {}

  return null;
}

export function clearSession() {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(KEY);
  try {
    const expired = 'expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;';
    document.cookie = `viventa_role=; ${expired}`;
    document.cookie = `viventa_profile=; ${expired}`;
    document.cookie = `viventa_uid=; ${expired}`;
    document.cookie = `viventa_name=; ${expired}`;
    document.cookie = `viventa_phone=; ${expired}`;
    document.cookie = `viventa_admin_email=; ${expired}`;
  } catch {}
}
