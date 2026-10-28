import { NextResponse } from 'next/server';
import { getAppSettings, saveAppSettings, getStorageMode, getUserProfile, saveUserProfile } from '@/lib/storage';
import { resolveAuthUser } from '@/lib/auth-server';
import { isCloudflareD1Configured } from '@/lib/cloudflare-d1';
import { isSupabaseConfigured } from '@/lib/supabase';
import { UserProfile } from '@/types/job';

export async function GET(req: Request) {
  try {
    const authUser = await resolveAuthUser(req);
    const settings = await getAppSettings();
    let hasUserGeminiKey = false;
    let userGeminiApiKey = '';
    let userGroqKey = '';
    let userOpenRouterKey = '';
    let userOpenAiKey = '';
    let userAnthropicKey = '';
    let userGrokKey = '';
    let preferredAiProvider = settings.preferredAiProvider || 'gemini';
    let autoFailover = settings.autoFailover !== false;

    if (authUser?.userId) {
      const userProfile = await getUserProfile(authUser.userId);
      if (userProfile?.geminiApiKey) {
        hasUserGeminiKey = true;
        userGeminiApiKey = userProfile.geminiApiKey;
      }
      if (userProfile?.groqApiKey) userGroqKey = userProfile.groqApiKey;
      if (userProfile?.openRouterApiKey) userOpenRouterKey = userProfile.openRouterApiKey;
      if (userProfile?.openaiApiKey) userOpenAiKey = userProfile.openaiApiKey;
      if (userProfile?.anthropicApiKey) userAnthropicKey = userProfile.anthropicApiKey;
      if (userProfile?.grokApiKey) userGrokKey = userProfile.grokApiKey;
      if (userProfile?.preferredAiProvider) preferredAiProvider = userProfile.preferredAiProvider;
      if (userProfile?.autoFailover !== undefined) autoFailover = userProfile.autoFailover;
    }

    return NextResponse.json({
      success: true,
      settings: {
        ...settings,
        geminiApiKey: userGeminiApiKey ? '' : settings.geminiApiKey,
        groqApiKey: userGroqKey ? '' : (settings.groqApiKey || ''),
        openRouterApiKey: userOpenRouterKey ? '' : (settings.openRouterApiKey || ''),
        openaiApiKey: userOpenAiKey ? '' : (settings.openaiApiKey || ''),
        anthropicApiKey: userAnthropicKey ? '' : (settings.anthropicApiKey || ''),
        grokApiKey: userGrokKey ? '' : (settings.grokApiKey || ''),
        preferredAiProvider,
        autoFailover,
        hasGeminiKey: hasUserGeminiKey || Boolean(settings.geminiApiKey),
        hasGroqKey: Boolean(userGroqKey || settings.groqApiKey),
        hasOpenRouterKey: Boolean(userOpenRouterKey || settings.openRouterApiKey),
        hasOpenAiKey: Boolean(userOpenAiKey || settings.openaiApiKey),
        hasAnthropicKey: Boolean(userAnthropicKey || settings.anthropicApiKey),
        hasGrokKey: Boolean(userGrokKey || settings.grokApiKey),
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

    // If user is authenticated, save per-user keys and preferences to their isolated profile
    if (authUser?.userId) {
      const userUpdates: Partial<UserProfile> = {};
      if (body.geminiApiKey !== undefined && body.geminiApiKey.trim()) userUpdates.geminiApiKey = body.geminiApiKey.trim();
      if (body.groqApiKey !== undefined && body.groqApiKey.trim()) userUpdates.groqApiKey = body.groqApiKey.trim();
      if (body.openRouterApiKey !== undefined && body.openRouterApiKey.trim()) userUpdates.openRouterApiKey = body.openRouterApiKey.trim();
      if (body.openaiApiKey !== undefined && body.openaiApiKey.trim()) userUpdates.openaiApiKey = body.openaiApiKey.trim();
      if (body.anthropicApiKey !== undefined && body.anthropicApiKey.trim()) userUpdates.anthropicApiKey = body.anthropicApiKey.trim();
      if (body.grokApiKey !== undefined && body.grokApiKey.trim()) userUpdates.grokApiKey = body.grokApiKey.trim();
      if (body.preferredAiProvider !== undefined) userUpdates.preferredAiProvider = body.preferredAiProvider;
      if (body.autoFailover !== undefined) userUpdates.autoFailover = body.autoFailover;

      if (Object.keys(userUpdates).length > 0) {
        await saveUserProfile(userUpdates, authUser.userId);
      }
    }

    const updated = await saveAppSettings(body);
    return NextResponse.json({
      success: true,
      settings: {
        ...updated,
        hasGeminiKey: Boolean(body.geminiApiKey || updated.geminiApiKey),
        hasGroqKey: Boolean(body.groqApiKey || updated.groqApiKey),
        hasOpenRouterKey: Boolean(body.openRouterApiKey || updated.openRouterApiKey),
        hasOpenAiKey: Boolean(body.openaiApiKey || updated.openaiApiKey),
        hasAnthropicKey: Boolean(body.anthropicApiKey || updated.anthropicApiKey),
        hasGrokKey: Boolean(body.grokApiKey || updated.grokApiKey),
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
