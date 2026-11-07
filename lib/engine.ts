import type { Evidence, Finding, Scan } from './schema';
import { DomainError } from './schema';

export function isActive(e: Evidence, scope: string, now = new Date()): boolean {
  return e.status === 'approved' && new Date(e.effectiveAt) <= now && (!e.expiresAt || new Date(e.expiresAt) > now) && (e.scope.includes(scope) || e.scope.includes('*'));
}
export function evidenceKey(evidence: Evidence[], scope: string, now = new Date()): string {
  return JSON.stringify(evidence.filter(e => isActive(e, scope, now)).map(e => `${e.id}@${e.revision}`).sort());
}
function escape(value: string) { return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
function matches(text: string, phrase: string): { start: number; end: number }[] {
  const regex = new RegExp(`(?<![\\p{L}\\p{N}_])${escape(phrase)}(?![\\p{L}\\p{N}_])`, 'giu');
  return [...text.matchAll(regex)].map(m => ({ start: m.index!, end: m.index! + m[0].length }));
}
export function verify(body: string, versionId: string, evidence: Evidence[], scope: string, now = new Date()): Scan {
  const active = evidence.filter(e => isActive(e, scope, now));
  const findings: Finding[] = [];
  const add = (e: Evidence, start: number, end: number, props: Pick<Finding, 'category' | 'severity' | 'verdict' | 'title' | 'explanation'> & { suggestedRevision?: string }) => {
    findings.push({ id: crypto.randomUUID(), versionId, start, end, originalText: body.slice(start, end), evidenceIds: [e.id], origin: 'rule', status: 'open', ...props });
  };
  for (const e of active) {
    if (e.type === 'term' || e.type === 'tone') {
      for (const phrase of e.prohibitedWording.split('|').map(p => p.trim()).filter(Boolean)) {
        for (const span of matches(body, phrase)) {
          add(e, span.start, span.end, e.type === 'term'
            ? { category: 'terminology', severity: 'warning', verdict: 'contradicted', title: 'Use the approved language', explanation: e.description, suggestedRevision: e.approvedWording }
            : { category: 'tone', severity: 'advisory', verdict: 'advisory', title: 'A calmer way to say it', explanation: e.description });
        }
      }
    }
    if (e.type === 'fact' && e.subject && e.canonicalValue !== undefined) {
      // A number is only interpreted as this fact when immediately attached to its configured subject.
      const regex = new RegExp(`(?<![\\w.,])(?:(?:more than|over|at least|approximately|about)\\s+)?\\d[\\d,]*(?:\\.\\d+)?\\s*${escape(e.subject)}(?![\\p{L}\\p{N}_])`, 'giu');
      for (const m of body.matchAll(regex)) {
        const number = Number(m[0].match(/\d[\d,]*(?:\.\d+)?/)![0].replaceAll(',', ''));
        const lowerBound = /^(more than|over|at least)\s/i.test(m[0]);
        const consistent = lowerBound ? (/^at least/i.test(m[0]) ? number <= e.canonicalValue : number < e.canonicalValue) : number === e.canonicalValue;
        const approvedPhrase = m[0].toLowerCase() === e.approvedWording.toLowerCase();
        add(e, m.index!, m.index! + m[0].length, consistent || approvedPhrase
          ? { category: 'factual', severity: 'advisory', verdict: 'supported', title: `${e.subject.charAt(0).toUpperCase()+e.subject.slice(1)} statement supported`, explanation: `This statement is consistent with ${e.sourceTitle}. This applies only to the configured subject and scope.` }
          : { category: 'factual', severity: 'blocking', verdict: 'contradicted', title: 'The number does not match', explanation: `The approved ${e.subject} record gives ${e.canonicalValue.toLocaleString('en-US')}. This specific wording conflicts with that record.`, suggestedRevision: e.approvedWording });
      }
    }
    if (e.type === 'claim_policy') {
      const regex = /\b(?:guarantees?\s+(?:\d+(?:\.\d+)?%\s+)?(?:faster\s+)?(?:results|improvement|success)|(?:100%\s+)?guaranteed\s+(?:(?:\d+(?:\.\d+)?%\s+)?(?:faster\s+)?(?:results|improvement|success)))/gi;
      for (const m of body.matchAll(regex)) {
        add(e, m.index!, m.index! + m[0].length, { category: 'claim', severity: 'blocking', verdict: 'insufficient_evidence', title: 'A guarantee without substantiation', explanation: 'No specifically approved performance evidence supports this guarantee. The active claims policy requires substantiation. Missing evidence does not mean the claim is false.', suggestedRevision: 'helps teams move faster' });
      }
    }
  }
  findings.sort((a, b) => a.start - b.start || b.end - a.end);
  return { id: crypto.randomUUID(), versionId, createdAt: now.toISOString(), evidenceKey: evidenceKey(evidence, scope, now), evidence: structuredClone(active), findings, aiStatus: 'Deterministic checks · AI not configured' };
}
export function applySuggestion(body: string, finding: Finding): string {
  if (!finding.suggestedRevision || body.slice(finding.start, finding.end) !== finding.originalText) throw new DomainError('This finding is outdated. Save and rescan before applying a suggestion.');
  return body.slice(0, finding.start) + finding.suggestedRevision + body.slice(finding.end);
}
export const unresolved = (scan?: Scan) => scan?.findings.filter(f => f.severity === 'blocking' && f.verdict !== 'supported' && f.status !== 'overridden') ?? [];
