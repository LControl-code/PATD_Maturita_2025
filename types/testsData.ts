// types/testsData.ts

/**
 * Represents a test data record from the Pocketbase database
 */
export interface TestData {
    id: string;
    device_code: string;
    device_type: string; // Reference to device_types collection
    station: string; // Reference to stations collection
    test_data: Record<string, number>; // JSON object with test measurements
    test_fail: boolean;
    time: string;
}

/**
 * Expanded test data with related records
 */
export interface TestDataExpanded extends TestData {
    expand?: {
        device_type?: {
            id: string;
            name: string;
        };
        station?: {
            id: string;
            name: string;
            line: string;
        };
    };
}

/**
 * Column definition for a datatable, with accessor functions and header labels
 */
export type DataTableColumn = {
    accessorKey: string;
    header: string;
    cell?: ({ row }: { row: { original: TestDataExpanded } }) => React.ReactNode;
};