import type { Metadata } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/toaster';
import { Header } from '@/components/common/Header';
import { Footer } from '@/components/common/Footer';
import { DeploymentProvider } from '@/contexts/DeploymentContext';
import { Web3Provider } from '@/components/common/Web3Provider';

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
        <Web3Provider>
          <DeploymentProvider>
            <div vaul-drawer-wrapper="">
              <div className="relative flex min-h-screen flex-col bg-background">
                <Header />
                <main className="flex-1">{children}</main>
                <Footer />
              </div>
            </div>
            <Toaster />
          </DeploymentProvider>
        </Web3Provider>
      </body>
    </html>
  );
}