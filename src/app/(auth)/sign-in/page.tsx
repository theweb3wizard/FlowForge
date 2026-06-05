import Link from 'next/link';
import { WalletSignIn } from '@/components/common/WalletSignIn';

export default function SignInPage() {
  return (
    <div className="flex w-full flex-col items-center gap-6 text-center">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          Connect to FlowForge
        </h1>
        <p className="text-sm text-muted-foreground">
          Connect your wallet to save and run recipes.
        </p>
      </div>
      <WalletSignIn />
      <Link
        href="https://metamask.io/download/"
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
      >
        No wallet? Learn more
      </Link>
    </div>
  );
}
