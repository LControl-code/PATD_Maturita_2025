// components/tests/TestDataTable.tsx
'use client';

import React, { useState } from 'react';
import {
    ColumnDef,
    ColumnFiltersState,
    SortingState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable
} from '@tanstack/react-table';
import { ArrowUpDown, ChevronDown, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination';

import { TestDataExpanded } from '@/types/testsData';

interface TestDataTableProps {
    data: TestDataExpanded[];
}

/**
 * Data table component for displaying test data with filtering, sorting, and pagination
 */
export function TestDataTable({ data }: TestDataTableProps) {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [globalFilter, setGlobalFilter] = useState('');

    // Define columns for the table
    const columns: ColumnDef<TestDataExpanded>[] = [
        {
            accessorKey: 'device_code',
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                >
                    Device Code
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
        },
        {
            accessorKey: 'expand.device_type.name',
            header: 'Device Type',
            cell: ({ row }) => (
                <div>{row.original.expand?.device_type?.name || 'Unknown'}</div>
            ),
        },
        {
            accessorKey: 'expand.station.name',
            header: 'Station',
            cell: ({ row }) => (
                <div>{row.original.expand?.station?.name || 'Unknown'}</div>
            ),
        },
        {
            accessorKey: 'time',
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                >
                    Time
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => (
                <div>{new Date(row.original.time).toLocaleString()}</div>
            ),
        },
        {
            accessorKey: 'test_fail',
            header: 'Status',
            cell: ({ row }) => (
                <Badge variant={row.original.test_fail ? 'destructive' : 'success'}>
                    {row.original.test_fail ? 'Failed' : 'Passed'}
                </Badge>
            ),
        },
        {
            id: 'test_data',
            header: 'Test Data',
            cell: ({ row }) => {
                const testData = row.original.test_data;
                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">View test values</span>
                                <ChevronDown className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-64">
                            {Object.entries(testData).map(([key, value]) => (
                                <DropdownMenuCheckboxItem
                                    key={key}
                                    checked={false}
                                    disabled
                                    className="cursor-default"
                                >
                                    <span className="font-medium">{key}:</span> {value}
                                </DropdownMenuCheckboxItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            },
        },
    ];

    // Initialize the table with our data and columns
    const table = useReactTable({
        data,
        columns,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onGlobalFilterChange: setGlobalFilter,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        state: {
            sorting,
            columnFilters,
            globalFilter,
        },
    });

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>Test Data</CardTitle>
                <div className="flex items-center py-4">
                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search test data..."
                            value={globalFilter}
                            onChange={(e) => setGlobalFilter(e.target.value)}
                            className="pl-8"
                        />
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            {table.getHeaderGroups().map((headerGroup) => (
                                <TableRow key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => (
                                        <TableHead key={header.id}>
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext()
                                                )}
                                        </TableHead>
                                    ))}
                                </TableRow>
                            ))}
                        </TableHeader>
                        <TableBody>
                            {table.getRowModel().rows?.length ? (
                                table.getRowModel().rows.map((row) => (
                                    <TableRow
                                        key={row.id}
                                        data-state={row.getIsSelected() && "selected"}
                                    >
                                        {row.getVisibleCells().map((cell) => (
                                            <TableCell key={cell.id}>
                                                {flexRender(
                                                    cell.column.columnDef.cell,
                                                    cell.getContext()
                                                )}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell
                                        colSpan={columns.length}
                                        className="h-24 text-center"
                                    >
                                        No results found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
                <div className="flex items-center justify-end space-x-2 py-4">
                    <Pagination>
                        <PaginationContent>
                            <PaginationItem>
                                <PaginationPrevious
                                    onClick={() => table.previousPage()}
                                    disabled={!table.getCanPreviousPage()}
                                />
                            </PaginationItem>
                            {Array.from({ length: table.getPageCount() }, (_, i) => i + 1)
                                .filter(page => {
                                    const currentPage = table.getState().pagination.pageIndex + 1;
                                    return page === 1 ||
                                        page === table.getPageCount() ||
                                        Math.abs(page - currentPage) <= 1;
                                })
                                .map((page, i, array) => {
                                    const currentPage = table.getState().pagination.pageIndex + 1;
                                    const isCurrentPage = page === currentPage;

                                    // Add ellipsis if needed
                                    if (i > 0 && array[i - 1] !== page - 1) {
                                        return (
                                            <React.Fragment key={`ellipsis-${page}`}>
                                                <PaginationItem>
                                                    <PaginationEllipsis />
                                                </PaginationItem>
                                                <PaginationItem>
                                                    <PaginationLink
                                                        onClick={() => table.setPageIndex(page - 1)}
                                                        isActive={isCurrentPage}
                                                    >
                                                        {page}
                                                    </PaginationLink>
                                                </PaginationItem>
                                            </React.Fragment>
                                        );
                                    }

                                    return (
                                        <PaginationItem key={page}>
                                            <PaginationLink
                                                onClick={() => table.setPageIndex(page - 1)}
                                                isActive={isCurrentPage}
                                            >
                                                {page}
                                            </PaginationLink>
                                        </PaginationItem>
                                    );
                                })}
                            <PaginationItem>
                                <PaginationNext
                                    onClick={() => table.nextPage()}
                                    disabled={!table.getCanNextPage()}
                                />
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>
                </div>
            </CardContent>
        </Card>
    );
}