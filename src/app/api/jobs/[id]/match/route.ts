import { NextResponse } from 'next/server';
import { getJobById, getUserProfile, upsertJob } from '@/lib/storage';
import { resolveAuthUser } from '@/lib/auth-server';
import { matchJobWithResume } from '@/lib/services/gemini';
import { parseApiError } from '@/lib/apiErrorHandler';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(req: Request, context: RouteContext) {
  try {
    const authUser = await resolveAuthUser(req);
    const { id } = await context.params;
    const body = await req.json().catch(() => ({}));
    const userId = authUser?.userId || req.headers.get('x-user-id') || body.userId || undefined;

    const job = await getJobById(id, userId);
    if (!job) {
      return NextResponse.json({ success: false, error: 'Job not found' }, { status: 404 });
    }

    const profile = await getUserProfile(userId);
    const apiKey = body.apiKey || profile.geminiApiKey;

    const analysis = await matchJobWithResume(
      {
        title: job.title,
        company: job.company,
        location: job.location,
        description: job.description,
        requirements: job.requirements,
        salary: job.salary,
        salaryInLpa: job.salaryInLpa,
      },
      profile,
      apiKey
    );

    const updated = await upsertJob({
      ...job,
      matchScore: analysis.score,
      matchAnalysis: analysis,
      updatedAt: new Date().toISOString(),
    }, userId);

    return NextResponse.json({ success: true, job: updated, analysis });
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
