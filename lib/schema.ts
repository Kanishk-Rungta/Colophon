import { z } from 'zod';

export const evidenceSchema = z.object({
  id: z.string().min(1).max(80), workspaceId: z.string(), revision: z.number().int().positive(),
  type: z.enum(['fact', 'term', 'claim_policy', 'tone']), title: z.string().min(1).max(160),
  description: z.string().max(3000), canonicalValue: z.number().nonnegative().optional(),
  subject: z.string().max(80).optional(), approvedWording: z.string().max(500),
  prohibitedWording: z.string().max(500), sourceTitle: z.string().min(1).max(200),
  sourceReference: z.string().max(500), status: z.enum(['approved', 'draft', 'archived']),
  effectiveAt: z.iso.datetime(), expiresAt: z.union([z.iso.datetime(), z.literal('')]),
  scope: z.array(z.string().min(1).max(60)).min(1).max(10),
  createdAt: z.iso.datetime(), updatedAt: z.iso.datetime()
}).superRefine((e, ctx) => {
  if (e.type === 'fact' && (e.canonicalValue === undefined || !e.subject)) ctx.addIssue({ code: 'custom', message: 'Facts require a numeric value and a subject.' });
  if ((e.type === 'term' || e.type === 'tone') && !e.prohibitedWording.trim()) ctx.addIssue({ code: 'custom', message: 'Enter at least one phrase to detect.' });
  if (e.type === 'term' && !e.approvedWording.trim()) ctx.addIssue({ code: 'custom', message: 'Terminology rules require approved wording.' });
  if (e.type === 'fact' && !e.approvedWording.trim()) ctx.addIssue({ code: 'custom', message: 'Facts require approved wording.' });
  if (e.expiresAt && e.expiresAt <= e.effectiveAt) ctx.addIssue({ code: 'custom', message: 'Expiry must be after the effective date.' });
});
export type Evidence = z.infer<typeof evidenceSchema>;
export type Verdict = 'supported' | 'contradicted' | 'insufficient_evidence' | 'advisory';
export type Role = 'creator' | 'reviewer' | 'admin';
export type Actor = { id: string; name: string; workspaceId: string; roles: Role[] };
export type Finding = {
  id: string; versionId: string; category: 'terminology' | 'factual' | 'claim' | 'tone';
  severity: 'blocking' | 'warning' | 'advisory'; verdict: Verdict;
  start: number; end: number; originalText: string; title: string; explanation: string;
  evidenceIds: string[]; suggestedRevision?: string; origin: 'rule' | 'ai';
  status: 'open' | 'disputed' | 'overridden'; reason?: string; actionBy?: string;
};
export type Scan = { id: string; versionId: string; createdAt: string; evidenceKey: string; evidence: Evidence[]; findings: Finding[]; aiStatus: string };
export type Version = { id: string; contentId: string; number: number; body: string; createdAt: string; createdBy: string };
export type Content = { id: string; workspaceId: string; title: string; scope: string; currentVersionId: string; scanId?: string; state: 'draft' | 'scanned' | 'in_review' | 'returned' | 'approved'; updatedAt: string };
export type Decision = { id: string; versionId: string; actorId: string; actorName: string; outcome: 'approved' | 'changes_requested'; note: string; createdAt: string };
export type AuditEvent = { id: string; actorId: string; actorName: string; action: string; subjectId: string; detail: string; createdAt: string };
export type Publication = { id: string; workspaceId: string; contentId: string; title: string; scope: string; version: Version; scan: Scan; decision: Decision; contentHash: string; createdAt: string; audit: AuditEvent[]; history: {version: Version; scans: Scan[]}[] };
export type Workspace = { schemaVersion: 1; id: string; name: string; revision: number; owner: Actor; evidence: Evidence[]; evidenceHistory: Evidence[]; contents: Content[]; versions: Version[]; scans: Scan[]; decisions: Decision[]; records: Publication[]; audit: AuditEvent[] };

const reason = z.string().trim().min(8, 'Give a meaningful reason of at least 8 characters.').max(1500);
export const commandSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('save'), contentId: z.string().optional(), title: z.string().trim().min(1).max(160), body: z.string().trim().min(1).max(20000), scope: z.enum(['global marketing', 'India marketing', 'email']) }),
  z.object({ type: z.literal('scan'), contentId: z.string() }),
  z.object({ type: z.literal('submit'), contentId: z.string() }),
  z.object({ type: z.literal('dispute'), contentId: z.string(), findingId: z.string(), reason }),
  z.object({ type: z.literal('override'), contentId: z.string(), findingId: z.string(), reason }),
  z.object({ type: z.literal('decide'), contentId: z.string(), outcome: z.enum(['approved', 'changes_requested']), note: z.string().trim().max(1500) }),
  z.object({ type: z.literal('evidence'), record: evidenceSchema }),
  z.object({ type: z.literal('archive'), evidenceId: z.string() }),
  z.object({ type: z.literal('suggestion'), contentId: z.string(), findingId: z.string() })
]);
export type Command = z.infer<typeof commandSchema>;
export class DomainError extends Error {
  constructor(message: string, public status = 400) { super(message); this.name = 'DomainError'; }
}
