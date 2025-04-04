import { Suspense } from 'react';
import { DashboardOverviewClient } from './DashboardOverview.client';
import type { DashboardStats } from './types';
import { useBuildSafeData } from '@/lib/buildSafeData';

/**
 * Fetches dashboard statistics data
 * Currently returns mock data but would integrate with Pocketbase in production
 */
async function getDashboardStats(): Promise<DashboardStats> {
  // Mock data for development
  // Replace this with actual data fetching in production
  // e.g. return await getStatsRecord();

  return {
    totalTested: 12584,
    activeStations: 8,
    todaysProduction: 45.8,
    overallEfficiency: 78.5,
  };
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
