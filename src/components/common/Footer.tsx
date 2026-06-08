import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-border py-6 md:px-8 md:py-8">
      <div className="container flex flex-col items-center justify-between gap-4 text-sm text-muted-foreground md:flex-row">
        <p className="text-center md:text-left">
          &copy; {new Date().getFullYear()} FlowForge. All rights reserved.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link href="/privacy-policy" className="transition-colors hover:text-foreground">
            Privacy Policy
          </Link>
          <Link href="/terms-of-service" className="transition-colors hover:text-foreground">
            Terms of Service
          </Link>
          <Link href="/refund-policy" className="transition-colors hover:text-foreground">
            Refund Policy
          </Link>
        </div>
      </div>
    </footer>
  );
}
