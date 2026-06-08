import type { Metadata } from 'next';
import Link from 'next/link';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://flowforge.app';

export const metadata: Metadata = {
  title: 'Refund Policy | FlowForge',
  description:
    'FlowForge Refund Policy covering cancellations, paid plan refunds, and transaction fee disclaimers.',
};

const refundPolicySchema = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Refund Policy | FlowForge',
  url: `${APP_URL}/refund-policy`,
  description:
    'FlowForge Refund Policy covering cancellations, paid plan refunds, and transaction fee disclaimers.',
  breadcrumb: {
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: APP_URL,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Refund Policy',
        item: `${APP_URL}/refund-policy`,
      },
    ],
  },
};

const sectionClass = 'rounded-3xl border border-border bg-card p-8 shadow-sm shadow-black/10';

export default function RefundPolicyPage() {
  return (
    <main className="relative overflow-hidden bg-background text-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(refundPolicySchema) }}
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top,_rgba(168,85,247,0.16),_transparent_50%)]" />
      <div className="pointer-events-none absolute right-0 top-24 h-72 w-72 rounded-full bg-[radial-gradient(circle,_rgba(34,197,94,0.14),_transparent_55%)] blur-3xl" />
      <div className="container relative py-16 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-4xl space-y-8">
          <div className="space-y-4 rounded-[2rem] border border-border/80 bg-card/95 p-10 shadow-[0_30px_80px_-50px_rgba(15,23,42,0.75)] backdrop-blur">
            <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Legal</p>
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
              Refund Policy
            </h1>
            <p className="max-w-3xl text-base leading-8 text-muted-foreground">
              This policy explains how refunds are handled for FlowForge subscriptions, and the limits around blockchain transaction fees.
            </p>
            <div className="flex flex-wrap gap-3 text-sm font-medium text-foreground">
              <Link href="/privacy-policy" className="rounded-full border border-border px-4 py-2 transition hover:border-secondary hover:text-secondary">
                View Privacy Policy
              </Link>
              <Link href="/terms-of-service" className="rounded-full border border-border px-4 py-2 transition hover:border-secondary hover:text-secondary">
                View Terms of Service
              </Link>
            </div>
          </div>

          <section className={sectionClass}>
            <h2 className="text-2xl font-semibold">1. Paid Plans</h2>
            <div className="mt-4 space-y-4 text-sm leading-7 text-muted-foreground">
              <p>
                FlowForge offers both free and paid subscription plans. Paid plans are billed and managed through Lemon Squeezy.
              </p>
              <p>
                Any refund request for a paid subscription is subject to Lemon Squeezy's billing policies and our Terms of Service.
              </p>
            </div>
          </section>

          <section className={sectionClass}>
            <h2 className="text-2xl font-semibold">2. Cancellation and Renewal</h2>
            <div className="mt-4 space-y-4 text-sm leading-7 text-muted-foreground">
              <p>
                You may cancel your subscription at any time through the billing interface. Cancellation prevents future renewals, but does not automatically refund past charges.
              </p>
              <p>
                Access to paid features may continue until the end of your current billing cycle, depending on the terms set by the payment provider.
              </p>
            </div>
          </section>

          <section className={sectionClass}>
            <h2 className="text-2xl font-semibold">3. Transaction Fees</h2>
            <div className="mt-4 space-y-4 text-sm leading-7 text-muted-foreground">
              <p>
                FlowForge does not control blockchain transaction fees. Any gas consumed by deployment or interaction steps is paid directly to the network by your wallet provider.
              </p>
              <p>
                These fees are non-refundable by FlowForge, even if a recipe fails or is interrupted.
              </p>
            </div>
          </section>

          <section className={sectionClass}>
            <h2 className="text-2xl font-semibold">4. Requesting a Refund</h2>
            <div className="mt-4 space-y-4 text-sm leading-7 text-muted-foreground">
              <p>
                To request a refund, please contact FlowForge support and provide the associated billing details. We will evaluate requests in line with our Terms of Service and the payment provider agreement.
              </p>
              <p>
                Refund approvals are made at our discretion and are not guaranteed for any purchase.
              </p>
            </div>
          </section>

          <section className={sectionClass}>
            <h2 className="text-2xl font-semibold">5. Changes to This Policy</h2>
            <div className="mt-4 space-y-4 text-sm leading-7 text-muted-foreground">
              <p>
                We may revise this policy periodically. The latest version will always be posted here, and continued use of FlowForge signifies acceptance of any changes.
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
