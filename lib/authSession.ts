export type UserSession = {
  uid: string;
  role: 'agent' | 'broker' | 'master_admin' | 'user';
  token?: string;
  profileComplete?: boolean;
  name?: string;
};

const KEY = 'viventa:session';

export function saveSession(session: UserSession) {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(KEY, JSON.stringify(session));
}

export function getSession(): UserSession | null {
  if (typeof window === 'undefined') return null;
  const raw = sessionStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : null;
}

export function clearSession() {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(KEY);
}
