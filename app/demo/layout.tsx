import { WorkspaceProvider } from '@/components/workspace-provider';
import { WorkspaceShell } from '@/components/workspace-shell';
import './workspace.css';
import './details.css';
import './readability.css';
export const metadata = { title: 'Northline workspace' };
export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return <WorkspaceProvider><WorkspaceShell>{children}</WorkspaceShell></WorkspaceProvider>;
}
