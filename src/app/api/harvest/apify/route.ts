import { NextResponse } from 'next/server';
import { searchJobsWithApify } from '@/lib/services/apify';
import { upsertJob, getUserProfile } from '@/lib/storage';
import { matchJobWithResume } from '@/lib/services/gemini';
import { parseApiError } from '@/lib/apiErrorHandler';
import { Job } from '@/types/job';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      provider = 'google-jobs',
      actorId,
      queries = ['Software Engineer'],
      location = 'Remote',
      maxItems = 10,
      autoScore = false,
      customToken,
    } = body;

    const rawJobs = await searchJobsWithApify(
      {
        provider,
        actorId,
        queries: Array.isArray(queries) ? queries : [queries],
        location,
        maxItems: Number(maxItems) || 10,
      },
      customToken
    );

    const now = new Date().toISOString();
    const profile = autoScore ? await getUserProfile() : null;
    const savedJobs: Job[] = [];

    for (const raw of rawJobs) {
      const newJob: Job = {
        id: `job-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        title: raw.title || 'Untitled Role',
        company: raw.company || 'Unknown Company',
        location: raw.location || location,
        remoteType: raw.remoteType || 'unknown',
        salary: raw.salary,
        url: raw.url || '',
        source: 'apify',
        description: raw.description || '',
        requirements: raw.requirements || [],
        status: 'discovered',
        postedAt: now,
        createdAt: now,
        updatedAt: now,
      };

      if (profile && newJob.description) {
        try {
          const analysis = await matchJobWithResume(
            {
              title: newJob.title,
              company: newJob.company,
              location: newJob.location,
              description: newJob.description,
              requirements: newJob.requirements,
            },
            profile
          );
          newJob.matchScore = analysis.score;
          newJob.matchAnalysis = analysis;
        } catch {
          // ignore auto-score fail for individual batch items
        }
      }

      savedJobs.push(await upsertJob(newJob));
    }

    return NextResponse.json({
      success: true,
      count: savedJobs.length,
      jobs: savedJobs,
    });
  } catch (error: unknown) {
    const formatted = parseApiError(error, 'Apify');
    return NextResponse.json({
      success: false,
      error: formatted.message,
      formattedError: formatted,
    }, { status: 200 });
  }
}
