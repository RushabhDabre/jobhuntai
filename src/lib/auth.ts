export interface UserSession {
  id: string; // userId
  name: string;
  email: string;
  token?: string;
  geminiApiKey?: string;
  createdAt: string;
}

const STORAGE_KEY = 'jh_user_session';

export function getStoredSession(): UserSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveSession(user: UserSession): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  } catch (e) {
    console.warn('Failed to save session to localStorage', e);
  }
}

export function clearSession(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.warn('Failed to clear session', e);
  }
}

export function getAuthHeaders(): Record<string, string> {
  const session = getStoredSession();
  const headers: Record<string, string> = {};

  if (session) {
    if (session.token) {
      headers['Authorization'] = `Bearer ${session.token}`;
      headers['x-session-token'] = session.token;
    }
    if (session.id) {
      headers['x-user-id'] = session.id;
    }
  }

  return headers;
}

export async function checkServerSession(): Promise<UserSession | null> {
  try {
    const headers = getAuthHeaders();
    const res = await fetch('/api/auth', { headers });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.success && data.user) {
      const stored = getStoredSession();
      const updated: UserSession = {
        id: data.user.id,
        email: data.user.email,
        name: data.user.name,
        token: stored?.token,
        geminiApiKey: data.profile?.geminiApiKey || stored?.geminiApiKey,
        createdAt: stored?.createdAt || new Date().toISOString(),
      };
      saveSession(updated);
      return updated;
    }
    return null;
  } catch {
    return null;
  }
}

export async function logoutUser(): Promise<void> {
  try {
    const headers = getAuthHeaders();
    await fetch('/api/auth/logout', { method: 'POST', headers });
  } catch {
    // ignore
  } finally {
    clearSession();
  }
}
