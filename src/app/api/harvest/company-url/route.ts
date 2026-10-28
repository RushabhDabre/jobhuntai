import { NextResponse } from 'next/server';
import { scrapeCompanyCareerUrl } from '@/lib/services/companyScraper';
import { upsertJob, getUserProfile } from '@/lib/storage';
import { resolveAuthUser } from '@/lib/auth-server';
import { Job } from '@/types/job';

export async function POST(req: Request) {
  try {
    const authUser = await resolveAuthUser(req);
    const body = await req.json();
    const userId = authUser?.userId || req.headers.get('x-user-id') || body.userId || undefined;

    const { url } = body;
    if (!url || !url.trim()) {
      return NextResponse.json({ success: false, error: 'Please provide a company website or career page link.' }, { status: 400 });
    }

    const profile = userId ? await getUserProfile(userId) : null;
    const result = await scrapeCompanyCareerUrl(url.trim(), profile);

    if (!result.success || result.jobs.length === 0) {
      return NextResponse.json({
        success: false,
        error: result.error || 'No open positions could be found on this webpage. Please check the link or paste a specific job opening.',
      }, { status: 400 });
    }

    const now = new Date().toISOString();
    const savedJobs: Job[] = [];

    for (const partial of result.jobs) {
      const fullJob: Job = {
        id: `job-co-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        userId,
        title: partial.title || 'Software Engineer',
        company: partial.company || result.company || 'Target Company',
        location: partial.location || 'India / Remote',
        remoteType: partial.remoteType || 'unknown',
        salary: partial.salary || 'Competitive / Market Standard',
        url: partial.url || url,
        source: (partial.source as Job['source']) || 'company-website',
        description: partial.description || '',
        requirements: partial.requirements || [],
        department: partial.department,
        status: 'discovered',
        matchScore: partial.matchScore || 85,
        matchReason: partial.matchReason,
        isUrgentHiring: partial.isUrgentHiring !== false,
        noticePeriodAcceptable: 'Immediate to 30 Days',
        postedAt: now,
        createdAt: now,
        updatedAt: now,
      };

      await upsertJob(fullJob, userId);
      savedJobs.push(fullJob);
    }

    return NextResponse.json({
      success: true,
      company: result.company,
      jobs: savedJobs,
      message: result.message || `Discovered ${savedJobs.length} roles from ${result.company}!`,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error scraping company link';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
