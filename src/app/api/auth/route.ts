import { NextResponse } from 'next/server';
import { findSession } from '@/lib/auth-storage';
import { getUserProfile } from '@/lib/storage';

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    const tokenFromHeader = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    const cookieHeader = req.headers.get('cookie') || '';
    const cookieToken = cookieHeader
      .split(';')
      .map((c) => c.trim())
      .find((c) => c.startsWith('jh_session='))
      ?.split('=')[1];

    const token = tokenFromHeader || cookieToken || req.headers.get('x-session-token');

    if (token) {
      const session = await findSession(token);
      if (session) {
        const profile = await getUserProfile(session.userId);
        return NextResponse.json({
          success: true,
          authenticated: true,
          user: {
            id: session.userId,
            email: session.email,
            name: session.name,
          },
          profile,
        });
      }
    }

    // Header fallback
    const fallbackUserId = req.headers.get('x-user-id');
    if (fallbackUserId && fallbackUserId !== 'default_user') {
      const profile = await getUserProfile(fallbackUserId);
      return NextResponse.json({
        success: true,
        authenticated: true,
        user: {
          id: fallbackUserId,
          email: profile.email || fallbackUserId,
          name: profile.name,
        },
        profile,
      });
    }

    return NextResponse.json({ success: false, authenticated: false, message: 'No active session' }, { status: 401 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Auth verification failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
