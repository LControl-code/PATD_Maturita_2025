import { LimitsEditor } from '@/components/admin/limits/LimitsEditor.client';
import { fetchLimitsWithRelations } from '@/lib/data/limits';

export default async function LimitsPage() {
  // Server-side data fetching
  const { limits, deviceTypes, stations } = await fetchLimitsWithRelations();

  return (
    <div className="container py-8 mx-auto max-w-7xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Test Limits Management</h1>
      </div>

      <LimitsEditor initialLimits={limits} deviceTypes={deviceTypes} stations={stations} />
    </div>
  );
}
