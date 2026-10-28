import { NextResponse } from 'next/server';
import { scrapeJobWithFirecrawl, crawlCareerPageWithFirecrawl } from '@/lib/services/firecrawl';
import { upsertJob, getUserProfile } from '@/lib/storage';
import { resolveAuthUser } from '@/lib/auth-server';
import { matchJobWithResume } from '@/lib/services/gemini';
import { parseApiError } from '@/lib/apiErrorHandler';
import { Job } from '@/types/job';

export async function POST(req: Request) {
  try {
    const authUser = await resolveAuthUser(req);
    const body = await req.json();
    const userId = authUser?.userId || req.headers.get('x-user-id') || body.userId || undefined;

    const { url, mode = 'scrape', autoScore = false, customApiKey } = body;

    if (!url) {
      return NextResponse.json({ success: false, error: 'URL is required' }, { status: 400 });
    }

    if (mode === 'crawl') {
      // Crawl career page for openings
      const links = await crawlCareerPageWithFirecrawl(url, 5, customApiKey);
      return NextResponse.json({
        success: true,
        mode: 'crawl',
        foundLinks: links,
        message: `Discovered ${links.length} potential career pages/openings.`,
      });
    }

    // Default: Scrape single job URL
    const { job: partialJob } = await scrapeJobWithFirecrawl(url, customApiKey);

    const now = new Date().toISOString();
    const newJob: Job = {
      id: `job-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      userId: userId,
      title: partialJob.title || 'Untitled Role',
      company: partialJob.company || 'Unknown Company',
      location: partialJob.location || 'Remote',
      remoteType: partialJob.remoteType || 'unknown',
      salary: partialJob.salary,
      url: partialJob.url || url,
      source: 'firecrawl',
      description: partialJob.description || '',
      requirements: partialJob.requirements || [],
      department: partialJob.department,
      status: 'discovered',
      postedAt: now,
      createdAt: now,
      updatedAt: now,
    };

    if (autoScore && userId) {
      try {
        const profile = await getUserProfile(userId);
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
      } catch (scoreErr) {
        console.warn('Auto-score failed during Firecrawl harvest:', scoreErr);
      }
    }

    const saved = await upsertJob(newJob, userId);
    return NextResponse.json({ success: true, job: saved });
  } catch (error: unknown) {
    const formatted = parseApiError(error, 'Firecrawl');
    return NextResponse.json({
      success: false,
      error: formatted.message,
      formattedError: formatted,
    }, { status: 200 });
  }
}
