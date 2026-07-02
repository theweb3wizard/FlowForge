import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Providers } from '@/components/layout/Providers';
import { Footer } from '@/components/common/Footer';

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
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f5f3ef' },
    { media: '(prefers-color-scheme: dark)', color: '#0d0d0d' },
  ],
  colorScheme: 'light dark',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var e=localStorage.getItem('flowforge-theme');if(e==='light'||e==='dark')document.documentElement.classList.add(e)}catch(e){}})();`,
          }}
        />
      </head>
      <body className="bg-background text-foreground antialiased">
        <Providers>{children}</Providers>
        <Footer />
      </body>
    </html>
  );
}
