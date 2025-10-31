"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/contexts/WalletContext';

interface ConnectWalletDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ConnectWalletDialog({ open, onOpenChange }: ConnectWalletDialogProps) {
  const { connect, connectors, error } = useWallet();

  const handleConnect = (connector: any) => {
    connect({ connector });
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
          {connectors.filter(c => c.name !== 'Injected').map((connector) => (
            <Button 
              key={connector.id} 
              variant="outline" 
              className="justify-start text-left h-14" 
              onClick={() => handleConnect(connector)}
            >
              <span className="text-lg font-medium">{connector.name}</span>
            </Button>
          ))}
        </div>
        {error && <p className="text-sm text-destructive">{error.message}</p>}
      </DialogContent>
    </Dialog>
  );
}
