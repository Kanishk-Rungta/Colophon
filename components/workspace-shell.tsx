'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutGrid, FilePenLine, Library, PanelTop, Fingerprint, ArrowUpRight, Menu, X, Check, Download, ShieldCheck, CircleHelp } from 'lucide-react';
import { Brand } from './brand';
import { downloadJSON, useWorkspace } from './workspace-provider';

const navigation = [
  ['/demo', 'Overview', LayoutGrid], ['/demo/studio', 'Content Studio', FilePenLine], ['/demo/evidence', 'Evidence Library', Library], ['/demo/review', 'Review Desk', PanelTop], ['/demo/records', 'Publication Records', Fingerprint]
] as const;
export function WorkspaceShell({ children }: { children: React.ReactNode }) {
  const { state, mode, error, notice, busy, clearError, reload } = useWorkspace();
  const [open, setOpen] = useState(false), [help, setHelp] = useState(false);
  const path = usePathname();
  const page = navigation.find(([href]) => href === path)?.[1] ?? 'Workspace';
  return <div className="workspace"><a href="#workspace-content" className="skip-link">Skip to content</a><aside className={`sidebar ${open ? 'is-open' : ''}`}>
    <div className="sidebar-brand"><Brand/><button className="mobile-close" onClick={() => setOpen(false)} aria-label="Close navigation"><X size={20}/></button></div>
    <div className="workspace-switch"><div className="northline-icon">n<span>↗</span></div><div><strong>Northline</strong><span>Brand workspace</span></div><span className="demo-tag mono">DEMO</span></div>
    <div className="sidebar-section mono">YOUR EDITORIAL DESK</div><nav aria-label="Workspace navigation">{navigation.map(([href,label,Icon], index) => <Link key={href} href={href} className={path === href ? 'active' : ''} aria-current={path === href ? 'page' : undefined} onClick={() => setOpen(false)}><Icon size={17} strokeWidth={1.5}/><span>{label}</span>{index === 3 && !!state?.contents.filter(c => c.state === 'in_review').length && <span className="nav-count">{state.contents.filter(c => c.state === 'in_review').length}</span>}</Link>)}</nav>
    <div className="sidebar-bottom"><div className="workspace-note"><span className="mono">A FICTIONAL BRAND.<br/>A REAL REVIEW PROCESS.</span><p>Explore both sides of the desk. You are the creator, reviewer, and brand administrator in this demo.</p><button className="sidebar-help" onClick={() => setHelp(!help)}><CircleHelp size={14}/> {help ? 'Hide walkthrough' : 'A quick orientation'} <ArrowUpRight size={12}/></button></div><div className="user-profile"><span className="avatar">DO</span><div><strong>Demo owner</strong><span>Creator · Reviewer · Admin</span></div><ShieldCheck size={15}/></div></div>
  </aside>{open && <button className="nav-backdrop" onClick={() => setOpen(false)} aria-label="Close navigation"/>}
    <div className="workspace-main"><header className="workspace-topbar"><div className="topbar-location"><button className="mobile-menu" aria-label="Open navigation" onClick={() => setOpen(true)}><Menu size={20}/></button><span>Workspace</span><span className="slash">/</span><strong>{page}</strong></div><div className="topbar-right"><span className="storage-indicator"><i/>{mode === 'hosted' ? 'Isolated Supabase session' : mode === 'local' ? 'Local browser demo' : 'Opening workspace'}</span><button onClick={() => state && downloadJSON('colophon-workspace.json', state)} disabled={!state || busy} aria-label="Export saved workspace" title="Export saved workspace"><Download size={16}/></button><Link href="/" className="back-home" aria-label="Visit Colophon home"><ArrowUpRight size={16}/></Link></div></header>
      <div className="demo-banner"><span className="mono">NORTHLINE IS FICTIONAL</span><p>{mode === 'hosted' ? 'Your anonymous workspace is isolated. Demo owner holds all three roles.' : 'Saved in this browser only. No production authentication. Export your work to keep a copy.'}</p></div>
      <main id="workspace-content" className="workspace-content">{error && <div role="alert" className="error split"><div>{error}</div><div className="actions"><button className="text-link" onClick={reload}>Reload</button><button onClick={clearError} aria-label="Dismiss error"><X size={16}/></button></div></div>}{help && <div className="orientation"><span className="eyebrow">Your first review, in five steps</span><p><b>1.</b> Open Content Studio and load a sample. <b>2.</b> Run Brand Review and inspect its evidence. <b>3.</b> Correct, save, and rescan. <b>4.</b> Submit and make an explicit decision at the Review Desk. <b>5.</b> Open your Publication Record.</p><button className="text-link" onClick={() => setHelp(false)}>Got it <Check size={13}/></button></div>}{!state ? <div aria-busy="true" aria-label="Loading workspace"><div className="skeleton" style={{ width: '32%' }}/><div className="skeleton large"/>{error && <p className="muted">No saved data has been overwritten.</p>}</div> : children}</main>
      <footer className="workspace-footer"><span>COLOPHON <span> / </span> THE RECORD BEHIND EVERY PUBLISH.</span><span>Human judgment, with the evidence in view.</span></footer>
    </div>{notice && <div className="toast" role="status"><Check size={16}/>{notice}</div>}
  </div>;
}
