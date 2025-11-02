// lib/authClient.ts
// Lightweight auth client used by admin/dashboard pages.
// Replace with real Firebase auth or API calls in production.

export type User = {
  uid: string;
  name: string;
  email: string;
  role: 'master_admin' | 'admin' | 'broker' | 'agent' | 'client';
  lastVerifiedAt?: string | null;
};

// Simulated in-memory session for local dev.
// In production, read cookie / JWT.
let _current: User | null = null;

export function setMockUser(u: User | null) {
  _current = u;
  if (typeof window !== 'undefined') {
    if (u) {
      localStorage.setItem('viventa_mock_user', JSON.stringify(u));
    } else {
      localStorage.removeItem('viventa_mock_user');
    }
  }
}

export function getCurrentUser(): User | null {
  if (!_current && typeof window !== 'undefined') {
    const stored = localStorage.getItem('viventa_mock_user');
    if (stored) {
      _current = JSON.parse(stored);
    }
  }
  return _current;
}

// Simulate login (demo)
export async function loginDemo(email: string, role: User['role']) {
  const u: User = {
    uid: 'u_' + Math.random().toString(36).slice(2, 9),
    name: email.split('@')[0],
    email,
    role,
    lastVerifiedAt: new Date().toISOString()
  };
  setMockUser(u);
  return u;
}

// Simulate logout
export async function logout() {
  setMockUser(null);
}
