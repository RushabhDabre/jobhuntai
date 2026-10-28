import { NextResponse } from 'next/server';
import { hashPassword } from '@/lib/auth-crypto';
import { findUserByEmail, createUser, createSession } from '@/lib/auth-storage';
import { saveUserProfile } from '@/lib/storage';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = (body.email || '').trim().toLowerCase();
    const password = (body.password || '').trim();
    const name = (body.name || '').trim();
    const geminiApiKey = (body.geminiApiKey || '').trim();

    if (!name) {
      return NextResponse.json({ success: false, error: 'Please enter your full name.' }, { status: 400 });
    }

    if (!email || !EMAIL_REGEX.test(email)) {
      return NextResponse.json({ success: false, error: 'Please enter a valid email address.' }, { status: 400 });
    }

    if (!password || password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 6 characters long.' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existing = await findUserByEmail(email);
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'An account with this email already exists. Please sign in.' },
        { status: 409 }
      );
    }

    // Hash password & create user
    const passwordHash = hashPassword(password);
    const user = await createUser({
      email,
      passwordHash,
      name,
      geminiApiKey: geminiApiKey || undefined,
    });

    // Initialize user profile
    await saveUserProfile(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        geminiApiKey: geminiApiKey || undefined,
        currentLocation: 'Pune, India',
        preferredLocations: ['Pune', 'Mumbai', 'Hyderabad', 'Remote (India)'],
        targetTitles: ['Software Developer'],
        preferredTechnologies: ['React', 'JavaScript'],
        yearsOfExperience: 2,
        currentCtc: '₹7 LPA',
        expectedCtc: '₹10 - ₹16 LPA',
        noticePeriod: 'Immediate Joiner',
        preferredWorkMode: 'any',
        skills: ['React', 'JavaScript'],
        hasCompletedQuickSetup: false,
      },
      user.id
    );

    // Create session token
    const token = await createSession({
      userId: user.id,
      email: user.email,
      name: user.name,
    });

    const response = NextResponse.json({
      success: true,
      message: 'Account created successfully!',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
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
    const message = error instanceof Error ? error.message : 'Sign up failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
