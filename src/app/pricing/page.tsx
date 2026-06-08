import type { Metadata } from 'next';
import { PricingCard } from '@/components/pricing/PricingCard';
import { Separator } from '@/components/ui/separator';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://flowforge.app';

export const metadata: Metadata = {
  title: 'Pricing | FlowForge',
  description:
    'FlowForge is completely free and open source. Unlimited recipes, all chains, no paywalls.',
};

const pricingSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'FlowForge',
  url: `${APP_URL}/pricing`,
  description:
    'A GUI-first smart contract deployment workflow builder for any EVM chain. Free and open source.',
  applicationCategory: 'DeveloperApplication',
  operatingSystem: 'Web',
  offers: {
    '@type': 'Offer',
    name: 'Free Plan',
    price: '0.00',
    priceCurrency: 'USD',
    availability: 'https://schema.org/InStock',
    url: `${APP_URL}/pricing`,
  },
};

const FAQ_ITEMS = [
  {
    question: 'Is FlowForge really free?',
    answer:
      'Yes. FlowForge is completely free and open source with no limits, no paywalls. All features are available to everyone.',
  },
  {
    question: 'What chains are supported?',
    answer:
      'FlowForge supports 9 EVM chains: Ethereum Mainnet, Sepolia, Base, Base Sepolia, Polygon, Arbitrum One, Optimism, BNB Smart Chain, and BlockDAG Mainnet.',
  },
  {
    question: 'Are there any limits on recipes or features?',
    answer:
      'None. Unlimited recipes, unlimited executions, mainnet and testnet support, sharing, CSV export, team workspace — all included.',
  },
  {
    question: 'What happens if my execution fails mid-recipe?',
    answer:
      'Each step result is persisted to your execution history immediately upon completion. If a step fails, you\'ll see exactly which step failed, the error message, and the addresses of any contracts that were successfully deployed before the failure.',
  },
  {
    question: 'Is my contract bytecode stored securely?',
    answer:
      'Yes. Recipe data including ABI and bytecode is stored in your private Supabase database with row-level security — only you can read your own recipes unless you explicitly share them.',
  },
];

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-16 px-4 py-12 sm:px-6 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pricingSchema) }}
      />
      <div className="flex flex-col items-center gap-6 text-center">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            Free & Open Source
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            FlowForge is now completely free and open source. No limits, no paywalls,
            no subscription required.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-md">
        <PricingCard />
      </div>

      <Separator />

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
