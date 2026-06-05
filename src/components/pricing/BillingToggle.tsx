'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type BillingCycle = 'monthly' | 'annual';

type BillingToggleProps = {
  current: BillingCycle;
};

export function BillingToggle({ current }: BillingToggleProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const setCycle = (cycle: BillingCycle) => {
    const params = new URLSearchParams(searchParams.toString());
    if (cycle === 'annual') {
      params.set('billing', 'annual');
    } else {
      params.delete('billing');
    }
    router.push(`/pricing?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-1 rounded-md border border-border bg-card p-1">
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          'h-8 px-4 text-sm',
          current === 'monthly' && 'bg-accent text-foreground',
        )}
        onClick={() => setCycle('monthly')}
      >
        Monthly
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          'h-8 gap-2 px-4 text-sm',
          current === 'annual' && 'bg-accent text-foreground',
        )}
        onClick={() => setCycle('annual')}
      >
        Annual
        <Badge
          variant="outline"
          className="border-green-500/40 text-green-400 text-xs"
        >
          Save 20%
        </Badge>
      </Button>
    </div>
  );
}
