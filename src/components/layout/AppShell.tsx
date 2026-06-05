import type { ReactNode } from 'react';
import { AppNav } from '@/components/layout/AppNav';

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-background">
      <AppNav />
      <div className="mx-auto max-w-screen-xl px-4 pb-8 pt-14 sm:px-6 lg:px-8">
        {children}
      </div>
    </div>
  );
}
