// components/FailedTestsGraphOld/FailedTestsGraphOld.server.tsx

import FailedTestsGraphClient from './FailedTestsGraph.client';

/**
 * Fetches data about failed tests from the API endpoint.
 * 
 * @async
 * @function fetchFailedTestsData
 * @returns {Promise<any>} A promise that resolves to the failed tests data
 * @throws {Error} When the API request fails
 */
export async function fetchFailedTestsData(): Promise<any> {
    const res = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL}/api/data/dashboard/failedTestsGraph`,
        {
            next: {
                tags: ['failed_tests_tag'],
            }
        }
    );

    if (!res.ok) {
        throw new Error(`Failed to fetch /api/failedTestsGraphNew (status: ${res.status}).`);
    }

    return res.json();

}

/**
 * A server component that fetches and renders a graph displaying failed tests data.
 * This component fetches the initial data and passes it to the client-side component.
 * 
 * @returns {Promise<JSX.Element>} A Promise that resolves to the FailedTestsGraphClient component
 * with the fetched initial data.
 */
export default async function FailedTestsGraph() {
    if (process.env.NEXT_PHASE === "phase-production-build") return [];
    const data = await fetchFailedTestsData();
    return <FailedTestsGraphClient initialData={data} />;
}
