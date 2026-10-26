import { NextResponse } from 'next/server';
import { getJobById, getUserProfile, upsertJob } from '@/lib/storage';
import { matchJobWithResume } from '@/lib/services/gemini';

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
    const profile = getUserProfile();

    const analysis = await matchJobWithResume(
      {
        title: job.title,
        company: job.company,
        location: job.location,
        description: job.description,
        requirements: job.requirements,
      },
      profile,
      body.apiKey
    );

    const updated = upsertJob({
      ...job,
      matchScore: analysis.score,
      matchAnalysis: analysis,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, job: updated, analysis });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error analyzing job match';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
