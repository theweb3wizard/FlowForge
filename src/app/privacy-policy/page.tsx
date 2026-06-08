import type { Metadata } from 'next';
import Link from 'next/link';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://flowforge.app';

export const metadata: Metadata = {
  title: 'Privacy Policy | FlowForge',
  description:
    'FlowForge Privacy Policy describing how we collect, use, and protect your information while you build smart contract deployment workflows.',
};

const privacyPolicySchema = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Privacy Policy | FlowForge',
  url: `${APP_URL}/privacy-policy`,
  description:
    'FlowForge Privacy Policy describing how we collect, use, and protect your information while you build smart contract deployment workflows.',
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
        name: 'Privacy Policy',
        item: `${APP_URL}/privacy-policy`,
      },
    ],
  },
};

const sectionClass = 'rounded-3xl border border-border bg-card p-8 shadow-sm shadow-black/10';

export default function PrivacyPolicyPage() {
  return (
    <main className="relative overflow-hidden bg-background text-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(privacyPolicySchema) }}
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top,_rgba(96,165,250,0.18),_transparent_50%)]" />
      <div className="pointer-events-none absolute right-0 top-20 h-80 w-80 rounded-full bg-[radial-gradient(circle,_rgba(96,250,165,0.14),_transparent_55%)] blur-3xl" />
      <div className="container relative py-16 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-4xl space-y-8">
          <div className="space-y-4 rounded-[2rem] border border-border/80 bg-card/95 p-10 shadow-[0_30px_80px_-50px_rgba(15,23,42,0.75)] backdrop-blur">
            <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Legal</p>
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
              Privacy Policy
            </h1>
            <p className="max-w-3xl text-base leading-8 text-muted-foreground">
              FlowForge respects your privacy and only uses the information needed to power your deployment workflows, authentication, and subscription experience.
            </p>
            <div className="flex flex-wrap gap-3 text-sm font-medium text-foreground">
              <Link href="/terms-of-service" className="rounded-full border border-border px-4 py-2 transition hover:border-primary hover:text-primary">
                View Terms of Service
              </Link>
              <Link href="/refund-policy" className="rounded-full border border-border px-4 py-2 transition hover:border-primary hover:text-primary">
                View Refund Policy
              </Link>
            </div>
          </div>

          <section className={sectionClass}>
            <h2 className="text-2xl font-semibold">1. Information We Collect</h2>
            <div className="mt-4 space-y-4 text-sm leading-7 text-muted-foreground">
              <p>
                FlowForge collects only the data necessary to create and manage your account, store recipe definitions, and support recipe execution history. This includes wallet-derived authentication information, recipe metadata, and execution status data.
              </p>
              <p>
                We do not collect or store private keys. Your wallet signs transactions locally in the browser and transaction data is sent directly to the network via your wallet provider.
              </p>
            </div>
          </section>

          <section className={sectionClass}>
            <h2 className="text-2xl font-semibold">2. Wallet Authentication</h2>
            <div className="mt-4 space-y-4 text-sm leading-7 text-muted-foreground">
              <p>
                Authentication is handled through Supabase and wallet signatures. We only store the fact that a wallet address is associated with your account, and session tokens required by Supabase to maintain your signed-in state.
              </p>
              <p>
                No private keys are transmitted to our servers. Wallet interaction happens entirely within your browser and the wallet extension or app you use.
              </p>
            </div>
          </section>

          <section className={sectionClass}>
            <h2 className="text-2xl font-semibold">3. How We Use Your Data</h2>
            <div className="mt-4 space-y-4 text-sm leading-7 text-muted-foreground">
              <p>
                Your information is used to:
              </p>
              <ul className="list-disc space-y-2 pl-5">
                <li>Persist recipes and execution history.</li>
                <li>Control access to private and public recipes.</li>
                <li>Manage subscription status for paid plans.</li>
                <li>Send transactional messages related to account and billing activity.</li>
              </ul>
              <p>
                We do not sell your personal data to third parties. Data is only shared with service providers that help operate FlowForge, such as Supabase and Lemon Squeezy.
              </p>
            </div>
          </section>

          <section className={sectionClass}>
            <h2 className="text-2xl font-semibold">4. Third-Party Services</h2>
            <div className="mt-4 space-y-4 text-sm leading-7 text-muted-foreground">
              <p>
                FlowForge relies on third-party services for authentication, data storage, and billing. These providers may collect information according to their own privacy terms.
              </p>
              <p>
                Key providers include Supabase for database and authentication, and Lemon Squeezy for subscription management. We encourage you to review their privacy policies as well.
              </p>
            </div>
          </section>

          <section className={sectionClass}>
            <h2 className="text-2xl font-semibold">5. Security and Updates</h2>
            <div className="mt-4 space-y-4 text-sm leading-7 text-muted-foreground">
              <p>
                We take reasonable measures to protect your data, but no online service is completely secure. Always protect your wallet and never share your wallet keys.
              </p>
              <p>
                This policy may be updated over time. When material changes occur, we will post the updated date and make the revised policy available here.
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
