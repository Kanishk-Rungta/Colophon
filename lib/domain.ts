import { commandSchema, DomainError, type Actor, type AuditEvent, type Command, type Content, type Scan, type Workspace } from './schema';
import { applySuggestion, evidenceKey, unresolved, verify } from './engine';

export const currentVersion = (s: Workspace, c: Content) => s.versions.find(v => v.id === c.currentVersionId)!;
export const currentScan = (s: Workspace, c: Content) => s.scans.find(r => r.id === c.scanId);
export function assertActor(s: Workspace, actor: Actor, role?: 'creator' | 'reviewer' | 'admin') {
  if (actor.workspaceId !== s.id || !actor.id || (role && !actor.roles.includes(role))) throw new DomainError('You do not have permission for this workspace or action.', 403);
}
export function scanIsCurrent(s: Workspace, c: Content, now = new Date()) {
  const scan = currentScan(s, c);
  return !!scan && scan.versionId === c.currentVersionId && scan.evidenceKey === evidenceKey(s.evidence, c.scope, now);
}
export async function execute(input: Workspace, raw: Command, actor: Actor, options?: { now?: Date; analyze?: (body: string, scan: Scan) => Promise<Scan> }): Promise<Workspace> {
  const cmd = commandSchema.parse(raw);
  assertActor(input, actor);
  const s = structuredClone(input), now = options?.now ?? new Date(), at = now.toISOString();
  const event = (action: string, subjectId: string, detail: string) => {
    const entry: AuditEvent = { id: crypto.randomUUID(), actorId: actor.id, actorName: actor.name, action, subjectId, detail, createdAt: at };
    s.audit.push(entry);
  };
  function item(id: string) {
    const c = s.contents.find(c => c.id === id && c.workspaceId === s.id);
    if (!c) throw new DomainError('Content not found in this workspace.', 404);
    return c;
  }
  function fresh(c: Content) {
    if (!scanIsCurrent(s, c, now)) throw new DomainError('Save and run a fresh review. Content or governing evidence has changed.', 409);
    return currentScan(s, c)!;
  }
  if (cmd.type === 'evidence' || cmd.type === 'archive') {
    assertActor(s, actor, 'admin');
    const old = s.evidence.find(e => e.id === (cmd.type === 'archive' ? cmd.evidenceId : cmd.record.id));
    if (cmd.type === 'archive' && !old) throw new DomainError('Evidence not found.', 404);
    if (cmd.type === 'evidence' && cmd.record.workspaceId !== s.id) throw new DomainError('Evidence belongs to a different workspace.', 403);
    if (cmd.type === 'evidence' && old && cmd.record.revision !== old.revision) throw new DomainError('This evidence was edited elsewhere. Refresh before saving.', 409);
    const record = cmd.type === 'archive' ? { ...old!, status: 'archived' as const } : cmd.record;
    const next = { ...record, workspaceId: s.id, revision: (old?.revision ?? 0) + 1, createdAt: old?.createdAt ?? at, updatedAt: at };
    if (old) s.evidence[s.evidence.findIndex(e => e.id === old.id)] = next;
    else s.evidence.push(next);
    s.evidenceHistory.push(structuredClone(next));
    event(cmd.type === 'archive' ? 'Evidence archived' : 'Evidence saved', next.id, `${next.title} · revision ${next.revision} · ${next.status}`);
  } else if (cmd.type === 'save') {
    assertActor(s, actor, 'creator');
    let c = cmd.contentId ? item(cmd.contentId) : undefined;
    if (c?.state === 'in_review') throw new DomainError('Request changes before editing a revision under review.', 409);
    if (!c) {
      c = { id: crypto.randomUUID(), workspaceId: s.id, title: cmd.title, scope: cmd.scope, state: 'draft', currentVersionId: '', updatedAt: at };
      s.contents.push(c);
    }
    const previous = s.versions.filter(v => v.contentId === c.id);
    const v = { id: crypto.randomUUID(), contentId: c.id, number: previous.length + 1, body: cmd.body, createdAt: at, createdBy: actor.id };
    s.versions.push(v);
    Object.assign(c, { title: cmd.title, scope: cmd.scope, currentVersionId: v.id, state: 'draft', scanId: undefined, updatedAt: at });
    event(previous.length ? 'Revision saved' : 'Draft created', c.id, `Version ${v.number} · ${cmd.title}`);
  } else {
    const c = item(cmd.contentId);
    const v = currentVersion(s, c);
    if (cmd.type === 'scan') {
      assertActor(s, actor, 'creator');
      if (c.state === 'approved' || c.state === 'in_review') throw new DomainError('Create a new draft or request changes before rescanning.', 409);
      let scan = verify(v.body, v.id, s.evidence, c.scope, now);
      if (options?.analyze) scan = await options.analyze(v.body, scan);
      s.scans.push(scan); c.scanId = scan.id; c.state = 'scanned';
      event('Scan completed', c.id, `Version ${v.number} · ${scan.findings.length} observations · ${unresolved(scan).length} blocking`);
      scan.findings.forEach(f => event('Finding generated', f.id, `${f.title} · ${f.verdict} · ${f.evidenceIds.join(', ')}`));
    } else if (cmd.type === 'submit') {
      assertActor(s, actor, 'creator'); fresh(c);
      if (c.state !== 'scanned') throw new DomainError('Only a freshly scanned draft can be submitted.', 409);
      c.state = 'in_review'; event('Submitted for review', c.id, `Version ${v.number}`);
    } else if (cmd.type === 'suggestion') {
      assertActor(s, actor, 'creator');
      if (c.state !== 'scanned') throw new DomainError('Suggestions can only be applied to a scanned draft.', 409);
      const scan = fresh(c), f = scan.findings.find(f => f.id === cmd.findingId);
      if (!f) throw new DomainError('Finding not found.', 404);
      const body = applySuggestion(v.body, f);
      const next = { ...v, id: crypto.randomUUID(), number: s.versions.filter(x => x.contentId === c.id).length + 1, body, createdAt: at, createdBy: actor.id };
      s.versions.push(next); c.currentVersionId = next.id; c.scanId = undefined; c.state = 'draft';
      event('Suggestion applied', c.id, `${f.originalText} → ${f.suggestedRevision} · from version ${v.number} · ${f.evidenceIds.join(', ')}`);
      event('Revision saved', c.id, `Version ${next.number}`);
    } else if (cmd.type === 'dispute' || cmd.type === 'override') {
      assertActor(s, actor, cmd.type === 'override' ? 'reviewer' : 'creator');
      if (cmd.type === 'override' && c.state !== 'in_review') throw new DomainError('Overrides are recorded at the Review Desk during review.', 409);
      if (cmd.type === 'dispute' && c.state !== 'scanned') throw new DomainError('Only findings in a scanned draft can be disputed.', 409);
      const scan = fresh(c), f = scan.findings.find(f => f.id === cmd.findingId);
      if (!f || f.verdict === 'supported') throw new DomainError('Actionable finding not found.', 404);
      f.status = cmd.type === 'override' ? 'overridden' : 'disputed'; f.reason = cmd.reason; f.actionBy = actor.id;
      event(cmd.type === 'override' ? 'Finding overridden' : 'Finding disputed', f.id, cmd.reason);
    } else if (cmd.type === 'decide') {
      assertActor(s, actor, 'reviewer');
      if (c.state !== 'in_review') throw new DomainError('This content is not awaiting a decision.', 409);
      if (cmd.outcome === 'changes_requested' && cmd.note.length < 8) throw new DomainError('Explain the changes needed in at least 8 characters.');
      const scan = cmd.outcome === 'approved' ? fresh(c) : currentScan(s, c)!;
      if (cmd.outcome === 'approved' && unresolved(scan).length) throw new DomainError('Resolve each blocking finding or record an override reason before approval.', 409);
      const decision = { id: crypto.randomUUID(), versionId: v.id, actorId: actor.id, actorName: actor.name, outcome: cmd.outcome, note: cmd.note, createdAt: at };
      s.decisions.push(decision); c.state = cmd.outcome === 'approved' ? 'approved' : 'returned';
      event(cmd.outcome === 'approved' ? 'Revision approved' : 'Changes requested', c.id, `Version ${v.number} · ${cmd.note || 'Approved after human review.'}`);
      if (cmd.outcome === 'approved') {
        const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(v.body));
        const contentHash = Array.from(new Uint8Array(digest)).map(n => n.toString(16).padStart(2, '0')).join('');
        const versionIds = new Set(s.versions.filter(x => x.contentId === c.id).map(x => x.id));
        const findingIds = new Set(s.scans.filter(x => versionIds.has(x.versionId)).flatMap(x => x.findings.map(f => f.id)));
        s.records.push({ id: crypto.randomUUID(), workspaceId: s.id, contentId: c.id, title: c.title, scope: c.scope, version: structuredClone(v), scan: structuredClone(scan), decision, contentHash, createdAt: at,
          audit: structuredClone(s.audit.filter(e => e.subjectId === c.id || findingIds.has(e.subjectId))),
          history: s.versions.filter(x => x.contentId === c.id).map(version => ({ version: structuredClone(version), scans: structuredClone(s.scans.filter(x => x.versionId === version.id)) })) });
      }
    }
    c.updatedAt = at;
  }
  s.revision += 1;
  return s;
}
