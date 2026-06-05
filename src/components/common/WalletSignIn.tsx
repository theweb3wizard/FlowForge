'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount, useConnect } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';

export function WalletSignIn() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { connect, isPending } = useConnect({
    mutation: {
      onError: () => {
        toast.error('Wallet connection was cancelled.');
      },
    },
  });
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const hasAuthenticatedRef = useRef(false);

  useEffect(() => {
    if (!isConnected || !address || hasAuthenticatedRef.current) {
      return;
    }

    async function authenticate() {
      hasAuthenticatedRef.current = true;
      setIsAuthenticating(true);

      try {
        const supabase = createClient();

        // Future migration path: replace anonymous auth with full SIWE.
        const { error: signInError } = await supabase.auth.signInAnonymously();

        if (signInError) {
          console.error('Supabase sign-in failed:', signInError);
          toast.error('Authentication failed. Please try again.');
          hasAuthenticatedRef.current = false;
          return;
        }

        const { error: updateError } = await supabase.auth.updateUser({
          data: { wallet_address: address },
        });

        if (updateError) {
          console.error('Supabase user update failed:', updateError);
          toast.error('Authentication failed. Please try again.');
          hasAuthenticatedRef.current = false;
          return;
        }

        router.push('/dashboard');
        router.refresh();
      } catch (authError) {
        console.error('Authentication error:', authError);
        toast.error('Authentication failed. Please try again.');
        hasAuthenticatedRef.current = false;
      } finally {
        setIsAuthenticating(false);
      }
    }

    void authenticate();
  }, [address, isConnected, router]);

  const handleConnect = () => {
    connect({ connector: injected() });
  };

  const isLoading = isPending || isAuthenticating;

  return (
    <Button
      className="w-full"
      onClick={handleConnect}
      disabled={isLoading || isConnected}
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          {isAuthenticating ? 'Signing in...' : 'Connecting...'}
        </>
      ) : isConnected ? (
        'Wallet connected'
      ) : (
        'Connect Wallet'
      )}
    </Button>
  );
}
