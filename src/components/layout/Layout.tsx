import { ReactNode } from 'react';
import { FloatingChat } from '@/components/FloatingChat';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <main>
        {children}
      </main>
      <FloatingChat />
    </div>
  );
}
