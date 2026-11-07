import { executionMode } from '@/lib/server';
export const dynamic = 'force-dynamic';
export async function GET() {
  const mode = executionMode();
  return Response.json({ mode, ai: process.env.AI_PROVIDER === 'openai' && !!process.env.AI_API_KEY && !!process.env.AI_MODEL, schemaVersion: 1 }, { status: mode === 'misconfigured' ? 503 : 200, headers: { 'Cache-Control': 'no-store' } });
}
