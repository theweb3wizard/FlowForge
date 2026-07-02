'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { ConnectWalletButton } from '@/components/common/ConnectWalletButton';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { cn } from '@/lib/utils';
import { Menu, X } from 'lucide-react';

const navLinks = [
  { href: '/playground', label: 'Playground' },
  { href: '/dashboard', label: 'Recipes' },
  { href: '/how-it-works', label: 'How It Works' },
];

export function AppNav() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="fixed top-0 z-50 h-14 w-full border-b border-border bg-card">
      <div className="mx-auto flex h-full max-w-screen-xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 text-lg font-semibold tracking-tight">
            <span className="text-muted-foreground">Flow</span>
            <span className="text-primary">Forge</span>
            <span className="rounded-md border border-amber/30 bg-amber/10 px-1.5 py-0.5 text-[10px] font-medium text-amber uppercase tracking-wider">
              Beta
            </span>
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            {navLinks.map((link) => {
              const isActive =
                pathname === link.href ||
                pathname.startsWith(`${link.href}/`);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'text-sm transition-colors',
                    isActive
                      ? 'text-foreground underline decoration-foreground/40 underline-offset-4'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <div className="hidden sm:block">
            <ConnectWalletButton />
          </div>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="flex items-center justify-center rounded-md p-2 text-muted-foreground hover:text-foreground md:hidden"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-border bg-card md:hidden">
          <div className="space-y-1 px-4 py-3">
            {navLinks.map((link) => {
              const isActive =
                pathname === link.href ||
                pathname.startsWith(`${link.href}/`);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'block rounded-md px-3 py-2 text-sm transition-colors',
                    isActive
                      ? 'text-foreground bg-accent/50'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent/30',
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
            <div className="pt-2 sm:hidden">
              <ConnectWalletButton />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
