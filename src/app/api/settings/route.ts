import { NextResponse } from 'next/server';
import { getAppSettings, saveAppSettings, getStorageMode, getUserProfile, saveUserProfile } from '@/lib/storage';
import { resolveAuthUser } from '@/lib/auth-server';
import { isCloudflareD1Configured } from '@/lib/cloudflare-d1';
import { isSupabaseConfigured } from '@/lib/supabase';

export async function GET(req: Request) {
  try {
    const authUser = await resolveAuthUser(req);
    const settings = await getAppSettings();
    let hasUserGeminiKey = false;
    let userGeminiApiKey = '';

    if (authUser?.userId) {
      const userProfile = await getUserProfile(authUser.userId);
      if (userProfile?.geminiApiKey) {
        hasUserGeminiKey = true;
        userGeminiApiKey = userProfile.geminiApiKey;
      }
    }

    return NextResponse.json({
      success: true,
      settings: {
        ...settings,
        geminiApiKey: userGeminiApiKey ? '' : settings.geminiApiKey,
        hasGeminiKey: hasUserGeminiKey || Boolean(settings.geminiApiKey),
        hasFirecrawlKey: Boolean(settings.firecrawlApiKey),
        hasApifyToken: Boolean(settings.apifyApiToken),
      },
      storage: {
        mode: getStorageMode(),
        hasCloudflareD1: isCloudflareD1Configured(),
        hasSupabase: isSupabaseConfigured(),
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error fetching settings';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const authUser = await resolveAuthUser(req);
    const body = await req.json();

    // If user is authenticated and provided a geminiApiKey, save to their isolated profile
    if (authUser?.userId && body.geminiApiKey) {
      await saveUserProfile({ geminiApiKey: body.geminiApiKey.trim() }, authUser.userId);
    }

    const updated = await saveAppSettings(body);
    return NextResponse.json({
      success: true,
      settings: {
        ...updated,
        hasGeminiKey: Boolean(body.geminiApiKey || updated.geminiApiKey),
        hasFirecrawlKey: Boolean(updated.firecrawlApiKey),
        hasApifyToken: Boolean(updated.apifyApiToken),
      },
      storage: {
        mode: getStorageMode(),
        hasCloudflareD1: isCloudflareD1Configured(),
        hasSupabase: isSupabaseConfigured(),
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error saving settings';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
