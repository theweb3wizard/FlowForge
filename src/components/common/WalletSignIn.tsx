'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount, useConnect } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { authClient } from '@/lib/auth/client';

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
        // Use Neon Auth to sign in — currently redirects to sign-in page.
        // For full SIWE support, a custom Better Auth plugin would be needed.
        const { data: session } = await authClient.getSession();

        if (session?.user) {
          router.push('/dashboard');
          router.refresh();
        } else {
          router.push('/auth/sign-in');
        }
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
