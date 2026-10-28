import { NextResponse } from 'next/server';
import { deleteSession } from '@/lib/auth-storage';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    const tokenFromHeader = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    const cookieHeader = req.headers.get('cookie') || '';
    const cookieToken = cookieHeader
      .split(';')
      .map((c) => c.trim())
      .find((c) => c.startsWith('jh_session='))
      ?.split('=')[1];

    const token = tokenFromHeader || cookieToken;
    if (token) {
      await deleteSession(token);
    }

    const response = NextResponse.json({ success: true, message: 'Logged out successfully' });
    response.cookies.delete('jh_session');
    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Logout failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
