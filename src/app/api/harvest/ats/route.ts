import { NextResponse } from 'next/server';
import { harvestFromAts } from '@/lib/services/ats';
import { upsertJob, getUserProfile } from '@/lib/storage';
import { matchJobWithResume } from '@/lib/services/gemini';
import { Job } from '@/types/job';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { platform = 'greenhouse', companySlug, keywordFilter, limit = 10, autoScore = false } = body;

    if (!companySlug) {
      return NextResponse.json({ success: false, error: 'Company slug is required' }, { status: 400 });
    }

    const rawJobs = await harvestFromAts({
      platform,
      companySlug,
      keywordFilter,
      limit: Number(limit) || 10,
    });

    const now = new Date().toISOString();
    const profile = autoScore ? getUserProfile() : null;
    const savedJobs: Job[] = [];

    for (const raw of rawJobs) {
      const newJob: Job = {
        id: `job-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        title: raw.title || 'Untitled Role',
        company: raw.company || companySlug,
        location: raw.location || 'Unknown',
        remoteType: raw.remoteType || 'unknown',
        url: raw.url || '',
        source: platform,
        description: raw.description || '',
        department: raw.department,
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
            },
            profile
          );
          newJob.matchScore = analysis.score;
          newJob.matchAnalysis = analysis;
        } catch {
          // ignore auto-score error for individual items
        }
      }

      savedJobs.push(upsertJob(newJob));
    }

    return NextResponse.json({
      success: true,
      count: savedJobs.length,
      jobs: savedJobs,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'ATS harvesting failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
