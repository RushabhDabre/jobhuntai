import { NextResponse } from 'next/server';
import { getJobById, upsertJob, deleteJob } from '@/lib/storage';
import { resolveAuthUser } from '@/lib/auth-server';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: Request, context: RouteContext) {
  try {
    const authUser = await resolveAuthUser(req);
    const { id } = await context.params;
    const job = await getJobById(id, authUser?.userId);
    if (!job) {
      return NextResponse.json({ success: false, error: 'Job not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, job });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error fetching job';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PATCH(req: Request, context: RouteContext) {
  try {
    const authUser = await resolveAuthUser(req);
    const { id } = await context.params;
    const existing = await getJobById(id, authUser?.userId);
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Job not found' }, { status: 404 });
    }
    const body = await req.json();
    const updated = await upsertJob({
      ...existing,
      ...body,
      id,
      userId: authUser?.userId || existing.userId,
      updatedAt: new Date().toISOString(),
    }, authUser?.userId);
    return NextResponse.json({ success: true, job: updated });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error updating job';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(req: Request, context: RouteContext) {
  try {
    const authUser = await resolveAuthUser(req);
    const { id } = await context.params;
    const deleted = await deleteJob(id, authUser?.userId);
    if (!deleted) {
      return NextResponse.json({ success: false, error: 'Job not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error deleting job';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
