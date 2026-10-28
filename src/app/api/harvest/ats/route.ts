import { NextResponse } from 'next/server';
import { harvestFromAts } from '@/lib/services/ats';
import { upsertJob, getUserProfile } from '@/lib/storage';
import { resolveAuthUser } from '@/lib/auth-server';
import { matchJobWithResume } from '@/lib/services/gemini';
import { Job, UserProfile } from '@/types/job';

export async function POST(req: Request) {
  try {
    const authUser = await resolveAuthUser(req);
    const body = await req.json();
    const userId = authUser?.userId || req.headers.get('x-user-id') || body.userId || undefined;

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
    const profile = autoScore && userId ? await getUserProfile(userId) : null;
    const savedJobs: Job[] = [];
    let aiScoredCount = 0;

    for (const raw of rawJobs) {
      const newJob: Job = {
        id: `job-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        userId: userId,
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

      if (profile) {
        // Deep Gemini match on first job, instant heuristic on remaining to prevent 503/429 rate limit
        if (aiScoredCount < 1 && newJob.description && profile.geminiApiKey) {
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
            aiScoredCount++;
          } catch {
            newJob.matchScore = computeHeuristicScore(newJob, profile);
          }
        } else {
          newJob.matchScore = computeHeuristicScore(newJob, profile);
        }
      }

      savedJobs.push(await upsertJob(newJob, userId));
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

function computeHeuristicScore(job: Partial<Job>, profile: UserProfile): number {
  let score = 68;
  const targetLower: string[] = (profile.targetTitles || []).map((t: string) => t.toLowerCase());
  const titleLower = (job.title || '').toLowerCase();

  if (targetLower.some((t: string) => titleLower.includes(t) || t.includes(titleLower))) {
    score += 20;
  } else if (targetLower.some((t: string) => t.split(/\s+/).some((w: string) => w.length > 3 && titleLower.includes(w)))) {
    score += 12;
  }

  const descLower = (job.description || '').toLowerCase();
  const matchedSkills = (profile.skills || []).filter((s: string) => descLower.includes(s.toLowerCase()));
  score += Math.min(14, matchedSkills.length * 3);

  return Math.min(96, Math.max(55, score));
}
