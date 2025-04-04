// components/dashboard/ProductionStatus/ProductionStatus.server.tsx

import { useBuildSafeData } from '@/lib/buildSafeData';
import { ProductionStatusClient } from './ProductionStatus.client';
import type { ProductionStatusData } from './types';

// This would eventually be replaced with real data fetching logic
async function getProductionData(): Promise<ProductionStatusData> {
  // Mock data for now - in real implementation, this would:
  // - Query test_data collection for today's production stats
  // - Calculate completion rate based on daily targets
  // - Estimate completion time based on current throughput
  return {
    productionRate: 95.6,
    devicesProduced: 101,
    totalDevices: 220,
    estimatedCompletion: '1h 30m',
  };
}

export default async function ProductionStatus() {
  // Server-side data fetching
  const data = await useBuildSafeData(getProductionData, {
    productionRate: 0,
    devicesProduced: 0,
    totalDevices: 0,
    estimatedCompletion: 'Unknown',
  });

  // Pass data to client component
  return <ProductionStatusClient data={data} />;
}
