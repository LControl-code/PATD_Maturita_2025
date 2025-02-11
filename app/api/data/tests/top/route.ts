// Root: /frontend/app/api/data/tests/top/route.ts
import { NextResponse } from 'next/server'
import { getTopFailsData } from '@/lib/pocketbase_connect';
import { issueCountData } from '@/mock/issueCountData';
import { TopFailsResponse } from '@/types/testData';

export async function GET() {
  try {
    const data = await getTopFailsData();
    const mergedData: TopFailsResponse = {
      ...data,
      ...issueCountData
    };

    return NextResponse.json(mergedData);
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json({ error: 'Failed to fetch top fails data', message: error.message });
    }
    return NextResponse.json({ error: 'Failed to fetch top fails data', message: 'Unknown error' });
  }
}