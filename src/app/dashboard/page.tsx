'use client';

import { useState } from 'react';
import { MyContracts } from '@/components/dashboard/MyContracts';
import { AllDeployments } from '@/components/dashboard/AllDeployments';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import StatsPanel from '@/components/dashboard/StatsPanel';
import Link from 'next/link';
import { Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="my-contracts">My Contracts</TabsTrigger>
          <TabsTrigger value="all-deployments">All Deployments</TabsTrigger>
          <TabsTrigger value="recipes" asChild>
            <Link href="/dashboard/recipes" className="flex items-center gap-2">
              <Layers className="h-4 w-4" />
              Recipes
            </Link>
          </TabsTrigger>
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
