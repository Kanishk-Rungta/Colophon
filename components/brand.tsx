import Link from 'next/link';
export function Brand({ href = '/' }: { href?: string }) {
  return <Link href={href} className="wordmark" aria-label="Colophon home"><span className="brandmark" aria-hidden="true"><i/><i/><i/></span>colophon<span className="brand-period">.</span></Link>;
}
