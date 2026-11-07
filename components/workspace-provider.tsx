'use client';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { createWorkspace } from '@/lib/seed';
import { execute } from '@/lib/domain';
import type { Command, Workspace } from '@/lib/schema';
import { z } from 'zod';

const KEY = 'colophon.workspace.v1';
const storedSchema = z.object({ schemaVersion: z.literal(1), id: z.string(), revision: z.number(), name: z.string(), owner: z.object({ id: z.string(), workspaceId: z.string(), roles: z.array(z.enum(['creator','reviewer','admin'])), name: z.string() }), evidence: z.array(z.object({ id: z.string(), type: z.string(), scope: z.array(z.string()), status: z.string(), revision: z.number(), title: z.string() }).passthrough()), evidenceHistory: z.array(z.unknown()), contents: z.array(z.object({ id: z.string(), currentVersionId: z.string(), state: z.string(), title: z.string() }).passthrough()), versions: z.array(z.object({ id: z.string(), body: z.string(), number: z.number() }).passthrough()), scans: z.array(z.object({ id: z.string(), findings: z.array(z.unknown()) }).passthrough()), decisions: z.array(z.unknown()), records: z.array(z.unknown()), audit: z.array(z.unknown()) }).passthrough();
function parseStorage(raw: string): Workspace {
  const parsed = storedSchema.parse(JSON.parse(raw));
  if (parsed.owner.workspaceId !== parsed.id || parsed.contents.some(c => !parsed.versions.some(v => v.id === c.currentVersionId))) throw new Error('Invalid workspace relationships');
  return parsed as Workspace;
}
type WorkspaceContext = { state: Workspace | null; mode: 'loading' | 'local' | 'hosted'; busy: boolean; error: string; notice: string; act: (command: Command, message?: string) => Promise<Workspace | null>; clearError: () => void; reload: () => void };
const Context = createContext<WorkspaceContext | null>(null);
export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<Workspace | null>(null), [mode, setMode] = useState<WorkspaceContext['mode']>('loading');
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState('');
  const active = useRef(false), current = useRef<Workspace | null>(null), started = useRef(false);
  const accept = useCallback((value: Workspace) => { current.current = value; setState(value); }, []);
  useEffect(() => {
    if (started.current) return; started.current = true;
    async function initialize() {
      try {
        const res = await fetch('/api/health', { cache: 'no-store' });
        const health = await res.json();
        if (!res.ok || health.mode === 'misconfigured') throw new Error('The hosted environment is only partially configured. Set all three Supabase variables or remove them to use the local demo.');
        if (health.mode === 'hosted') {
          const client = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
          const { data: { session } } = await client.auth.getSession();
          if (!session) { const { error } = await client.auth.signInAnonymously(); if (error) throw new Error('Could not create an isolated session. Enable anonymous sign-ins in Supabase and retry.'); }
          const response = await fetch('/api/workspace', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ initialize: true }) });
          const result = await response.json(); if (!response.ok) throw new Error(result.error);
          accept(result.state); setMode('hosted');
        } else {
          const raw = localStorage.getItem(KEY);
          let next: Workspace;
          if (raw) { try { next = parseStorage(raw); } catch { throw new Error('Stored workspace data could not be read. It has been preserved. Export browser storage before clearing this site’s data, then reload to start a new demo.'); } }
          else { next = createWorkspace(crypto.randomUUID()); localStorage.setItem(KEY, JSON.stringify(next)); }
          accept(next); setMode('local');
        }
      } catch (e) { setError(e instanceof Error ? e.message : 'Could not open the workspace. Check storage access and reload.'); }
    }
    void initialize();
  }, [accept]);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(''), 6500); return () => clearTimeout(timer);
  }, [notice]);
  useEffect(() => {
    function sync(e: StorageEvent) {
      if (mode === 'local' && e.key === KEY && e.newValue && !active.current) {
        try { accept(parseStorage(e.newValue)); setNotice('Workspace updated from another tab.'); } catch { setError('Another tab saved unreadable data. Your current view is preserved.'); }
      }
    }
    window.addEventListener('storage', sync); return () => window.removeEventListener('storage', sync);
  }, [mode, accept]);
  const act = async (command: Command, message = 'Changes saved.') => {
    if (!current.current || active.current) return null;
    active.current = true; setBusy(true); setError('');
    const previous = current.current;
    try {
      let next: Workspace;
      if (mode === 'hosted') {
        const response = await fetch('/api/workspace', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ revision: previous.revision, command }) });
        const result = await response.json(); if (!response.ok) throw new Error(result.error); next = result.state;
      } else {
        const transaction = async () => {
          const raw = localStorage.getItem(KEY);
          if (!raw || parseStorage(raw).revision !== previous.revision) throw new Error('This workspace changed in another tab. Reload before saving. Your editor text is still here.');
          const value = await execute(previous, command, previous.owner);
          try { localStorage.setItem(KEY, JSON.stringify(value)); } catch { throw new Error('Browser storage is full or unavailable. This change was not saved. Export your saved workspace and free space before retrying.'); }
          return value;
        };
        next = navigator.locks ? await navigator.locks.request('colophon-save', transaction) : await transaction();
      }
      accept(next); setNotice(message); return next;
    } catch (e) { setError(e instanceof z.ZodError ? e.issues.map(i => i.message).join(' ') : e instanceof Error ? e.message : 'Could not save this operation. Please retry.'); return null; }
    finally { active.current = false; setBusy(false); }
  };
  return <Context.Provider value={{ state, mode, busy, error, notice, act, clearError: () => setError(''), reload: () => window.location.reload() }}>{children}</Context.Provider>;
}
export function useWorkspace() { const value = useContext(Context); if (!value) throw new Error('Workspace provider missing'); return value; }
export function downloadJSON(name: string, value: unknown) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' }));
  const a = document.createElement('a'); a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
