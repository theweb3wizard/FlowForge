import DeploymentTable from "@/components/dashboard/DeploymentTable";

export default function DashboardPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <header className="mb-8">
        <h1 className="font-headline text-4xl md:text-5xl font-bold tracking-tighter mb-2">
          Deployment Dashboard
        </h1>
        <p className="text-lg text-muted-foreground">
          A transparent, public list of all contracts deployed through FlowForge.
        </p>
      </header>
      <DeploymentTable />
    </div>
  );
}
