import type { Actor, Evidence, Workspace } from './schema';

export const SAMPLES = [
  { title: 'The launch announcement', label: 'Multiple problems', body: 'Our AI autopilot guarantees 40% faster results for 20,000 customers.' },
  { title: 'The competitive campaign', label: 'Tone & messaging', body: 'Crush your competitors with the most powerful AI platform ever created.' },
  { title: 'The Northline introduction', label: 'Compliant baseline', body: 'Northline provides assisted automation for business teams and supports more than 12,000 customers.' }
];
export function seedEvidence(workspaceId: string): Evidence[] {
  const base = { workspaceId, revision: 1, sourceReference: 'Fictional Northline demo document · internal source', status: 'approved' as const, effectiveAt: '2026-01-01T00:00:00.000Z', expiresAt: '', scope: ['global marketing'], createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z', approvedWording: '', prohibitedWording: '', description: '' };
  return [
    { ...base, id: 'FACT-021', type: 'fact', title: 'Global customer count', subject: 'customers', canonicalValue: 12400, approvedWording: 'more than 12,000 customers', description: 'The approved count is 12,400 customers. The rounded wording is explicitly approved for marketing.', sourceTitle: 'Northline FY26 Customer Summary' },
    { ...base, id: 'TERM-006', type: 'term', title: 'Assisted, never autonomous', prohibitedWording: 'AI autopilot', approvedWording: 'assisted automation', description: 'Northline assists people. Do not imply autonomous operation.', sourceTitle: 'Northline Brand Language v2.1' },
    { ...base, id: 'CLAIM-004', type: 'claim_policy', title: 'Performance claims need proof', description: 'Performance guarantees require specifically approved supporting evidence. Missing evidence is not proof that a claim is false. This demo flags guarantee patterns for review.', sourceTitle: 'Northline Claims & Substantiation Policy' },
    { ...base, id: 'TONE-003', type: 'tone', title: 'Calm confidence', prohibitedWording: 'crush your competitors|destroy the competition|most powerful AI platform ever created', approvedWording: 'Help your team work with clarity and confidence.', description: 'Maintain a calm, credible, professional voice. Avoid aggressive language and unsubstantiated superlatives.', sourceTitle: 'Northline Voice & Messaging Guide' },
    { ...base, id: 'TERM-009', type: 'term', title: 'One product. One name.', prohibitedWording: 'Northline Pro Max', approvedWording: 'Northline', description: 'Use the approved product name without invented tier suffixes.', sourceTitle: 'Northline Product Naming Standard' },
    { ...base, id: 'TONE-008', type: 'tone', title: 'Describe the product precisely', prohibitedWording: 'fully autonomous workforce', approvedWording: 'assisted automation for business teams', description: 'Northline provides reliable assisted automation for business teams.', sourceTitle: 'Northline Positioning Brief' },
    { ...base, id: 'FACT-011', type: 'fact', title: 'Discontinued time-saving study', subject: 'hours', canonicalValue: 8, approvedWording: '8 hours', status: 'archived', description: 'A discontinued pilot claim. Never use this archived record as current substantiation.', sourceTitle: 'Northline Pilot Study FY24' },
    { ...base, id: 'FACT-015', type: 'fact', title: 'Previous customer count', subject: 'customers', canonicalValue: 9500, approvedWording: '9,500 customers', effectiveAt: '2025-01-01T00:00:00.000Z', expiresAt: '2025-12-31T23:59:59.000Z', description: 'Expired historical customer count. Excluded from current verification.', sourceTitle: 'Northline FY25 Customer Summary' },
    { ...base, id: 'TERM-014', type: 'term', title: 'Email language guideline', scope: ['email'], prohibitedWording: 'BUY NOW OR MISS OUT', approvedWording: 'Explore Northline', description: 'Avoid high-pressure urgency in email campaigns.', sourceTitle: 'Northline Email Channel Guide' }
  ];
}
export function createWorkspace(ownerId: string, workspaceId = crypto.randomUUID()): Workspace {
  const owner: Actor = { id: ownerId, name: 'Demo owner', workspaceId, roles: ['creator', 'reviewer', 'admin'] };
  const evidence = seedEvidence(workspaceId);
  const now = new Date().toISOString();
  const contentId = crypto.randomUUID(), versionId = crypto.randomUUID();
  return { schemaVersion: 1, id: workspaceId, name: 'Northline', revision: 0, owner, evidence, evidenceHistory: [...evidence],
    contents: [{ id: contentId, workspaceId, title: 'The launch announcement', scope: 'global marketing', currentVersionId: versionId, state: 'draft', updatedAt: now }],
    versions: [{ id: versionId, contentId, number: 1, body: SAMPLES[0].body, createdAt: now, createdBy: ownerId }], scans: [], decisions: [], records: [],
    audit: [{ id: crypto.randomUUID(), actorId: ownerId, actorName: owner.name, action: 'Draft created', subjectId: contentId, detail: 'Seeded fictional Northline sample, version 1.', createdAt: now }] };
}
