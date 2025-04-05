// app/tests/TestData.client.tsx

'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { TestDataTable } from '@/components/tests/TestDataTable';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, RefreshCw } from 'lucide-react';
import { TestDataExpanded } from '@/types/testsData';
import { debounce } from 'lodash';

interface PaginationData {
    page: number;
    perPage: number;
    totalItems: number;
    totalPages: number;
}

interface TestDataClientProps {
    data: TestDataExpanded[];
    pagination: PaginationData;
    search: string;
}

/**
 * Client component for the Test Data page
 * Handles search, pagination and display
 */
export function TestDataClient({ data, pagination, search: initialSearch }: TestDataClientProps) {
    const router = useRouter();
    const pathname = usePathname();
    const [search, setSearch] = useState(initialSearch || '');
    const [isSearching, setIsSearching] = useState(false);

    // Create a debounced search function
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const debouncedSearch = useCallback(
        debounce((searchTerm: string) => {
            setIsSearching(true);

            // Build the query string
            const params = new URLSearchParams();
            if (searchTerm) {
                params.set('search', searchTerm);
            }

            // Reset to page 1 when search changes
            params.set('page', '1');

            // Navigate with the new params
            router.push(`${pathname}?${params.toString()}`);

            setIsSearching(false);
        }, 500),
        [pathname, router]
    );

    // Trigger search on search term change
    useEffect(() => {
        debouncedSearch(search);

        // Cancel debounced search on cleanup
        return () => {
            debouncedSearch.cancel();
        };
    }, [search, debouncedSearch]);

    // Handle page change
    const handlePageChange = (newPage: number) => {
        // Build the query string
        const params = new URLSearchParams();
        if (search) {
            params.set('search', search);
        }
        params.set('page', newPage.toString());

        // Navigate with the new params
        router.push(`${pathname}?${params.toString()}`);
    };

    return (
        <div className="container mx-auto py-6">
            <div className="mb-6">
                <h1 className="text-3xl font-bold">Test Data</h1>
                <p className="text-muted-foreground">
                    View and search all test data across stations and devices
                </p>
            </div>

            <div className="flex items-center gap-4 mb-6">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search device codes..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-8"
                    />
                </div>

                <Button
                    variant="outline"
                    onClick={() => router.refresh()}
                    disabled={isSearching}
                >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isSearching ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            <TestDataTable
                data={data}
                paginationData={pagination}
                onPageChange={handlePageChange}
            />
        </div>
    );
}