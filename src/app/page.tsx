import TemplateList from "@/components/templates/TemplateList";
import { getActiveTemplates } from "@/lib/supabase/templates";

export const revalidate = 60; // Revalidate every 60 seconds

export default async function Home() {
  const templates = await getActiveTemplates();

  return (
    <div className="container mx-auto px-4 py-12">
      <header className="text-center mb-12">
        <h1 className="font-headline text-4xl md:text-6xl font-bold tracking-tighter mb-4">
          Forge Your Path on the BlockDAG
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
          Effortlessly deploy secure, pre-audited smart contracts to the testnet. No code, no hassle—just pure innovation.
        </p>
      </header>
      <TemplateList templates={templates} />
    </div>
  );
}
