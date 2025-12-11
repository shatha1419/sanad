import { ReactNode } from 'react';
import { Navbar } from './Navbar';
import { FloatingChat } from '@/components/FloatingChat';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-16 pb-20 md:pb-8">
        {children}
      </main>
      <FloatingChat />
    </div>
  );
}
