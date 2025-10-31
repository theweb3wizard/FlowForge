"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/contexts/WalletContext';

interface ConnectWalletDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ConnectWalletDialog({ open, onOpenChange }: ConnectWalletDialogProps) {
  const { connect } = useWallet();

  const handleConnect = (walletType: string) => {
    // In a real app, you'd have specific logic for each wallet type.
    console.log(`Connecting with ${walletType}...`);
    connect();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Connect a wallet</DialogTitle>
          <DialogDescription>
            Choose your wallet provider to continue.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Button variant="outline" className="justify-start text-left h-14" onClick={() => handleConnect('MetaMask')}>
            <span className="text-lg font-medium">MetaMask</span>
          </Button>
          <Button variant="outline" className="justify-start text-left h-14" onClick={() => handleConnect('WalletConnect')}>
            <span className="text-lg font-medium">WalletConnect</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
