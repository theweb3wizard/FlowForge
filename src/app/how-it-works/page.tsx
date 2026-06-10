import type { Metadata } from 'next';
import { ArrowRight, Globe, Cpu, Shield } from 'lucide-react';
import { HowItWorks3D } from '@/components/three/HowItWorks3D';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'How It Works | FlowForge',
  description:
    'See how FlowForge makes multi-step smart contract deployments visual, repeatable, and chain-agnostic.',
};

const STEPS = [
  {
    icon: Globe,
    title: 'Multi-Chain by Design',
    description:
      'Define your recipe once, deploy on any of 9 supported EVM chains — Ethereum, Base, Polygon, Arbitrum, Optimism, BNB Chain, BlockDAG, and testnets.',
  },
  {
    icon: Cpu,
    title: 'Client-Side Execution',
    description:
      'All transactions go through your wallet. FlowForge never holds private keys. Each step result is persisted instantly — if you close the tab mid-run, completed steps are safe.',
  },
  {
    icon: Shield,
    title: 'Row-Level Security',
    description:
      'Your recipes are private by default. Toggle sharing to generate a read-only URL for your team. Everything is stored in Supabase with strict access policies.',
  },
];

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-background">
      <section className="mx-auto max-w-screen-xl space-y-12 px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-2xl space-y-4 text-center">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            How It Works
          </h1>
          <p className="text-lg text-muted-foreground">
            Four steps from wallet connect to deployed contracts.
            All through your browser, all free.
          </p>
        </div>

        <HowItWorks3D />

        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
          {STEPS.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.title}
                className="space-y-3 rounded-lg border border-border bg-card p-6"
              >
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold">{step.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>

        <div className="flex flex-col items-center gap-4 rounded-lg border border-border bg-gradient-to-br from-card to-card/50 p-8 text-center">
          <h2 className="text-2xl font-semibold tracking-tight">
            Ready to build your first Recipe?
          </h2>
          <p className="max-w-md text-sm text-muted-foreground">
            No setup. No cost. Just connect your wallet and start deploying.
          </p>
          <Button asChild size="lg" className="gap-2">
            <Link href="/sign-in">
              Get Started Free
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
