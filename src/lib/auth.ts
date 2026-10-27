export interface UserSession {
  id: string;
  name: string;
  email: string;
  geminiApiKey?: string;
  createdAt: string;
}

const STORAGE_KEY = 'jobhunt_auth_session';

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
  if (session && session.id) {
    return {
      'x-user-id': session.id,
    };
  }
  return {};
}
