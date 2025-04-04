import { Suspense } from 'react';
import { DashboardOverviewClient } from './DashboardOverview.client';
import type { DashboardStats } from './types';

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
  try {
    const data = await getDashboardStats();
    return <DashboardOverviewClient data={data} />;
  } catch (error) {
    console.error('Failed to load dashboard stats:', error);
    return (
      <div className="p-4 text-red-500 border border-red-200 rounded-md">
        Error loading dashboard data
      </div>
    );
  }
}
