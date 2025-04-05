// components/dashboard/ProductionStatus/ProductionStatus.server.tsx

import { useBuildSafeData } from '@/lib/buildSafeData';
import { ProductionStatusClient } from './ProductionStatus.client';
import type { ProductionStatusData } from './types';
import pb from '@/lib/pocketbase';

async function getProductionData(): Promise<ProductionStatusData> {
  try {
    // Call the custom PocketBase endpoint we created
    const response = await pb.send('/api/production-status', {});
    return response as ProductionStatusData;
  } catch (error) {
    console.error("Failed to fetch production data:", error);
    return {
      productionRate: 0,
      devicesProduced: 0,
      totalDevices: 0,
      estimatedCompletion: 'Unknown',
    };
  }
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