import { z } from 'zod';
import { commandSchema, DomainError } from '@/lib/schema';
import { execute } from '@/lib/domain';
import { initializeWorkspace, loadWorkspace } from '@/lib/server';
import { analyzeWithAI } from '@/lib/ai';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;
const headers = { 'Cache-Control': 'private, no-store' };
function failure(error: unknown) {
  if (error instanceof DomainError) return Response.json({ error: error.message }, { status: error.status, headers });
  if (error instanceof z.ZodError) return Response.json({ error: error.issues.map(i => i.message).join(' ') }, { status: 422, headers });
  return Response.json({ error: 'The operation failed. Your last saved revision is preserved. Please retry.' }, { status: 500, headers });
}
export async function GET() {
  try { const { state } = await loadWorkspace(); return Response.json({ state }, { headers }); } catch (e) { return failure(e); }
}
export async function POST(request: Request) {
  try {
    if (request.headers.get('origin') !== new URL(request.url).origin) throw new DomainError('Cross-origin mutations are not allowed.', 403);
    if (Number(request.headers.get('content-length') ?? 0) > 50000) throw new DomainError('Request is too large.', 413);
    const text = await request.text();
    if (text.length > 50000) throw new DomainError('Request is too large.', 413);
    let raw: unknown;
    try { raw = JSON.parse(text); } catch { throw new DomainError('Request must contain valid JSON.', 400); }
    const envelope = z.object({ initialize: z.boolean().optional(), revision: z.number().int().nonnegative().optional(), command: commandSchema.optional() }).parse(raw);
    if (envelope.initialize) {
      const { state } = await initializeWorkspace(); return Response.json({ state }, { headers });
    }
    if (!envelope.command || envelope.revision === undefined) throw new DomainError('A command and current workspace revision are required.');
    const { state, actor, admin, user } = await loadWorkspace();
    if (state.revision !== envelope.revision) throw new DomainError('Another tab changed this workspace. Reload before retrying. Your unsaved editor text remains available.', 409);
    // Database-backed, per-session rate limit: shared across serverless instances.
    const { data: allowed, error: rateError } = await admin.rpc('consume_action', { p_user_id: user.id });
    if (rateError) throw new DomainError('Request limiter unavailable. Please retry.', 503);
    if (!allowed) throw new DomainError('Too many actions. Wait a minute and retry.', 429);
    const next = await execute(state, envelope.command, actor, { analyze: analyzeWithAI });
    const { data, error } = await admin.from('workspaces').update({ state: next, revision: next.revision }).eq('id', actor.workspaceId).eq('revision', state.revision).select('id');
    if (error) throw new DomainError('The database did not save this change. Please retry.', 503);
    if (!data?.length) throw new DomainError('A concurrent edit was saved first. Reload and retry.', 409);
    return Response.json({ state: next }, { headers });
  } catch (e) { return failure(e); }
}
