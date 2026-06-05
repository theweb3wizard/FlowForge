import { redirect } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { createServerClient } from '@/lib/supabase/server';

export default async function AuthenticatedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/sign-in');
  }

  return <AppShell>{children}</AppShell>;
}
