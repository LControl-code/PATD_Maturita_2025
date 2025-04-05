// components/dashboard/DashboardOverview/DashboardOverview.server.tsx

import { DashboardOverviewClient } from './DashboardOverview.client';
import type { DashboardStats } from './types';
import { useBuildSafeData } from '@/lib/buildSafeData';
import pb from '@/lib/pocketbase';

/**
 * Fetches dashboard statistics from the PocketBase API
 */
async function getDashboardStats(): Promise<DashboardStats> {
  try {
    // Fetch real data from PocketBase endpoint
    const data = await pb.send('/api/dashboard-stats', {
      method: 'GET',
    });

    return {
      totalTested: data.totalTested || 0,
      activeStations: data.activeStations || 0,
      todaysProduction: data.todaysProduction || 0,
      overallEfficiency: data.overallEfficiency || 0,
    };
  } catch (error) {
    console.error('Failed to fetch dashboard stats:', error);
    // Return fallback values on error
    return {
      totalTested: 0,
      activeStations: 0,
      todaysProduction: 0,
      overallEfficiency: 0,
    };
  }
}

/**
 * Server component that fetches dashboard data and passes it to the client component
 */
export default async function DashboardOverview() {
  const data = await useBuildSafeData(getDashboardStats, {
    totalTested: 0,
    activeStations: 0,
    todaysProduction: 0,
    overallEfficiency: 0,
  });

  return <DashboardOverviewClient data={data} />;
}