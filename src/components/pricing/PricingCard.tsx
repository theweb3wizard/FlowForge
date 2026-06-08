import Link from 'next/link';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const ALL_FEATURES = [
  'Unlimited recipes',
  'Testnet & mainnet deployments',
  'Full builder UI',
  'Execution history',
  'Share recipes via URL',
  'Export execution CSV',
  'Variable passing between steps',
  'All 9 supported EVM chains',
  'Drag-and-drop step reordering',
  'Starter templates',
  'Team workspace',
  'Priority support',
];

export function PricingCard() {
  return (
    <Card className="relative flex flex-col border-primary/60 shadow-lg shadow-primary/5">
      <CardHeader className="pb-4">
        <CardTitle className="text-base">Free & Open Source</CardTitle>
        <div className="mt-2 flex items-end gap-1">
          <span className="text-4xl font-bold">$0</span>
          <span className="mb-1 text-sm text-muted-foreground">/forever</span>
        </div>
        <p className="text-sm text-muted-foreground">
          Everything is free. No limits, no paywalls, no subscription required.
        </p>
      </CardHeader>

      <CardContent className="flex-1">
        <ul className="space-y-2.5">
          {ALL_FEATURES.map((feature) => (
            <li key={feature} className="flex items-start gap-2.5 text-sm">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
              <span className="text-foreground">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>

      <CardFooter>
        <Button className="w-full" asChild>
          <Link href="/sign-in">Start Building Free</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
