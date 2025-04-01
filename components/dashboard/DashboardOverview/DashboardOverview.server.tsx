import { Suspense } from 'react';
import DashboardOverviewClient from './DashboardOverview.client';
import { getStatsRecord } from '@/lib/pocketbase_connect';

async function DashboardOverviewContent() {
  let initialData;
  try {
    initialData = await getStatsRecord();
  } catch (error) {
    console.error('Error fetching data:', error);
    initialData = { error: 'Failed to fetch dashboard data' };
  }
  return <DashboardOverviewClient initialData={initialData} />;
}

export default function DashboardOverview() {
  if (process.env.NEXT_PHASE === 'phase-production-build') return null;
  return (
    <Suspense fallback={<div>Loading dashboard...</div>}>
      <DashboardOverviewContent />
    </Suspense>
  );
}
