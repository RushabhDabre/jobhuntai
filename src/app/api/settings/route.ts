import { NextResponse } from 'next/server';
import { getAppSettings, saveAppSettings } from '@/lib/storage';

export async function GET() {
  try {
    const settings = await getAppSettings();
    return NextResponse.json({
      success: true,
      settings: {
        ...settings,
        hasGeminiKey: Boolean(settings.geminiApiKey),
        hasFirecrawlKey: Boolean(settings.firecrawlApiKey),
        hasApifyToken: Boolean(settings.apifyApiToken),
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error fetching settings';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const updated = await saveAppSettings(body);
    return NextResponse.json({
      success: true,
      settings: {
        ...updated,
        hasGeminiKey: Boolean(updated.geminiApiKey),
        hasFirecrawlKey: Boolean(updated.firecrawlApiKey),
        hasApifyToken: Boolean(updated.apifyApiToken),
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error saving settings';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
