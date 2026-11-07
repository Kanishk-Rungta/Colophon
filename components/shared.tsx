'use client';
import { useEffect, useRef } from 'react';
import { X, Check, AlertTriangle, Info } from 'lucide-react';
import type { Evidence, Finding } from '@/lib/schema';

export const dateTime = (date: string) => new Date(date).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
export const categoryLabel = { fact: 'Approved fact', term: 'Terminology', claim_policy: 'Claims policy', tone: 'Tone & messaging' };
export function Status({ state }: { state: string }) { return <span className={`badge ${state === 'approved' ? '' : state === 'in_review' ? 'advisory' : 'neutral'}`}>{state === 'approved' && <Check size={10}/>}{{ draft: 'Draft', scanned: 'Reviewed by engine', in_review: 'Awaiting human review', returned: 'Changes requested', approved: 'Human approved' }[state] ?? state}</span>; }
export function FindingBadge({ finding }: { finding: Finding }) { return <span className={`badge ${finding.verdict === 'supported' ? '' : finding.severity}`}>{finding.verdict === 'supported' ? <Check size={11}/> : finding.severity === 'blocking' ? <AlertTriangle size={11}/> : <Info size={11}/>} {finding.verdict === 'supported' ? 'Supported' : finding.severity}</span>; }
export function EvidenceDetail({ evidence }: { evidence: Evidence }) {
  return <div className="evidence-detail"><div className="split"><span className="mono">{evidence.id} / v{evidence.revision}</span><span className="badge neutral">{categoryLabel[evidence.type]}</span></div><h3>{evidence.title}</h3><p>{evidence.description}</p>{evidence.approvedWording && <div className="approved-wording"><span className="mono">APPROVED WORDING</span><p>{evidence.approvedWording}</p></div>}<dl><div><dt>Source</dt><dd>{evidence.sourceTitle}</dd></div><div><dt>Reference</dt><dd>{evidence.sourceReference}</dd></div>{evidence.canonicalValue !== undefined && <div><dt>Canonical value</dt><dd>{evidence.canonicalValue.toLocaleString('en-US')} {evidence.subject}</dd></div>}<div><dt>Scope</dt><dd>{evidence.scope.join(' · ')}</dd></div><div><dt>Effective</dt><dd>{dateTime(evidence.effectiveAt)}</dd></div><div><dt>Expiry</dt><dd>{evidence.expiresAt ? dateTime(evidence.expiresAt) : 'No expiry configured'}</dd></div><div><dt>Status</dt><dd>{evidence.status} · revision {evidence.revision}</dd></div></dl><div className="fictional-source">Fictional demo source. This is approved workspace evidence, not an external document.</div></div>;
}
export function Dialog({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { const dialog = ref.current!; dialog.showModal(); return () => dialog.close(); }, []);
  return <dialog ref={ref} className="dialog" onCancel={onClose} onClick={e => { if (e.target === ref.current) { const r = ref.current!.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) onClose(); } }} aria-labelledby="dialog-heading"><div className="dialog-header split"><h2 id="dialog-heading">{title}</h2><button onClick={onClose} aria-label="Close dialog"><X size={20}/></button></div>{children}</dialog>;
}
export function HighlightedText({ body, findings, selected, onSelect }: { body: string; findings: Finding[]; selected?: string; onSelect?: (id: string) => void }) {
  // Segment by all boundaries, so overlapping and repeated findings remain exact.
  const valid = findings.filter(f => f.start >= 0 && f.end <= body.length && body.slice(f.start, f.end) === f.originalText);
  const points = [...new Set([0, body.length, ...valid.flatMap(f => [f.start, f.end])])].sort((a,b) => a-b);
  return <div className="highlighted-text">{points.slice(0,-1).map((start,i) => {
    const end = points[i+1], covering = valid.filter(f => f.start <= start && f.end >= end);
    const f = covering.find(f => f.id === selected) ?? covering[0];
    return f ? <button key={start} className={`text-highlight ${f.verdict === 'supported' ? 'supported' : f.severity} ${covering.some(f => f.id === selected) ? 'selected' : ''}`} aria-label={`${f.title}: ${body.slice(start,end)}`} onClick={() => onSelect?.(f.id)}>{body.slice(start,end)}</button> : <span key={start}>{body.slice(start,end)}</span>;
  })}</div>;
}
