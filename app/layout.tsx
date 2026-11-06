import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: { default: 'Colophon — The record behind every publish.', template: '%s · Colophon' },
  description: 'Evidence-backed brand checks, thoughtful human decisions, and a record of every approved revision.'
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
