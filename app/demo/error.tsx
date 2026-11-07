'use client';
import Link from 'next/link';
export default function WorkspaceError({reset}:{reset:()=>void}){return <div className="empty"><span className="eyebrow">COLOPHON / VIEW UNAVAILABLE</span><h2>Let’s reopen the desk.</h2><p>This view could not load. Retry, or return to the workspace overview.</p><div className="actions" style={{justifyContent:'center'}}><button className="btn" onClick={reset}>Retry this view</button><Link href="/demo" className="btn secondary">Workspace overview</Link></div></div>;}
