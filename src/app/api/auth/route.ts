import { NextResponse } from 'next/server';
import { getUserProfile, saveUserProfile } from '@/lib/storage';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = req.headers.get('x-user-id') || searchParams.get('userId') || undefined;

    if (!userId) {
      return NextResponse.json({ success: false, authenticated: false, message: 'No user ID provided' }, { status: 401 });
    }

    const profile = await getUserProfile(userId);
    return NextResponse.json({
      success: true,
      authenticated: true,
      user: {
        id: profile.id || userId,
        email: profile.email || userId,
        name: profile.name,
      },
      profile,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Auth verification failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = (body.email || '').trim().toLowerCase();
    const name = (body.name || '').trim();
    const geminiApiKey = (body.geminiApiKey || '').trim();

    if (!email) {
      return NextResponse.json({ success: false, error: 'Email address is required' }, { status: 400 });
    }

    // Load or create user profile
    const existing = await getUserProfile(email);
    const updated = await saveUserProfile(
      {
        ...existing,
        name: name || existing.name || email.split('@')[0],
        email,
        ...(geminiApiKey ? { geminiApiKey } : {}),
      },
      email
    );

    return NextResponse.json({
      success: true,
      user: {
        id: email,
        email,
        name: updated.name,
      },
      profile: updated,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Login failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
