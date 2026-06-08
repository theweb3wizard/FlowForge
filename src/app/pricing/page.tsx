import type { Metadata } from 'next';
import { Suspense } from 'react';
import { BillingToggle } from '@/components/pricing/BillingToggle';
import { PricingCard } from '@/components/pricing/PricingCard';
import { Separator } from '@/components/ui/separator';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://flowforge.app';

export const metadata: Metadata = {
  title: 'Pricing | FlowForge',
  description:
    'Compare FlowForge plans for EVM deployment workflows. Start free for testnets or upgrade for mainnet, team collaboration, and recipe sharing.',
};

const pricingSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'FlowForge',
  url: `${APP_URL}/pricing`,
  description:
    'A GUI-first smart contract deployment workflow builder for any EVM chain.',
  applicationCategory: 'DeveloperApplication',
  operatingSystem: 'Web',
  offers: [
    {
      '@type': 'Offer',
      name: 'Free Plan',
      price: '0.00',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
      url: `${APP_URL}/pricing`,
    },
    {
      '@type': 'Offer',
      name: 'Builder Plan',
      price: '49.00',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
      url: `${APP_URL}/pricing`,
    },
    {
      '@type': 'Offer',
      name: 'Team Plan',
      price: '99.00',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
      url: `${APP_URL}/pricing`,
    },
  ],
  mainEntity: {
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Can I use FlowForge on mainnet with the free plan?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'No. The free plan supports testnet deployments only. Upgrade to Builder or Team to deploy on mainnet.',
        },
      },
      {
        '@type': 'Question',
        name: 'What chains are supported?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'FlowForge supports 9 EVM chains including Ethereum Mainnet, Polygon, Arbitrum, Optimism, BNB Smart Chain, Base, and BlockDAG Mainnet.',
        },
      },
      {
        '@type': 'Question',
        name: 'Can I cancel anytime?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. Cancel at any time and keep access to paid features until the end of your billing period.',
        },
      },
      {
        '@type': 'Question',
        name: 'Is my contract bytecode stored securely?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. Recipe data is stored with row-level security so only you can access your own recipes unless you share them.',
        },
      },
    ],
  },
};

type PricingPageProps = {
  searchParams: Promise<{ billing?: string }>;
};

const FAQ_ITEMS = [
  {
    question: 'Can I use FlowForge on mainnet with the free plan?',
    answer:
      'No. The free plan supports testnet deployments only (Sepolia, Base Sepolia). Upgrade to Builder or Team to deploy on Ethereum Mainnet, Base, Polygon, Arbitrum, Optimism, BNB Smart Chain, or BlockDAG Mainnet.',
  },
  {
    question: 'What chains are supported?',
    answer:
      'FlowForge supports 9 EVM chains: Ethereum Mainnet, Sepolia, Base, Base Sepolia, Polygon, Arbitrum One, Optimism, BNB Smart Chain, and BlockDAG Mainnet. Testnet access is available on all plans. Mainnet requires Builder or Team.',
  },
  {
    question: 'What happens if my execution fails mid-recipe?',
    answer:
      'Each step result is persisted to your execution history immediately upon completion. If a step fails, you\'ll see exactly which step failed, the error message, and the addresses of any contracts that were successfully deployed before the failure. You can retry from the run page.',
  },
  {
    question: 'Can I cancel anytime?',
    answer:
      'Yes. Cancel at any time from your account settings. You\'ll retain access to your paid features until the end of the current billing period. No data is deleted on cancellation.',
  },
  {
    question: 'Is my contract bytecode stored securely?',
    answer:
      'Yes. Recipe data including ABI and bytecode is stored in your private Supabase database with row-level security — only you can read your own recipes unless you explicitly share them.',
  },
];

export default async function PricingPage({ searchParams }: PricingPageProps) {
  const { billing } = await searchParams;
  const billingCycle = billing === 'annual' ? 'annual' : 'monthly';

  return (
    <div className="mx-auto max-w-5xl space-y-16 px-4 py-12 sm:px-6 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pricingSchema) }}
      />
      {/* Header */}
      <div className="flex flex-col items-center gap-6 text-center">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            Simple, Transparent Pricing
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Start free, upgrade when you ship to mainnet. No hidden fees. No
            platform surcharges on your deployments.
          </p>
        </div>
        <Suspense fallback={<div className="h-10" />}>
          <BillingToggle current={billingCycle} />
        </Suspense>
      </div>

      {/* Pricing cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <PricingCard tier="free" billingCycle={billingCycle} />
        <PricingCard tier="builder" billingCycle={billingCycle} isHighlighted />
        <PricingCard tier="team" billingCycle={billingCycle} />
      </div>

      <Separator />

      {/* FAQ */}
      <div className="mx-auto max-w-2xl space-y-6">
        <h2 className="text-xl font-semibold">Frequently Asked Questions</h2>
        <dl className="space-y-6">
          {FAQ_ITEMS.map((item) => (
            <div key={item.question} className="space-y-2">
              <dt className="font-medium">{item.question}</dt>
              <dd className="text-sm text-muted-foreground">{item.answer}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
