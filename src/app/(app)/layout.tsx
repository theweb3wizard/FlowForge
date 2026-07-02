import { redirect } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { auth } from '@/lib/auth/server';

export default async function AuthenticatedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { data: session } = await auth.getSession();

  if (!session?.user) {
    redirect('/sign-in');
  }

  return <AppShell>{children}</AppShell>;
}
