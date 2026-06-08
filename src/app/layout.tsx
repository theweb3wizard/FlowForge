import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import { Providers } from '@/components/layout/Providers';
import { Footer } from '@/components/common/Footer';
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

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://flowforge.app';

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: 'FlowForge — EVM Deployment Workflow Builder',
    template: '%s · FlowForge',
  },
  description:
    'Build multi-step smart contract deployment workflows for any EVM chain. Define once, run anywhere. The GUI-first alternative to Hardhat Ignition and OpenZeppelin Defender.',
  keywords: [
    'smart contract deployment',
    'EVM',
    'blockchain developer tools',
    'deployment workflow',
    'recipe builder',
    'OpenZeppelin Defender alternative',
    'Hardhat Ignition GUI',
    'wagmi',
    'viem',
    'Ethereum',
    'Base',
    'Arbitrum',
  ],
  authors: [{ name: 'The Web3 Wizard', url: 'https://github.com/theweb3wizard' }],
  creator: 'The Web3 Wizard (Khalid)',

  // Favicon / icons
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },

  // Open Graph — controls appearance on LinkedIn, Discord, Telegram, Facebook
  openGraph: {
    type: 'website',
    url: APP_URL,
    title: 'FlowForge — EVM Deployment Workflow Builder',
    description:
      'Stop writing deployment scripts. Build a Recipe instead. Define multi-step contract deployments once, run them on 9 EVM chains. The OZ Defender alternative.',
    siteName: 'FlowForge',
    images: [
      {
        url: '/og-image.svg',
        width: 1200,
        height: 630,
        alt: 'FlowForge — Build deployment workflows for any EVM chain',
      },
    ],
  },

  // Twitter / X card
  twitter: {
    card: 'summary_large_image',
    title: 'FlowForge — EVM Deployment Workflow Builder',
    description:
      'Stop writing deployment scripts. Build a Recipe instead. Define multi-step contract deployments once, run them on 9 EVM chains.',
    images: ['/og-image.svg'],
    creator: '@theweb3wizard',
  },

  // PWA / browser appearance
  themeColor: '#0A0A0A',
  colorScheme: 'dark',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },

  // Robots
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
    },
  },
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
        <Footer />
        {/* Paddle.js — loaded after page is interactive (strategy="lazyOnload") */}
        <Script
          src="https://cdn.paddle.com/paddle/v2/paddle.js"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}
