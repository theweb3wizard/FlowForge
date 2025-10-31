"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/contexts/WalletContext';
import { ConnectWalletDialog } from './ConnectWalletDialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Wallet, LogOut } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '../ui/sheet';
import { Menu } from 'lucide-react';

const NavLinks = ({ className }: { className?: string }) => (
  <nav className={className}>
    <Link href="/" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
      Home
    </Link>
    <Link href="/dashboard" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
      Dashboard
    </Link>
  </nav>
);

export function Header() {
  const [isWalletDialogOpen, setWalletDialogOpen] = useState(false);
  const { address, disconnect } = useWallet();

  const WalletButton = () => {
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
            <NavLinks className="hidden md:flex items-center space-x-6" />
          </div>

          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left">
                <div className="flex flex-col space-y-4 p-4">
                  <Link href="/" className="flex items-center space-x-2">
                    <span className="font-bold font-headline text-lg">FlowForge</span>
                  </Link>
                  <NavLinks className="flex flex-col space-y-3" />
                </div>
              </SheetContent>
            </Sheet>
          </div>
          
          <div className="flex flex-1 items-center justify-end space-x-4">
            <WalletButton />
          </div>
        </div>
      </header>
      <ConnectWalletDialog open={isWalletDialogOpen} onOpenChange={setWalletDialogOpen} />
    </>
  );
}
