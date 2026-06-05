'use client';

import { useState } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { ChevronDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { UserAvatar } from '@/components/common/UserAvatar';
import { truncateAddress } from '@/utils/formatAddress';

export function ConnectWalletButton() {
  const { address, isConnected, isConnecting } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const [open, setOpen] = useState(false);

  const isLoading = isConnecting || isPending;

  if (isConnected && address) {
    return (
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary" className="gap-2">
            <UserAvatar address={address} />
            {truncateAddress(address)}
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => disconnect()}>
            Disconnect
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  const injectedConnector =
    connectors.find((connector) => connector.id === 'injected') ??
    injected();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="secondary" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Connecting...
            </>
          ) : (
            'Connect Wallet'
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => connect({ connector: injectedConnector })}
        >
          MetaMask / Injected Wallet
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
