import Link from 'next/link';
import { Check, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';

type Tier = 'free' | 'builder' | 'team';
type BillingCycle = 'monthly' | 'annual';

type PricingCardProps = {
  tier: Tier;
  billingCycle: BillingCycle;
  isHighlighted?: boolean;
};

type Feature = {
  label: string;
  included: boolean;
};

const TIER_CONFIG: Record<
  Tier,
  {
    name: string;
    monthlyPrice: number;
    annualPrice: number;
    description: string;
    features: Feature[];
    cta: string;
    ctaHref: string;
  }
> = {
  free: {
    name: 'Free',
    monthlyPrice: 0,
    annualPrice: 0,
    description: 'For individual devs exploring and hackathon teams.',
    features: [
      { label: 'Up to 3 recipes', included: true },
      { label: 'Testnet deployments only', included: true },
      { label: 'Full builder UI', included: true },
      { label: 'Execution history (7 days)', included: true },
      { label: 'Mainnet deployments', included: false },
      { label: 'Share recipes via URL', included: false },
      { label: 'Team workspace', included: false },
      { label: 'Priority support', included: false },
    ],
    cta: 'Start Free',
    ctaHref: '/sign-in',
  },
  builder: {
    name: 'Builder',
    monthlyPrice: 49,
    annualPrice: 39,
    description: 'For solo consultants and developers shipping real protocols.',
    features: [
      { label: 'Unlimited recipes', included: true },
      { label: 'Testnet & mainnet deployments', included: true },
      { label: 'Full builder UI', included: true },
      { label: 'Execution history (6 months)', included: true },
      { label: 'Share recipes via URL', included: true },
      { label: 'Export execution CSV', included: true },
      { label: 'Team workspace', included: false },
      { label: 'Priority support', included: false },
    ],
    cta: 'Get Builder',
    ctaHref: '/sign-in',
  },
  team: {
    name: 'Team',
    monthlyPrice: 99,
    annualPrice: 79,
    description: 'For protocol dev teams, agencies, and DeFi studios.',
    features: [
      { label: 'Unlimited recipes', included: true },
      { label: 'Testnet & mainnet deployments', included: true },
      { label: 'Full builder UI', included: true },
      { label: 'Execution history (12 months)', included: true },
      { label: 'Share recipes via URL', included: true },
      { label: 'Export execution CSV', included: true },
      { label: 'Team workspace (up to 5 members)', included: true },
      { label: 'Priority support', included: true },
    ],
    cta: 'Get Team',
    ctaHref: '/sign-in',
  },
};

export function PricingCard({ tier, billingCycle, isHighlighted }: PricingCardProps) {
  const config = TIER_CONFIG[tier];
  const price =
    billingCycle === 'annual' ? config.annualPrice : config.monthlyPrice;

  return (
    <Card
      className={cn(
        'relative flex flex-col',
        isHighlighted && 'border-primary/60 shadow-lg shadow-primary/5',
      )}
    >
      {isHighlighted && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-primary text-primary-foreground text-xs">
            Most Popular
          </Badge>
        </div>
      )}

      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <CardTitle className="text-base">{config.name}</CardTitle>
        </div>
        <div className="mt-2 flex items-end gap-1">
          {price === 0 ? (
            <span className="text-4xl font-bold">$0</span>
          ) : (
            <>
              <span className="text-4xl font-bold">${price}</span>
              <span className="mb-1 text-sm text-muted-foreground">/month</span>
            </>
          )}
        </div>
        {billingCycle === 'annual' && price > 0 && (
          <p className="text-xs text-muted-foreground">
            Billed annually (${price * 12}/yr)
          </p>
        )}
        <p className="text-sm text-muted-foreground">{config.description}</p>
      </CardHeader>

      <CardContent className="flex-1">
        <ul className="space-y-2.5">
          {config.features.map((feature) => (
            <li key={feature.label} className="flex items-start gap-2.5 text-sm">
              {feature.included ? (
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
              ) : (
                <X className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/40" />
              )}
              <span
                className={cn(
                  feature.included
                    ? 'text-foreground'
                    : 'text-muted-foreground/60',
                )}
              >
                {feature.label}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>

      <CardFooter>
        <Button
          className="w-full"
          variant={isHighlighted ? 'default' : 'outline'}
          asChild
        >
          <Link href={config.ctaHref}>{config.cta}</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
