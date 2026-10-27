import { NextResponse } from 'next/server';
import { getUserProfile, saveUserProfile } from '@/lib/storage';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = req.headers.get('x-user-id') || searchParams.get('userId') || undefined;
    const profile = await getUserProfile(userId);
    return NextResponse.json({ success: true, profile });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error fetching profile';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const body = await req.json();
    const userId = req.headers.get('x-user-id') || searchParams.get('userId') || body.userId || body.email || undefined;
    const updated = await saveUserProfile(body, userId);
    return NextResponse.json({ success: true, profile: updated });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error saving profile';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
