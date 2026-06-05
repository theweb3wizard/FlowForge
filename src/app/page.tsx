import Link from 'next/link';
import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

type ComparisonCell = boolean | 'shutting-down';

const comparisonRows: Array<{
  tool: string;
  custom: ComparisonCell;
  multiStep: ComparisonCell;
  variables: ComparisonCell;
  gui: ComparisonCell;
  free: ComparisonCell;
  highlight?: boolean;
}> = [
  {
    tool: 'FlowForge',
    custom: true,
    multiStep: true,
    variables: true,
    gui: true,
    free: true,
    highlight: true,
  },
  {
    tool: 'Remix IDE',
    custom: true,
    multiStep: false,
    variables: false,
    gui: true,
    free: true,
  },
  {
    tool: 'Thirdweb',
    custom: true,
    multiStep: false,
    variables: false,
    gui: true,
    free: true,
  },
  {
    tool: 'Hardhat Ignition',
    custom: true,
    multiStep: true,
    variables: true,
    gui: false,
    free: true,
  },
  {
    tool: 'OpenZeppelin Defender',
    custom: true,
    multiStep: true,
    variables: false,
    gui: true,
    free: 'shutting-down',
  },
];

function ComparisonValue({ value }: { value: ComparisonCell }) {
  if (value === 'shutting-down') {
    return <span className="text-sm text-warning">Shutting Down</span>;
  }

  return value ? (
    <Check className="mx-auto h-4 w-4 text-success" />
  ) : (
    <X className="mx-auto h-4 w-4 text-muted-foreground" />
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <section className="mx-auto max-w-screen-xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-warning/30 bg-warning/10 px-3 py-1 text-xs text-warning">
              <span className="h-1.5 w-1.5 rounded-full bg-warning" />
              OZ Defender shuts down July 1st, 2026
            </div>
            <div className="space-y-4">
              <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
                Build deployment workflows. Run them on any EVM chain.
              </h1>
              <p className="max-w-xl text-lg text-muted-foreground">
                Define a sequence of contract deployments once. Reuse it across
                testnets and mainnet. No scripts, no copy-paste errors.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/sign-in">Start Building Free</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/recipe/shared/demo">View a Demo Recipe</Link>
              </Button>
            </div>
            <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
              <span>No local setup</span>
              <span>Any EVM chain</span>
              <span>Variable passing</span>
            </div>
          </div>

          <div className="hidden lg:block">
            <div className="rounded-lg border border-border bg-card p-6 font-mono text-sm">
              <p className="mb-4 text-muted-foreground">Recipe Execution</p>
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-md border border-border bg-background px-4 py-3">
                  <span>Step 1: Deploy Token</span>
                  <span className="text-success">✓</span>
                </div>
                <div className="flex items-center justify-between rounded-md border border-border bg-background px-4 py-3">
                  <span>Step 2: Deploy Staking</span>
                  <span className="text-success">✓</span>
                </div>
                <div className="flex items-center justify-between rounded-md border border-warning/40 bg-background px-4 py-3">
                  <span>Step 3: Grant Minter Role</span>
                  <span className="animate-pulse text-warning">◌ Running</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-screen-xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tool</TableHead>
                <TableHead className="text-center">Deploy Custom Contracts</TableHead>
                <TableHead className="text-center">Multi-Step Workflows</TableHead>
                <TableHead className="text-center">Variable Passing</TableHead>
                <TableHead className="text-center">GUI (No CLI)</TableHead>
                <TableHead className="text-center">Free to Start</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {comparisonRows.map((row) => (
                <TableRow
                  key={row.tool}
                  className={row.highlight ? 'bg-accent/40' : undefined}
                >
                  <TableCell className="font-medium">{row.tool}</TableCell>
                  <TableCell><ComparisonValue value={row.custom} /></TableCell>
                  <TableCell><ComparisonValue value={row.multiStep} /></TableCell>
                  <TableCell><ComparisonValue value={row.variables} /></TableCell>
                  <TableCell><ComparisonValue value={row.gui} /></TableCell>
                  <TableCell><ComparisonValue value={row.free} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      <section className="mx-auto max-w-screen-xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              title: 'No Local Setup',
              description:
                'Connect your wallet and start building. No Node.js, no config files, no terminal.',
            },
            {
              title: 'Variable Passing',
              description:
                'Each step automatically receives the contract address from the previous step. No copy-paste.',
            },
            {
              title: 'Share Recipes',
              description:
                'Generate a link to your recipe. Your team runs the same workflow on any chain.',
            },
          ].map((item) => (
            <Card key={item.title}>
              <CardHeader>
                <CardTitle className="text-lg">{item.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm leading-relaxed">
                  {item.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-screen-xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-6 rounded-lg border border-border bg-card p-8 sm:flex-row sm:items-center">
          <h2 className="text-2xl font-semibold tracking-tight">
            Ready to stop writing deployment scripts?
          </h2>
          <Button asChild size="lg">
            <Link href="/sign-in">Get Started Free</Link>
          </Button>
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        FlowForge by The Web3 Wizard · Built for EVM Developers
      </footer>
    </div>
  );
}
