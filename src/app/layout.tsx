import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import { Providers } from '@/components/layout/Providers';
import { cn } from '@/lib/utils';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
  preload: false,
  fallback: ['system-ui', '-apple-system', 'sans-serif'],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
  preload: false,
  fallback: ['Courier New', 'monospace'],
});

export const metadata: Metadata = {
  title: 'FlowForge',
  description: 'Build deployment workflows for any EVM chain.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={cn(
          'bg-background font-sans text-foreground antialiased',
          inter.variable,
          jetbrainsMono.variable,
        )}
      >
        <Providers>{children}</Providers>
        {/* Paddle.js — loaded after page is interactive (strategy="lazyOnload") */}
        <Script
          src="https://cdn.paddle.com/paddle/v2/paddle.js"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}
