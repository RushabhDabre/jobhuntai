import { NextResponse } from 'next/server';
import { getJobs, upsertJob } from '@/lib/storage';
import { resolveAuthUser } from '@/lib/auth-server';
import { Job } from '@/types/job';

export async function GET(req: Request) {
  try {
    const authUser = await resolveAuthUser(req);
    const { searchParams } = new URL(req.url);
    const userId = authUser?.userId || req.headers.get('x-user-id') || searchParams.get('userId') || undefined;

    if (!userId || userId === 'default_user') {
      return NextResponse.json({ success: true, jobs: [] });
    }

    const rawJobs = await getJobs(userId);
    const jobs = rawJobs.filter((j) => {
      const t = j.title.toLowerCase();
      if (
        t.includes('limited jobs') ||
        t.includes('company jobs') ||
        (t.endsWith(' jobs') && (j.description.includes('boilerplate') || j.description.includes('generic career portal')))
      ) {
        return false;
      }
      return true;
    });

    return NextResponse.json({ success: true, jobs });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch jobs';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const authUser = await resolveAuthUser(req);
    const { searchParams } = new URL(req.url);
    const body = await req.json();
    const userId = authUser?.userId || req.headers.get('x-user-id') || searchParams.get('userId') || body.userId || undefined;

    if (!userId || userId === 'default_user') {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const now = new Date().toISOString();

    // Check if it's a batch import
    if (Array.isArray(body.jobs)) {
      const saved: Job[] = [];
      for (const item of body.jobs) {
        const job: Job = {
          id: item.id || `job-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          userId: userId,
          title: item.title || 'Untitled Role',
          company: item.company || 'Unknown Company',
          location: item.location || 'Remote',
          city: item.city || undefined,
          remoteType: item.remoteType || 'unknown',
          roleCategory: item.roleCategory || undefined,
          technologies: item.technologies || [],
          salary: item.salary,
          salaryInLpa: item.salaryInLpa || item.salary,
          url: item.url || '',
          source: item.source || 'manual',
          description: item.description || '',
          requirements: item.requirements || [],
          department: item.department,
          experienceRequired: item.experienceRequired,
          status: item.status || 'discovered',
          matchScore: item.matchScore,
          matchAnalysis: item.matchAnalysis,
          notes: item.notes || '',
          postedAt: item.postedAt || now,
          createdAt: item.createdAt || now,
          updatedAt: now,
        };
        saved.push(await upsertJob(job, userId));
      }
      return NextResponse.json({ success: true, count: saved.length, jobs: saved });
    }

    // Single job creation
    const job: Job = {
      id: body.id || `job-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      userId: userId,
      title: body.title || 'Untitled Role',
      company: body.company || 'Unknown Company',
      location: body.location || 'Remote',
      city: body.city || undefined,
      remoteType: body.remoteType || 'unknown',
      roleCategory: body.roleCategory || undefined,
      technologies: body.technologies || [],
      salary: body.salary,
      salaryInLpa: body.salaryInLpa || body.salary,
      url: body.url || '',
      source: body.source || 'manual',
      description: body.description || '',
      requirements: body.requirements || [],
      department: body.department,
      experienceRequired: body.experienceRequired,
      status: body.status || 'discovered',
      matchScore: body.matchScore,
      matchAnalysis: body.matchAnalysis,
      notes: body.notes || '',
      postedAt: body.postedAt || now,
      createdAt: body.createdAt || now,
      updatedAt: now,
    };

    const saved = await upsertJob(job, userId);
    return NextResponse.json({ success: true, job: saved });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to save job';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
