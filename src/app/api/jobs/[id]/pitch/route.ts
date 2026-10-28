import { NextResponse } from 'next/server';
import { getJobById, getUserProfile, upsertJob } from '@/lib/storage';
import { resolveAuthUser } from '@/lib/auth-server';
import { generatePitch } from '@/lib/services/gemini';
import { parseApiError } from '@/lib/apiErrorHandler';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(req: Request, context: RouteContext) {
  try {
    const authUser = await resolveAuthUser(req);
    const { id } = await context.params;
    const body = await req.json().catch(() => ({}));
    const pitchType = body.pitchType || 'linkedin_dm';
    const userId = authUser?.userId || req.headers.get('x-user-id') || body.userId || undefined;

    const job = await getJobById(id, userId);
    if (!job) {
      return NextResponse.json({ success: false, error: 'Job not found' }, { status: 404 });
    }

    const profile = await getUserProfile(userId);
    const apiKey = body.apiKey || profile.geminiApiKey;

    const pitchText = await generatePitch(
      {
        title: job.title,
        company: job.company,
        description: job.description,
      },
      profile,
      pitchType,
      apiKey
    );

    const updates: Partial<typeof job> = {};
    if (pitchType === 'cover_letter') {
      updates.coverLetter = pitchText;
    } else {
      updates.coldPitch = pitchText;
    }

    const updated = await upsertJob({
      ...job,
      ...updates,
      updatedAt: new Date().toISOString(),
    }, userId);

    return NextResponse.json({ success: true, pitch: pitchText, pitchType, job: updated });
  } catch (error: unknown) {
    const formatted = parseApiError(error, 'Gemini');
    return NextResponse.json(
      {
        success: false,
        error: formatted.message,
        formattedError: formatted,
      },
      { status: 200 }
    );
  }
}
