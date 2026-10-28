import { NextResponse } from 'next/server';
import { resolveAuthUser } from '@/lib/auth-server';
import { getUserProfile } from '@/lib/storage';
import { generateDomainMatchedJobs } from '@/lib/services/domainJobs';

export async function POST(req: Request) {
  try {
    const authUser = await resolveAuthUser(req);
    const body = await req.json().catch(() => ({}));
    const userId = authUser?.userId || req.headers.get('x-user-id') || body.userId;

    if (!userId || userId === 'default_user') {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const profile = await getUserProfile(userId);
    const jobs = await generateDomainMatchedJobs(
      {
        targetTitles: body.targetTitles || profile?.targetTitles,
        preferredTechnologies: body.preferredTechnologies || profile?.preferredTechnologies,
        preferredLocations: body.preferredLocations || profile?.preferredLocations,
        domainCategory: body.domainCategory || profile?.domainCategory,
        noticePeriod: profile?.noticePeriod,
      },
      userId
    );

    return NextResponse.json({
      success: true,
      count: jobs.length,
      jobs,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Quick match harvest failed';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
