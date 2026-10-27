import { NextResponse } from 'next/server';
import { getJobs, upsertJob } from '@/lib/storage';
import { Job } from '@/types/job';

export async function GET() {
  try {
    const jobs = await getJobs();
    return NextResponse.json({ success: true, jobs });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch jobs';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const now = new Date().toISOString();

    // Check if it's a batch import
    if (Array.isArray(body.jobs)) {
      const saved: Job[] = [];
      for (const item of body.jobs) {
        const job: Job = {
          id: item.id || `job-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          title: item.title || 'Untitled Role',
          company: item.company || 'Unknown Company',
          location: item.location || 'Remote',
          remoteType: item.remoteType || 'unknown',
          salary: item.salary,
          url: item.url || '',
          source: item.source || 'manual',
          description: item.description || '',
          requirements: item.requirements || [],
          department: item.department,
          status: item.status || 'discovered',
          notes: item.notes || '',
          postedAt: item.postedAt || now,
          createdAt: item.createdAt || now,
          updatedAt: now,
        };
        saved.push(await upsertJob(job));
      }
      return NextResponse.json({ success: true, count: saved.length, jobs: saved });
    }

    // Single job creation
    const job: Job = {
      id: body.id || `job-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title: body.title || 'Untitled Role',
      company: body.company || 'Unknown Company',
      location: body.location || 'Remote',
      remoteType: body.remoteType || 'unknown',
      salary: body.salary,
      salaryInLpa: body.salaryInLpa || body.salary,
      url: body.url || '',
      source: body.source || 'manual',
      description: body.description || '',
      requirements: body.requirements || [],
      department: body.department,
      status: body.status || 'discovered',
      notes: body.notes || '',
      postedAt: body.postedAt || now,
      createdAt: now,
      updatedAt: now,
    };

    const saved = await upsertJob(job);
    return NextResponse.json({ success: true, job: saved });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to save job';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
