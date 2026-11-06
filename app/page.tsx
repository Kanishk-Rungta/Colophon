import Link from 'next/link';
import { ArrowUpRight, ArrowRight, Check, Fingerprint, ScanLine, ShieldCheck } from 'lucide-react';
import './landing.css';

export function Brand({ href = '/' }: { href?: string }) {
  return <Link href={href} className="wordmark" aria-label="Colophon home"><span className="brandmark" aria-hidden="true"><i/><i/><i/></span>colophon<span className="brand-period">.</span></Link>;
}
export default function Home() {
  return <main className="landing">
    <a className="skip-link" href="#main">Skip to content</a>
    <header className="landing-nav"><Brand/><nav aria-label="Main navigation"><a href="#workflow">The workflow</a><a href="#record">The publication record</a></nav><Link className="nav-cta" href="/demo">Enter workspace <ArrowUpRight size={15}/></Link></header>
    <section className="hero" id="main">
      <div className="hero-grid" aria-hidden="true"/>
      <div className="hero-copy"><div className="eyebrow"><span className="live-dot"/>Evidence-first brand governance</div><h1>Every claim<br/>leaves a <em>trail.</em></h1><p>Good content deserves solid ground.<br/>Review what your brand is about to publish against the facts, rules, and language it has actually approved.</p><div className="hero-actions"><Link className="btn light" href="/demo">Open the demo workspace <ArrowUpRight size={17}/></Link><a className="text-link" href="#workflow">Explore the workflow <ArrowRight size={14}/></a></div><div className="hero-footnote"><span className="tiny-line"/>No signup. Fictional brand. Real verification.</div></div>
      <div className="hero-investigation" aria-label="Illustrative product preview">
        <div className="investigation-top mono"><span>01 / A draft under the lens</span><span>ILLUSTRATIVE PREVIEW</span></div>
        <div className="orbit orbit-one"/><div className="orbit orbit-two"/>
        <div className="source-chip source-top"><span className="source-symbol"><Fingerprint size={19}/></span><div><b>FACT-021</b><span>12,400 customers</span></div><span className="source-check"><Check size={11}/></span></div>
        <svg className="trace-lines" viewBox="0 0 600 500" fill="none" aria-hidden="true"><path d="M420 95V170H354V216"/><path d="M138 310V383H230V421"/><circle cx="354" cy="216" r="4"/><circle cx="138" cy="310" r="4"/></svg>
        <div className="inspection-paper"><div className="paper-meta mono"><span>NORTHLINE / LAUNCH COPY</span><ScanLine size={15}/></div><p>Our <span className="term-mark">AI autopilot</span> guarantees 40% faster results for <span className="fact-mark">20,000 customers.</span></p><div className="paper-bottom"><span className="paper-status"><i/>3 findings. 3 evidence trails.</span><span className="mono">DRAFT 01</span></div><div className="scan-beam"/></div>
        <div className="source-chip source-bottom"><span className="source-symbol terracotta"><ShieldCheck size={19}/></span><div><b>A claim needs a source.</b><span>CLAIM-004 · Review required</span></div><ArrowUpRight size={14}/></div>
        <div className="investigation-caption mono"><span>THE WORDS. THE EVIDENCE. THE DECISION.</span><span>↳ CONNECTED.</span></div>
      </div>
    </section>
    <div className="principle-strip"><span className="mono">THE COLOPHON PRINCIPLE</span><p>Every consequential finding needs evidence.<br className="mobile-break"/> Every exception needs an accountable decision.</p><span className="strip-cross">✳</span></div>
    <section className="workflow-section" id="workflow"><div className="section-intro"><div><span className="eyebrow">From first draft to final decision</span><h2>A little scrutiny.<br/><em>A lot more confidence.</em></h2></div><p>Not another writing generator. A considered review process that makes the evidence visible and keeps the final decision human.</p></div><div className="workflow-steps">{[
      ['01','Establish what is approved.','Your facts, language, and policies form a living evidence library. The review starts with what your brand actually knows.'],
      ['02','Inspect before you publish.','Check the draft for terminology deviations, numerical conflicts, unsupported guarantees, and tone concerns.'],
      ['03','Follow the evidence.','See the exact phrase, the governing source, and a useful next step. Correct the words. Save a revision. Review again.'],
      ['04','Make the human decision.','An explicit approval turns a reviewed version into a Publication Record, complete with its evidence and decision history.']
    ].map(([n,title,description]) => <article key={n}><span className="step-no mono">{n} /</span><h3>{title}</h3><p>{description}</p></article>)}</div></section>
    <section className="record-feature" id="record"><div className="record-sample"><div className="mono split"><span>COLOPHON / PUBLICATION RECORD</span><span>ILLUSTRATIVE</span></div><div className="sample-stamp"><Check size={27}/></div><h3>This version has<br/>a decision history.</h3><p>One approved revision.<br/>Every source and decision in context.</p><div className="sample-record-line"><span>Content version</span><b>03</b></div><div className="sample-record-line"><span>Decision</span><b>Human approval</b></div><div className="sample-record-line"><span>Evidence trail</span><b>Preserved</b></div></div><div className="record-copy"><span className="eyebrow">The record behind every publish</span><h2>Approval is a moment.<br/><em>Context should last.</em></h2><p>A Colophon Publication Record brings together the approved words, the policies behind them, and the person who made the decision. So the next question starts with a record.</p><Link className="btn light" href="/demo/studio">Review your first draft <ArrowUpRight size={17}/></Link></div></section>
    <footer className="landing-footer"><Brand/><span>The record behind every publish.</span><span className="mono">SCHRODINGERS CODE · CODENEXUS 2026</span></footer>
  </main>;
}
