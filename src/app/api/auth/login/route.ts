import { NextResponse } from 'next/server';
import { verifyPassword } from '@/lib/auth-crypto';
import { findUserByEmail, createSession } from '@/lib/auth-storage';
import { getUserProfile } from '@/lib/storage';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = (body.email || '').trim().toLowerCase();
    const password = (body.password || '').trim();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Please enter both email and password.' },
        { status: 400 }
      );
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    const isValid = verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    // Create session token
    const token = await createSession({
      userId: user.id,
      email: user.email,
      name: user.name,
    });

    const profile = await getUserProfile(user.id);

    const response = NextResponse.json({
      success: true,
      message: 'Logged in successfully!',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      profile,
      token,
    });

    // Set HTTP-only session cookie
    response.cookies.set('jh_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
    });

    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Login failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
