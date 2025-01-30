import LiveErrorsClient from './LiveErrors.client'
import { ErrorData } from '@/types/errors'

/**
 * Fetches live error data from the API endpoint.
 * 
 * @async
 * @returns {Promise<ErrorData[]>} A promise that resolves to an array of error data objects
 * @throws {Error} When the fetch request fails with a non-200 status code
 */
export async function fetchLiveErrorsData(): Promise<ErrorData[]> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/data/dashboard/liveErrors`, {
    next: {
      tags: ['live_errors_tag'],
    }
  })

  if (!res.ok) {
    throw new Error(`Failed to fetch live errors data. Status: ${res.status}`)
  }

  return await res.json()
}

/**
 * Server component that fetches initial live errors data and renders the LiveErrors client component.
 * @returns {Promise<JSX.Element>} A Promise that resolves to the LiveErrorsClient component with initial data.
 * @async
 */
export default async function LiveErrors() {
  if (process.env.NEXT_PHASE === "phase-production-build") return [];
  const initialData = await fetchLiveErrorsData()
  return <LiveErrorsClient initialData={initialData} />
}
