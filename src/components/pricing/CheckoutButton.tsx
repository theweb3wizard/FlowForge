'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Paddle.js types — the global Paddle object injected by the script tag
declare global {
  interface Window {
    Paddle?: {
      Initialize: (options: { token: string }) => void;
      Checkout: {
        open: (options: PaddleCheckoutOptions) => void;
      };
    };
  }
}

type PaddleCheckoutOptions = {
  items: Array<{ priceId: string; quantity: number }>;
  customer?: {
    email?: string;
  };
  customData?: Record<string, string>;
  settings?: {
    displayMode?: 'overlay' | 'inline';
    theme?: 'light' | 'dark';
    locale?: string;
  };
};

type CheckoutButtonProps = {
  priceId: string;
  label: string;
  variant?: 'default' | 'outline';
  className?: string;
  userEmail?: string;
};

/**
 * Opens a Paddle overlay checkout when clicked.
 * Paddle.js must be loaded via the <Script> tag in layout.tsx.
 * The client-side token (NEXT_PUBLIC_PADDLE_CLIENT_TOKEN) is used
 * to initialize Paddle — it is safe to expose in the browser.
 */
export function CheckoutButton({
  priceId,
  label,
  variant = 'default',
  className,
  userEmail,
}: CheckoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [paddleReady, setPaddleReady] = useState(false);
  const initAttempted = useRef(false);

  // Initialize Paddle.js once the script has loaded
  useEffect(() => {
    if (initAttempted.current) return;

    const clientToken = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;

    if (!clientToken) {
      console.error('NEXT_PUBLIC_PADDLE_CLIENT_TOKEN is not set.');
      return;
    }

    // Paddle.js may not be ready immediately — poll until it is
    const checkPaddle = setInterval(() => {
      if (window.Paddle) {
        clearInterval(checkPaddle);
        initAttempted.current = true;
        window.Paddle.Initialize({ token: clientToken });
        setPaddleReady(true);
      }
    }, 100);

    // Stop polling after 10 seconds to avoid memory leaks
    const timeout = setTimeout(() => {
      clearInterval(checkPaddle);
      if (!paddleReady) {
        console.error('Paddle.js failed to load within 10 seconds.');
      }
    }, 10_000);

    return () => {
      clearInterval(checkPaddle);
      clearTimeout(timeout);
    };
  }, [paddleReady]);

  const handleClick = () => {
    if (!window.Paddle) {
      console.error('Paddle.js is not loaded.');
      return;
    }

    setIsLoading(true);

    window.Paddle.Checkout.open({
      items: [{ priceId, quantity: 1 }],
      ...(userEmail ? { customer: { email: userEmail } } : {}),
      settings: {
        displayMode: 'overlay',
        theme: 'dark',
      },
    });

    // Reset loading state after a short delay
    // (Paddle handles the rest — no navigation happens)
    setTimeout(() => setIsLoading(false), 1500);
  };

  return (
    <Button
      variant={variant}
      className={cn('w-full', className)}
      onClick={handleClick}
      disabled={isLoading || !paddleReady}
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Opening checkout…
        </>
      ) : (
        label
      )}
    </Button>
  );
}
