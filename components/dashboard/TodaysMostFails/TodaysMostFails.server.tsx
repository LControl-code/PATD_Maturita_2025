// components/dashboard/TodaysMostFails/TodaysMostFails.server.tsx

import TodaysMostFailsClient from './TodaysMostFails.client'
import { FailsData } from './types'

/**
 * Fetches today's most failed items data from the API.
 * 
 * @async
 * @returns {Promise<FailsData>} A promise that resolves to the fails data
 * @throws {Error} If the fetch request fails or returns a non-OK status
 */
export async function fetchTodaysMostFailsData(): Promise<FailsData> {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/data/dashboard/todaysMostFails`, {
        next: {
            tags: ['top_fails_tag'],

        }
    })
    if (!res.ok) {
        throw new Error(`Failed to fetch 'todays most fails' data. Status: ${res.status}`)
    }

    const data: FailsData = await res.json()
    return data


}

// Server component fetches data, then renders the client component
/**
 * Server component that fetches and displays the data for today's most failed items.
 * 
 * @returns {Promise<JSX.Element>} A Promise that resolves to a client-side component
 * with the fetched initial data for today's most fails.
 * 
 * @async
 */
export default async function TodaysMostFails() {
    if (process.env.NEXT_PHASE === "phase-production-build") return [];
    const initialData = await fetchTodaysMostFailsData()
    return <TodaysMostFailsClient initialData={initialData} />
}
