export type UserSession = {
  uid: string;
  role: 'agent' | 'broker' | 'master_admin' | 'user';
  email?: string;
  token?: string;
  profileComplete?: boolean;
  name?: string;
  displayName?: string;
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
  } catch {}
}

export function getSession(): UserSession | null {
  if (typeof window === 'undefined') return null;
  const raw = sessionStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : null;
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
  } catch {}
}
