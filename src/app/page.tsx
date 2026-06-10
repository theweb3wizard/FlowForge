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
            <div className="inline-flex items-center gap-2 rounded-full border border-amber/30 bg-amber/10 px-3 py-1 text-xs text-amber backdrop-blur-sm">
              <span className="rounded bg-amber/20 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">Beta</span>
              Now with AI code generation &mdash; describe, generate, deploy
            </div>
            <div className="space-y-4">
              <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
                Describe. Generate. Deploy.
                <br />
                <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-emerald-400 bg-clip-text text-transparent">
                  Smart contracts, in minutes.
                </span>
              </h1>
              <p className="max-w-xl text-lg text-muted-foreground">
                Describe what you want in plain English. AI generates production-ready Solidity.
                Compile, deploy, and interact &mdash; all in your browser. No local setup, no CLI, no gas spent until you're ready.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" className="gap-2">
                <Link href="/playground">
                  Open Playground
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
                AI code generation
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-500" />
                Live compilation
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-violet-500" />
                Multi-step workflows
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
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
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
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
          {[
            {
              title: 'AI Code Generation',
              description:
                'Describe your contract in plain English. AI writes production-ready Solidity with OpenZeppelin imports, NatSpec, and gas notes.',
              gradient: 'from-indigo-500/20 to-transparent',
            },
            {
              title: 'Live Compilation & Audit',
              description:
                'Every keystroke compiles in real-time via solc-js. AI security audit flags reentrancy, access control issues, and more.',
              gradient: 'from-violet-500/20 to-transparent',
            },
            {
              title: 'Multi-Step Deployments',
              description:
                'Chain contract deployments together with variable passing. Deploy a token, then a staking pool that references it — one click.',
              gradient: 'from-emerald-500/20 to-transparent',
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
              From idea to on-chain in minutes.
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              AI-powered contract generation. Live compilation. Multi-chain deployment. Free to start.
            </p>
          </div>
          <Button asChild size="lg" className="gap-2">
            <Link href="/playground">
              Open Playground
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
