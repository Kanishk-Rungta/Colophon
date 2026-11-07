import Link from 'next/link';
import {ArrowRight} from 'lucide-react';
export default function NotFound(){return <main style={{maxWidth:700,margin:'12vh auto',padding:30}}><span className="eyebrow">COLOPHON / PAGE NOT FOUND</span><h1 style={{fontFamily:'var(--serif)',fontSize:64}}>A page out of place.</h1><p className="muted">The address doesn’t match a Colophon page. Your workspace is still on the desk.</p><Link className="btn" href="/demo">Open the workspace <ArrowRight size={15}/></Link></main>;}
