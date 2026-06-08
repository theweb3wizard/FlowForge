import Link from 'next/link';
import { Check, X, ArrowRight, Sparkles } from 'lucide-react';
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
import { Hero3D } from '@/components/three/Hero3D';

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
      <section className="relative mx-auto max-w-screen-xl px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
        <Hero3D />
        <div className="relative z-10 grid items-center gap-12 lg:grid-cols-2">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-warning/30 bg-warning/10 px-3 py-1 text-xs text-warning backdrop-blur-sm">
              <Sparkles className="h-3 w-3" />
              OZ Defender alternative — now 100% free & open source
            </div>
            <div className="space-y-4">
              <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
                Build deployment workflows.
                <br />
                <span className="bg-gradient-to-r from-cyan-400 via-violet-400 to-amber-400 bg-clip-text text-transparent">
                  Run on any EVM chain.
                </span>
              </h1>
              <p className="max-w-xl text-lg text-muted-foreground">
                Define a sequence of contract deployments once. Reuse it across
                testnets and mainnet. No scripts, no copy-paste errors.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" className="gap-2">
                <Link href="/sign-in">
                  Start Building Free
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/how-it-works">See How It Works</Link>
              </Button>
            </div>
            <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                No local setup
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-500" />
                Any EVM chain
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-violet-500" />
                Variable passing
              </span>
            </div>
          </div>

          <div className="hidden lg:block">
            <div className="rounded-lg border border-border/50 bg-card/60 p-6 font-mono text-sm backdrop-blur-sm">
              <p className="mb-4 text-muted-foreground">Recipe Execution</p>
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-md border border-border bg-background/80 px-4 py-3 backdrop-blur-sm">
                  <span>Step 1: Deploy Token</span>
                  <span className="text-success">✓</span>
                </div>
                <div className="flex items-center justify-between rounded-md border border-border bg-background/80 px-4 py-3 backdrop-blur-sm">
                  <span>Step 2: Deploy Staking</span>
                  <span className="text-success">✓</span>
                </div>
                <div className="flex items-center justify-between rounded-md border border-warning/40 bg-background/80 px-4 py-3 backdrop-blur-sm">
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
              gradient: 'from-cyan-500/20 to-transparent',
            },
            {
              title: 'Variable Passing',
              description:
                'Each step automatically receives the contract address from the previous step. No copy-paste.',
              gradient: 'from-violet-500/20 to-transparent',
            },
            {
              title: 'Share Recipes',
              description:
                'Generate a link to your recipe. Your team runs the same workflow on any chain.',
              gradient: 'from-amber-500/20 to-transparent',
            },
          ].map((item) => (
            <Card key={item.title} className="relative overflow-hidden">
              <div className={`pointer-events-none absolute inset-0 bg-gradient-to-b ${item.gradient}`} />
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
        <div className="flex flex-col items-start justify-between gap-6 rounded-lg border border-border bg-gradient-to-br from-card to-card/50 p-8 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              Ready to stop writing deployment scripts?
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Free and open source. No limits, no paywalls.
            </p>
          </div>
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
