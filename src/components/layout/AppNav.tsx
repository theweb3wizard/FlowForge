'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ConnectWalletButton } from '@/components/common/ConnectWalletButton';
import { cn } from '@/lib/utils';

const navLinks = [
  { href: '/dashboard', label: 'Recipes' },
  { href: '/pricing', label: 'Pricing' },
];

export function AppNav() {
  const pathname = usePathname();

  return (
    <header className="fixed top-0 z-50 h-14 w-full border-b border-border bg-card">
      <div className="mx-auto flex h-full max-w-screen-xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            <span className="text-muted-foreground">Flow</span>
            <span className="text-primary">Forge</span>
          </Link>
          <nav className="hidden items-center gap-6 sm:flex">
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
        <ConnectWalletButton />
      </div>
    </header>
  );
}
