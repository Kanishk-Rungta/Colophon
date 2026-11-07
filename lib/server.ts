import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { createWorkspace } from './seed';
import { DomainError, type Actor, type Workspace } from './schema';

export function executionMode() {
  const flags = [process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, process.env.SUPABASE_SERVICE_ROLE_KEY];
  if (flags.every(Boolean)) return 'hosted';
  if (flags.some(Boolean)) return 'misconfigured';
  return 'local';
}
export async function session() {
  if (executionMode() !== 'hosted') throw new DomainError('Hosted persistence is not configured. Use the labelled local demo.', 503);
  const jar = await cookies();
  const client = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: { getAll: () => jar.getAll(), setAll: values => values.forEach(({ name, value, options }) => jar.set(name, value, options)) }
  });
  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user) throw new DomainError('Your session expired. Reload to reconnect your workspace.', 401);
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { autoRefreshToken: false, persistSession: false } });
  return { user, admin };
}
export async function loadWorkspace() {
  const { user, admin } = await session();
  const { data: member, error: memberError } = await admin.from('workspace_members').select('workspace_id, roles').eq('user_id', user.id).maybeSingle();
  if (memberError) throw new DomainError('Cannot load membership. Check database migrations and retry.', 503);
  if (!member) throw new DomainError('Workspace has not been initialized.', 404);
  const { data, error } = await admin.from('workspaces').select('state, revision').eq('id', member.workspace_id).single();
  if (error || !data) throw new DomainError('Workspace could not be loaded. Your changes have not been discarded.', 503);
  const state = data.state as Workspace;
  const actor: Actor = { id: user.id, workspaceId: member.workspace_id, name: 'Demo owner', roles: member.roles };
  return { state, actor, admin, user };
}
export async function initializeWorkspace() {
  const { user, admin } = await session();
  const state = createWorkspace(user.id);
  const { error } = await admin.rpc('initialize_demo', { p_user_id: user.id, p_workspace_id: state.id, p_state: state });
  if (error) throw new DomainError('Demo initialization failed. Apply the SQL migration and enable anonymous sign-ins.', 503);
  return loadWorkspace();
}
