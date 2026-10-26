import { NextResponse } from 'next/server';
import { getJobById, getUserProfile, upsertJob } from '@/lib/storage';
import { generatePitch } from '@/lib/services/gemini';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(req: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const job = getJobById(id);
    if (!job) {
      return NextResponse.json({ success: false, error: 'Job not found' }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    const pitchType = body.pitchType || 'cover_letter';
    const profile = getUserProfile();

    const pitchText = await generatePitch(
      {
        title: job.title,
        company: job.company,
        description: job.description,
      },
      profile,
      pitchType,
      body.apiKey
    );

    const updates: Partial<typeof job> = {};
    if (pitchType === 'cover_letter') {
      updates.coverLetter = pitchText;
    } else {
      updates.coldPitch = pitchText;
    }

    const updated = upsertJob({
      ...job,
      ...updates,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, pitch: pitchText, pitchType, job: updated });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error generating pitch';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
