import type { Metadata } from 'next';
import Link from 'next/link';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://flowforge.app';

export const metadata: Metadata = {
  title: 'Terms of Service | FlowForge',
  description:
    'FlowForge Terms of Service explain the rules, responsibilities, and acceptable use for the deployment workflow builder platform.',
};

const termsOfServiceSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Terms of Service | FlowForge',
  url: `${APP_URL}/terms-of-service`,
  description:
    'FlowForge Terms of Service explain the rules, responsibilities, and acceptable use for the deployment workflow builder platform.',
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
        name: 'Terms of Service',
        item: `${APP_URL}/terms-of-service`,
      },
    ],
  },
};

const sectionClass = 'rounded-3xl border border-border bg-card p-8 shadow-sm shadow-black/10';

export default function TermsOfServicePage() {
  return (
    <main className="relative overflow-hidden bg-background text-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(termsOfServiceSchema) }}
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top,_rgba(248,113,113,0.16),_transparent_50%)]" />
      <div className="pointer-events-none absolute left-0 top-24 h-72 w-72 rounded-full bg-[radial-gradient(circle,_rgba(56,189,248,0.14),_transparent_55%)] blur-3xl" />
      <div className="container relative py-16 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-4xl space-y-8">
          <div className="space-y-4 rounded-[2rem] border border-border/80 bg-card/95 p-10 shadow-[0_30px_80px_-50px_rgba(15,23,42,0.75)] backdrop-blur">
            <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Legal</p>
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
              Terms of Service
            </h1>
            <p className="max-w-3xl text-base leading-8 text-muted-foreground">
              These terms govern your use of FlowForge and describe the rights and obligations for everyone who uses the platform.
            </p>
            <div className="flex flex-wrap gap-3 text-sm font-medium text-foreground">
              <Link href="/privacy-policy" className="rounded-full border border-border px-4 py-2 transition hover:border-secondary hover:text-secondary">
                View Privacy Policy
              </Link>
              <Link href="/refund-policy" className="rounded-full border border-border px-4 py-2 transition hover:border-secondary hover:text-secondary">
                View Refund Policy
              </Link>
            </div>
          </div>

          <section className={sectionClass}>
            <h2 className="text-2xl font-semibold">1. Acceptance of Terms</h2>
            <div className="mt-4 space-y-4 text-sm leading-7 text-muted-foreground">
              <p>
                By accessing or using FlowForge, you agree to these Terms of Service and any updates that may be published. If you do not agree, do not use the platform.
              </p>
            </div>
          </section>

          <section className={sectionClass}>
            <h2 className="text-2xl font-semibold">2. Eligibility</h2>
            <div className="mt-4 space-y-4 text-sm leading-7 text-muted-foreground">
              <p>
                You must be at least 18 years old or otherwise legally permitted to enter into a binding contract in your jurisdiction.
              </p>
              <p>
                You are responsible for ensuring that your use of FlowForge complies with applicable laws and regulations, including those related to blockchain transactions and digital assets.
              </p>
            </div>
          </section>

          <section className={sectionClass}>
            <h2 className="text-2xl font-semibold">3. Account & Wallet Use</h2>
            <div className="mt-4 space-y-4 text-sm leading-7 text-muted-foreground">
              <p>
                FlowForge uses wallet authentication and Supabase accounts to identify users. You are responsible for the security of your wallet and any credentials associated with your account.
              </p>
              <p>
                FlowForge does not control your wallet provider. Transaction signing is performed in your browser via your wallet, and we never store your private keys.
              </p>
            </div>
          </section>

          <section className={sectionClass}>
            <h2 className="text-2xl font-semibold">4. Acceptable Use</h2>
            <div className="mt-4 space-y-4 text-sm leading-7 text-muted-foreground">
              <p>
                You may not use FlowForge to deploy or interact with contracts that violate applicable law, infringe intellectual property, or facilitate harm.
              </p>
              <p>
                You agree not to disrupt, reverse engineer, or otherwise interfere with the operation of the service.
              </p>
            </div>
          </section>

          <section className={sectionClass}>
            <h2 className="text-2xl font-semibold">5. Subscriptions and Payment</h2>
            <div className="mt-4 space-y-4 text-sm leading-7 text-muted-foreground">
              <p>
                Paid plans are managed through Lemon Squeezy. Your subscription status is stored in Supabase and used to control access to premium functionality.
              </p>
              <p>
                Payment terms, renewals, and cancellations follow Lemon Squeezy's policies. Any payment disputes should be directed to Lemon Squeezy support.
              </p>
            </div>
          </section>

          <section className={sectionClass}>
            <h2 className="text-2xl font-semibold">6. Disclaimers and Limitation of Liability</h2>
            <div className="mt-4 space-y-4 text-sm leading-7 text-muted-foreground">
              <p>
                FlowForge is provided "as is" without warranties of any kind. We do not guarantee that the service will be uninterrupted, error-free, or secure.
              </p>
              <p>
                We are not responsible for any blockchain transaction losses, gas fees, or contract behavior arising from your use of the platform.
              </p>
            </div>
          </section>

          <section className={sectionClass}>
            <h2 className="text-2xl font-semibold">7. Changes to Terms</h2>
            <div className="mt-4 space-y-4 text-sm leading-7 text-muted-foreground">
              <p>
                We may update these terms from time to time. Material changes will be posted on this page and notified through the service if required.
              </p>
              <p>
                Continued use of FlowForge after changes are posted constitutes acceptance of the updated terms.
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
