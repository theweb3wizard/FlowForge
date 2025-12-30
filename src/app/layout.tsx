import type { Metadata } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';
import { Header } from '@/components/common/Header';
import { Footer } from '@/components/common/Footer';
import { Web3Provider } from '@/components/common/Web3Provider';
import { ThemeProvider } from '@/components/common/ThemeProvider';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { Toaster } from '@/components/common/Toaster';
import { BatchProvider } from '@/contexts/BatchContext';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
});

export const metadata: Metadata = {
  title: 'FlowForge',
  description: 'Deploy smart contracts to the BlockDAG testnet without writing code.',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          'min-h-screen bg-background font-body text-foreground antialiased',
          inter.variable,
          spaceGrotesk.variable
        )}
      >
        <ErrorBoundary>
          <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
          >
              <BatchProvider>
              <Web3Provider>
                <div vaul-drawer-wrapper="">
                  <div className="relative flex min-h-screen flex-col bg-background">
                    <Header />
                    <main className="flex-1">{children}</main>
                    <Footer />
                  </div>
                </div>
                <Toaster />
              </Web3Provider>
            </BatchProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
