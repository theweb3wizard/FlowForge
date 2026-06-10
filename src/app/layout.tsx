import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
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
    default: 'FlowForge — AI-Powered Smart Contract Playground & Deployment Workflow Builder',
    template: '%s · FlowForge',
  },
  description:
    'Generate, compile, deploy, and interact with smart contracts — all in your browser. AI-powered Solidity generation, live compilation, multi-chain deployment workflows.',
  keywords: [
    'smart contract deployment',
    'AI smart contract generator',
    'Solidity playground',
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
    title: 'FlowForge — AI-Powered Smart Contract Playground',
    description:
      'Generate Solidity with AI, compile live, deploy to any EVM chain, and interact with deployed contracts — all from your browser.',
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
    title: 'FlowForge — AI-Powered Smart Contract Playground',
    description:
      'Generate, compile, deploy, and interact with smart contracts. AI-powered Solidity generation and multi-chain deployment workflows.',
    images: ['/og-image.svg'],
    creator: '@theweb3wizard',
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

export const viewport: Viewport = {
  themeColor: '#0A0A0A',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
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
      </body>
    </html>
  );
}
