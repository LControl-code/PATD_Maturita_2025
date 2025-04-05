// app/tests/TestData.server.tsx

import { Suspense } from 'react';
import { TestDataClient } from './TestData.client';
import pb from '@/lib/pocketbase';
import { TestDataExpanded } from '@/types/testsData';
import { notFound } from 'next/navigation';

interface PaginatedResponse {
    items: TestDataExpanded[];
    page: number;
    perPage: number;
    totalItems: number;
    totalPages: number;
}

/**
 * Fetches test data from the API with pagination and filtering
 */
async function fetchTestData(
    page: number = 1,
    perPage: number = 20,
    search: string = '',
    sort: string = '-time'
): Promise<PaginatedResponse> {
    try {
        // Build query params
        const params = new URLSearchParams({
            page: page.toString(),
            perPage: perPage.toString(),
            sort
        });

        // Add search parameter if provided
        if (search) {
            params.append('search', search);
        }

        // Query the PocketBase API
        const data = await pb.send('/api/test-data?' + params.toString(), {
            method: 'GET',
        });

        return data as PaginatedResponse;
    } catch (error) {
        console.error('Failed to fetch test data:', error);
        throw error;
    }
}

interface TestDataServerProps {
    searchParams: {
        page?: string;
        search?: string;
    };
}

/**
 * Server component that fetches test data and passes it to the client component
 */
export default async function TestDataServer({ searchParams }: TestDataServerProps) {
    // Parse query parameters
    const page = parseInt(searchParams.page || '1');
    const search = searchParams.search || '';

    try {
        // Fetch data with error handling
        const data = await fetchTestData(page, 20, search);

        // Handle out-of-range page number
        if (page > data.totalPages && data.totalItems > 0) {
            notFound();
        }

        return (
            <Suspense fallback={<div>Loading test data...</div>}>
                <TestDataClient
                    data={data.items}
                    pagination={{
                        page: data.page,
                        perPage: data.perPage,
                        totalItems: data.totalItems,
                        totalPages: data.totalPages
                    }}
                    search={search}
                />
            </Suspense>
        );
    } catch (error) {
        // Handle errors gracefully
        return (
            <div className="container mx-auto py-6">
                <h1 className="text-3xl font-bold mb-4">Error</h1>
                <p className="text-muted-foreground">
                    Failed to load test data. Please try again later.
                </p>
            </div>
        );
    }
}