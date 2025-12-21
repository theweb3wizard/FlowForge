'use client';

import { useState } from 'react';
import { MyContracts } from '@/components/dashboard/MyContracts';
import { AllDeployments } from '@/components/dashboard/AllDeployments';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import StatsPanel from '@/components/dashboard/StatsPanel';

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
      
      <StatsPanel />

      <Tabs defaultValue="my-contracts" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="my-contracts">My Contracts</TabsTrigger>
          <TabsTrigger value="all-deployments">All Deployments</TabsTrigger>
        </TabsList>
        <TabsContent value="my-contracts" className="py-6">
          <MyContracts />
        </TabsContent>
        <TabsContent value="all-deployments" className="py-6">
          <AllDeployments />
        </TabsContent>
      </Tabs>
    </div>
  );
}
