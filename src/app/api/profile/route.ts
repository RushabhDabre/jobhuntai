import { NextResponse } from 'next/server';
import { getUserProfile, saveUserProfile } from '@/lib/storage';
import { resolveAuthUser } from '@/lib/auth-server';

export async function GET(req: Request) {
  try {
    const authUser = await resolveAuthUser(req);
    const { searchParams } = new URL(req.url);
    const userId = authUser?.userId || req.headers.get('x-user-id') || searchParams.get('userId') || undefined;

    if (!userId || userId === 'default_user') {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const profile = await getUserProfile(userId);
    if (authUser && !profile.email) {
      profile.email = authUser.email;
      if (!profile.name || profile.name === 'Candidate') {
        profile.name = authUser.name;
      }
    }

    return NextResponse.json({ success: true, profile });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error fetching profile';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const authUser = await resolveAuthUser(req);
    const { searchParams } = new URL(req.url);
    const body = await req.json();
    const userId = authUser?.userId || req.headers.get('x-user-id') || searchParams.get('userId') || body.userId || undefined;

    if (!userId || userId === 'default_user') {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const updated = await saveUserProfile(body, userId);
    return NextResponse.json({ success: true, profile: updated });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error saving profile';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
