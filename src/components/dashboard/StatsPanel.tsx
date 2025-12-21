"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { StatCard } from './StatCard';
import { Package, Users, Activity, Trophy } from 'lucide-react';
import { toast } from 'sonner';

interface DeploymentStats {
  totalDeployments: number;
  uniqueDeployers: number;
  mostPopularTemplate: string;
  recentActivity: number;
}

export default function StatsPanel() {
  const [stats, setStats] = useState<DeploymentStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);

        // Fetch all data in one go initially
        const { data: allDeployments, error } = await supabase
          .from('deployments')
          .select('deployer_address, contract_name, deployed_at');

        if (error) throw error;

        // 1. Total Deployments
        const totalDeployments = allDeployments.length;

        // 2. Unique Deployers
        const uniqueDeployers = new Set(allDeployments.map(d => d.deployer_address)).size;

        // 3. Most Popular Template
        const templateCounts = allDeployments.reduce((acc, t) => {
          acc[t.contract_name] = (acc[t.contract_name] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
        const mostPopularTemplate = Object.keys(templateCounts).length > 0
            ? Object.entries(templateCounts).sort(([,a], [,b]) => b - a)[0][0]
            : 'N/A';

        // 4. Recent Activity (last 24 hours)
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const recentActivity = allDeployments.filter(d => new Date(d.deployed_at) > yesterday).length;

        setStats({
          totalDeployments,
          uniqueDeployers,
          mostPopularTemplate,
          recentActivity,
        });

      } catch (error: any) {
        console.error("Error fetching deployment stats:", error);
        toast.error('Error fetching stats', {
          description: 'Could not load dashboard statistics.',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const commonIconProps = "h-4 w-4 text-muted-foreground";

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
      <StatCard
        title="Total Deployments"
        value={stats?.totalDeployments ?? 0}
        icon={<Package className={commonIconProps} />}
        loading={loading}
      />
      <StatCard
        title="Unique Builders"
        value={stats?.uniqueDeployers ?? 0}
        icon={<Users className={commonIconProps} />}
        loading={loading}
      />
       <StatCard
        title="Most Popular"
        value={stats?.mostPopularTemplate ?? 'N/A'}
        icon={<Trophy className={commonIconProps} />}
        loading={loading}
      />
      <StatCard
        title="Active in 24h"
        value={stats?.recentActivity ?? 0}
        icon={<Activity className={commonIconProps} />}
        loading={loading}
      />
    </div>
  );
}
