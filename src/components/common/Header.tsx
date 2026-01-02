
"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button, buttonVariants } from '@/components/ui/button';
import { useWallet } from '@/contexts/WalletContext';
import { ConnectWalletDialog } from './ConnectWalletDialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Wallet, LogOut, Home, LayoutDashboard, Menu, FilePlus } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '../ui/sheet';
import { cn } from '@/lib/utils';
import { ThemeToggle } from './ThemeToggle';
import { Layers } from 'lucide-react';

const NavLinks = ({ isMobile = false }: { isMobile?: boolean }) => {
  const { address } = useWallet();
  const commonClasses = "justify-start text-base";
  
  if (isMobile) {
    return (
      <nav className="flex flex-col space-y-2">
        <Link href="/" className={cn(buttonVariants({ variant: 'ghost' }), commonClasses)}>
          <Home className="mr-3 h-5 w-5" />
          Home
        </Link>
        <Link href="/dashboard" className={cn(buttonVariants({ variant: 'ghost' }), commonClasses)}>
          <LayoutDashboard className="mr-3 h-5 w-5" />
          Dashboard
        </Link>
        {address && (
          <>
            <Link href="/dashboard/recipes" className={cn(buttonVariants({ variant: 'ghost' }), commonClasses)}>
              <Layers className="mr-3 h-5 w-5" />
              Recipes
            </Link>
            <Link href="/dashboard/templates" className={cn(buttonVariants({ variant: 'ghost' }), commonClasses)}>
              <FilePlus className="mr-3 h-5 w-5" />
              Templates
            </Link>
          </>
        )}
      </nav>
    );
  }

  return (
    <nav className="flex items-center space-x-6 text-sm font-medium">
      <Link href="/" className="text-muted-foreground transition-colors hover:text-foreground">
        Home
      </Link>
      <Link href="/dashboard" className="text-muted-foreground transition-colors hover:text-foreground">
        Dashboard
      </Link>
      {address && (
        <>
          <Link href="/dashboard/recipes" className="text-muted-foreground transition-colors hover:text-foreground flex items-center gap-2">
            <Layers className="h-4 w-4" />
            Recipes
          </Link>
          <Link href="/dashboard/templates" className="text-muted-foreground transition-colors hover:text-foreground flex items-center gap-2">
            <FilePlus className="h-4 w-4" />
            Templates
          </Link>
        </>
      )}
    </nav>
  );
};


export function Header() {
  const [isWalletDialogOpen, setWalletDialogOpen] = useState(false);
  const { address, disconnect } = useWallet();
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const WalletButton = () => {
    if (!hasMounted) {
      // Render a consistent, disabled placeholder on the server and initial client render.
      return (
        <Button
          disabled
          className="bg-primary hover:bg-primary/90 hover:shadow-glow-accent transition-shadow duration-300"
        >
          <Wallet className="mr-2 h-4 w-4" />
          Connect Wallet
        </Button>
      );
    }
    
    if (address) {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              <span className="font-mono">{`${address.slice(0, 6)}...${address.slice(-4)}`}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => disconnect()}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Disconnect</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }
    return (
      <Button
        onClick={() => setWalletDialogOpen(true)}
        className="bg-primary hover:bg-primary/90 hover:shadow-glow-accent transition-shadow duration-300"
      >
        <Wallet className="mr-2 h-4 w-4" />
        Connect Wallet
      </Button>
    );
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="mr-4 hidden md:flex">
            <Link href="/" className="mr-6 flex items-center space-x-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" className="h-6 w-6 fill-primary">
                <path d="M213.6,82.3,144,46.33a15.89,15.89,0,0,0-16.1,0l-69.6,36A16,16,0,0,0,52,96.57V159.43a16,16,0,0,0,6.3,14.27l69.6,36a15.89,15.89,0,0,0,16.1,0l69.6-36a16,16,0,0,0,6.3-14.27V96.57A16,16,0,0,0,213.6,82.3Z" opacity="0.2"></path><path d="M220,96.57a16,16,0,0,0-6.4-14.27l-69.6-36a15.89,15.89,0,0,0-16.1,0l-69.6,36A16,16,0,0,0,52,96.57v62.86a16,16,0,0,0,6.3,14.27l69.6,36a15.89,15.89,0,0,0,16.1,0l69.6-36A16,16,0,0,0,220,159.43ZM128,197.67,64,164.57v-63l64,33.1ZM136,124,66.4,88.4,136,52.83l69.6,35.57Z"></path>
              </svg>
              <span className="hidden font-bold sm:inline-block font-headline text-lg">FlowForge</span>
            </Link>
            <NavLinks />
          </div>

          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="pr-0">
                <SheetHeader>
                   <Link href="/" className="flex items-center space-x-2 mb-6">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" className="h-6 w-6 fill-primary">
                          <path d="M213.6,82.3,144,46.33a15.89,15.89,0,0,0-16.1,0l-69.6,36A16,16,0,0,0,52,96.57V159.43a16,16,0,0,0,6.3,14.27l69.6,36a15.89,15.89,0,0,0,16.1,0l-69.6-36a16,16,0,0,0,6.3-14.27V96.57A16,16,0,0,0,213.6,82.3Z" opacity="0.2"></path><path d="M220,96.57a16,16,0,0,0-6.4-14.27l-69.6-36a15.89,15.89,0,0,0-16.1,0l-69.6,36A16,16,0,0,0,52,96.57v62.86a16,16,0,0,0,6.3,14.27l69.6,36a15.89,15.89,0,0,0,16.1,0l69.6-36A16,16,0,0,0,220,159.43ZM128,197.67,64,164.57v-63l64,33.1ZM136,124,66.4,88.4,136,52.83l69.6,35.57Z"></path>
                      </svg>
                      <span className="font-bold font-headline text-lg">FlowForge</span>
                   </Link>
                   <SheetTitle className="sr-only">Navigation</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col space-y-2 mt-4">
                  <NavLinks isMobile={true} />
                </div>
              </SheetContent>
            </Sheet>
          </div>
          
          <div className="flex flex-1 items-center justify-end space-x-2">
            <ThemeToggle />
            <WalletButton />
          </div>
        </div>
      </header>
      <ConnectWalletDialog open={isWalletDialogOpen} onOpenChange={setWalletDialogOpen} />
    </>
  );
}
