import { NextResponse } from 'next/server';
import { getUserProfile, saveUserProfile } from '@/lib/storage';
import { UserProfile } from '@/types/job';

export async function GET() {
  try {
    const profile = getUserProfile();
    return NextResponse.json({ success: true, profile });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error fetching profile';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const current = getUserProfile();
    const updated: UserProfile = {
      ...current,
      ...body,
      updatedAt: new Date().toISOString(),
    };
    saveUserProfile(updated);
    return NextResponse.json({ success: true, profile: updated });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error saving profile';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
