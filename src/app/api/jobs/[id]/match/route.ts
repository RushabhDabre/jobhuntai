import { NextResponse } from 'next/server';
import { getJobById, getUserProfile, upsertJob } from '@/lib/storage';
import { matchJobWithResume } from '@/lib/services/gemini';
import { parseApiError } from '@/lib/apiErrorHandler';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(req: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const job = await getJobById(id);
    if (!job) {
      return NextResponse.json({ success: false, error: 'Job not found' }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    const profile = await getUserProfile();

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
      body.apiKey
    );

    const updated = await upsertJob({
      ...job,
      matchScore: analysis.score,
      matchAnalysis: analysis,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, job: updated, analysis });
  } catch (error: unknown) {
    const formatted = parseApiError(error, 'Gemini');
    return NextResponse.json(
      {
        success: false,
        error: formatted.message,
        formattedError: formatted,
      },
      { status: 200 } // Return 200 with structured rate-limit/token state so UI displays countdown gracefully
    );
  }
}
