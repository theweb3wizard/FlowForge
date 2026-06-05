export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="mx-auto flex w-full max-w-sm flex-col items-center justify-center px-4">
        {children}
      </div>
    </div>
  );
}
