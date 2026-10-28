import { findSession, findUserById } from './auth-storage';

export interface AuthenticatedUser {
  userId: string;
  email: string;
  name: string;
}

/**
 * Resolves the authenticated user from the incoming HTTP request.
 * Prioritizes:
 * 1. Bearer token in Authorization header
 * 2. x-session-token header
 * 3. jh_session cookie
 * 4. Verified x-user-id header
 */
export async function resolveAuthUser(req: Request): Promise<AuthenticatedUser | null> {
  // 1. Check Authorization header
  const authHeader = req.headers.get('authorization');
  let token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  // 2. Check x-session-token header
  if (!token) {
    token = req.headers.get('x-session-token');
  }

  // 3. Check jh_session cookie
  if (!token) {
    const cookieHeader = req.headers.get('cookie') || '';
    token = cookieHeader
      .split(';')
      .map((c) => c.trim())
      .find((c) => c.startsWith('jh_session='))
      ?.split('=')[1] || null;
  }

  // If session token is found, verify session
  if (token) {
    const session = await findSession(token);
    if (session) {
      return {
        userId: session.userId,
        email: session.email,
        name: session.name,
      };
    }
  }

  // 4. Verify x-user-id header against database
  const directUserId = req.headers.get('x-user-id');
  if (directUserId && directUserId !== 'default_user') {
    const user = await findUserById(directUserId);
    if (user) {
      return {
        userId: user.id,
        email: user.email,
        name: user.name,
      };
    }
  }

  return null;
}
