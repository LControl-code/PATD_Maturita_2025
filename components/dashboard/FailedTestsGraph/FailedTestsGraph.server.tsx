import { useBuildSafeData } from '@/lib/buildSafeData';
import { FailedTestsGraphClient } from './FailedTestsGraph.client';
import type { FailsData } from './types';

/**
 * Fetches data about failed tests from the API endpoint.
 *
 * @returns Promise resolving to the failed tests data
 */
async function fetchFailedTestsData(): Promise<FailsData> {
    try {
        const res = await fetch(
            `${process.env.NEXT_PUBLIC_APP_URL}/api/data/dashboard/failedTestsGraph`,
            {
                next: {
                    tags: ['failed_tests_tag'],
                },
                cache: 'no-store',
            },
        );

        if (!res.ok) {
            throw new Error(`API responded with status ${res.status}`);
        }

        return res.json();
    } catch (error) {
        console.error('Failed to fetch failed tests data:', error);
        throw error;
    }
}

/**
 * Server component that fetches and renders the failed tests graph.
 * Handles data fetching and error states before passing data to the client component.
 *
 * During build, returns empty data to prevent API fetch failures.
 */
export default async function FailedTestsGraph() {
    const data = await useBuildSafeData(fetchFailedTestsData, {});
    return <FailedTestsGraphClient data={data} />;
}
