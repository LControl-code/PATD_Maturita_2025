"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
    ResponsiveContainer,
    XAxis,
    YAxis,
    Tooltip,
    Bar,
    Cell,
    BarChart,
} from "recharts";
import { AlertTriangle, ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react';

// TanStack Table + shadcn
import * as RT from "@tanstack/react-table";
import { flexRender } from "@tanstack/react-table";
import {
    Table,
    TableHeader,
    TableRow,
    TableHead,
    TableBody,
    TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectTrigger,
    SelectContent,
    SelectItem,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Types
import { TestRecord, FailsData, FailedTestsGraphProps } from "./types";

// Constants
const ITEMS_PER_PAGE = 10;

/**
 * Client component that displays a graph of failed tests organized by station and line.
 * 
 * Features:
 * - Station and line filtering
 * - Interactive bar chart showing failed tests
 * - Detailed view of failed test records in a paginated table
 * - Color-coded bars based on failure frequency
 */
export function FailedTestsGraphClient({ data }: FailedTestsGraphProps) {
    // State management
    const [failsData, setFailsData] = useState<FailsData>(data);
    const [selectedStation, setSelectedStation] = useState<string>("");
    const [selectedLine, setSelectedLine] = useState<string>("all");
    const [selectedTest, setSelectedTest] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [columnFilters, setColumnFilters] = useState<RT.ColumnFiltersState>([]);
    const [sorting, setSorting] = useState<RT.SortingState>([]);

    // Update data when props change
    useEffect(() => {
        setFailsData(data);
    }, [data]);

    // Effect to set initial station or handle empty data
    useEffect(() => {
        const stationNames = Object.keys(failsData || {});
        if (stationNames.length > 0 && !selectedStation) {
            setSelectedStation(stationNames[0]);
        }
    }, [failsData, selectedStation]);

    // Handlers
    const handleStationChange = useCallback((station: string) => {
        setSelectedStation(station);
        setSelectedLine("all");
        setSelectedTest(null);
        setCurrentPage(1);
    }, []);

    const handleLineChange = useCallback((line: string) => {
        setSelectedLine(line);
        setSelectedTest(null);
        setCurrentPage(1);
    }, []);

    const handleBarClick = useCallback((bar: { name: string }) => {
        setSelectedTest(bar.name);
        setCurrentPage(1);
    }, []);

    // Derived data
    const lineOptions = useMemo(() => {
        if (!failsData || !failsData[selectedStation]) return [];
        const linesSet = new Set<string>();
        Object.values(failsData[selectedStation]).forEach((testRecords) => {
            testRecords.forEach((record) => {
                linesSet.add(record.line);
            });
        });
        return Array.from(linesSet);
    }, [failsData, selectedStation]);

    const sortedDataArray = useMemo(() => {
        if (!failsData || !failsData[selectedStation]) return [];
        return Object.entries(failsData[selectedStation])
            .map(([testName, records]) => {
                const filteredRecords =
                    selectedLine === "all"
                        ? records
                        : records.filter((r) => r.line === selectedLine);
                return {
                    name: testName,
                    fails: filteredRecords.length,
                };
            })
            .filter((test) => test.fails > 0)
            .sort((a, b) => b.fails - a.fails);
    }, [failsData, selectedStation, selectedLine]);

    const { totalFails, mostCriticalTest, maxFails } = useMemo(() => {
        const totalFailsLocal = sortedDataArray.reduce((sum, test) => sum + test.fails, 0);
        const mostCriticalTestLocal = sortedDataArray[0] ?? undefined;
        const maxFailsLocal = Math.max(...sortedDataArray.map((t) => t.fails), 0);

        return {
            totalFails: totalFailsLocal,
            mostCriticalTest: mostCriticalTestLocal,
            maxFails: maxFailsLocal,
        };
    }, [sortedDataArray]);

    function getBarColor(fails: number) {
        if (fails >= 50) return "#7f1d1d";   // Danger
        if (fails >= 25) return "#dc2626";   // Abnormal
        if (fails >= 10) return "#f97316";   // Suspicious
        if (fails >= 1) return "#facc15";   // Normal-ish
        return "#22c55e";                    // Perfect (0 fails)
    }

    const filteredRecordsForSelectedTest = useMemo(() => {
        if (!selectedTest || !failsData || !failsData[selectedStation]) return [];
        const allRecords = failsData[selectedStation][selectedTest] || [];
        return selectedLine === "all"
            ? allRecords
            : allRecords.filter((r) => r.line === selectedLine);
    }, [selectedTest, failsData, selectedStation, selectedLine]);

    // Column definitions
    const testRecordColumns = React.useMemo<RT.ColumnDef<TestRecord>[]>(
        () => [
            {
                accessorKey: "deviceCode",
                header: "Device Code",
                cell: ({ row }) => {
                    const record = row.original;
                    return (
                        <Link
                            href={`/device?deviceCode=${encodeURIComponent(record.deviceCode)}`}
                            className="text-primary hover:underline"
                        >
                            {record.deviceCode}
                        </Link>
                    );
                },
            },
            {
                accessorKey: "deviceType",
                header: "Device Type",
                enableSorting: false,
                filterFn: "equals",
            },
            {
                accessorKey: "measuredValue",
                header: ({ column }) => (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        className="hover:bg-transparent"
                    >
                        Measured
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                ),
            },
            {
                accessorKey: "limit",
                header: "Limit",
                enableSorting: false,
                filterFn: "equals",
            },
            {
                accessorKey: "difference",
                header: ({ column }) => (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        className="hover:bg-transparent"
                    >
                        Difference
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                ),
            },
            {
                accessorKey: "line",
                header: "Line",
                enableSorting: false,
                filterFn: "equals",
            },
            {
                accessorKey: "type",
                header: "Test Type",
                enableSorting: false,
                filterFn: "equals",
            },
            {
                accessorKey: "time",
                header: "Timestamp",
                cell: ({ row }) => {
                    const record = row.original;
                    try {
                        return new Date(record.time).toLocaleString();
                    } catch {
                        return "No date";
                    }
                },
                enableSorting: false,
            },
        ],
        []
    );

    // Table instance
    const table = RT.useReactTable({
        data: filteredRecordsForSelectedTest,
        columns: testRecordColumns,
        state: {
            sorting,
            columnFilters,
        },
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: RT.getCoreRowModel(),
        getSortedRowModel: RT.getSortedRowModel(),
        getFilteredRowModel: RT.getFilteredRowModel(),
    });

    // Pagination
    const allRows = table.getRowModel().rows;
    const totalItems = allRows.length;
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1;
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = currentPage * ITEMS_PER_PAGE;
    const currentRows = allRows.slice(startIndex, endIndex);

    // Bar chart height
    const baseHeight = 100;
    const heightPerTest = 20;
    const totalHeight = baseHeight + sortedDataArray.length * heightPerTest;

    // Check if we have any data at all
    const hasData = Object.keys(failsData || {}).length > 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
        >
            <Card className="mt-6">
                <CardHeader>
                    <CardTitle>Failed Tests by Station</CardTitle>
                </CardHeader>
                <CardContent>
                    {!hasData ? (
                        <div className="flex items-center justify-center text-center h-[200px] text-muted-foreground">
                            No failure data available. All systems operating normally.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            <div>
                                <Label htmlFor="station-select">Station</Label>
                                <Select
                                    onValueChange={handleStationChange}
                                    value={selectedStation}
                                    disabled={!hasData}
                                >
                                    <SelectTrigger id="station-select">
                                        <SelectValue placeholder={hasData ? "Select a station" : "No stations available"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.keys(failsData || {}).map((station) => (
                                            <SelectItem key={station} value={station}>
                                                {station}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label htmlFor="line-select">Line</Label>
                                <Select onValueChange={handleLineChange} value={selectedLine}>
                                    <SelectTrigger id="line-select">
                                        <SelectValue placeholder="All Lines" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Lines</SelectItem>
                                        {lineOptions.map((line) => (
                                            <SelectItem key={line} value={line}>
                                                {line}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="text-sm space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="font-medium">Total Failures:</span>
                                    <span>{totalFails || "No data"}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="font-medium flex items-center">
                                        <AlertTriangle className="h-4 w-4 text-destructive mr-2" />
                                        Most Critical:
                                    </span>
                                    <span>
                                        {mostCriticalTest
                                            ? `${mostCriticalTest.name} (${mostCriticalTest.fails} fails)`
                                            : "No data"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {hasData && sortedDataArray.length === 0 ? (
                        <div className="flex items-center justify-center text-center mt-4 text-muted-foreground h-[200px]">
                            No data available for this station/line.
                        </div>
                    ) : hasData && (
                        <ResponsiveContainer width="100%" height={totalHeight}>
                            <BarChart
                                data={sortedDataArray}
                                layout="vertical"
                                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                            >
                                <XAxis type="number" domain={[0, maxFails]} />
                                <YAxis dataKey="name" type="category" width={200} interval={0} />
                                <Tooltip
                                    formatter={(value, _name, props) => [
                                        `${value} fails`,
                                        props.payload.name,
                                    ]}
                                    labelFormatter={() => ""}
                                />
                                <Bar dataKey="fails" onClick={handleBarClick} cursor="pointer">
                                    {sortedDataArray.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={getBarColor(entry.fails)} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    )}

                    {hasData && !selectedTest && sortedDataArray.length > 0 && (
                        <div className="text-center mt-4 text-muted-foreground">
                            Click on any test fail bar to see detailed data.
                        </div>
                    )}

                    <AnimatePresence>
                        {selectedTest && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 20 }}
                                className="mt-6"
                            >
                                <h3 className="text-lg font-semibold mb-4">
                                    {selectedTest} - Failed Devices
                                </h3>

                                <div className="space-y-4">
                                    <Input
                                        placeholder="Filter device codes..."
                                        value={(table.getColumn("deviceCode")?.getFilterValue() as string) ?? ""}
                                        onChange={(event) =>
                                            table.getColumn("deviceCode")?.setFilterValue(event.target.value)
                                        }
                                        className="max-w-sm"
                                    />

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
                                            {currentRows.length ? (
                                                currentRows.map((row) => (
                                                    <TableRow key={row.id}>
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
                                                        colSpan={testRecordColumns.length}
                                                        className="h-24 text-center"
                                                    >
                                                        No results.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>

                                    <div className="flex items-center justify-between">
                                        <Button
                                            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                            disabled={currentPage === 1}
                                            variant="outline"
                                            size="sm"
                                        >
                                            <ChevronLeft className="h-4 w-4 mr-2" />
                                            Previous
                                        </Button>
                                        <span className="text-sm text-muted-foreground">
                                            Page {currentPage} of {totalPages}
                                        </span>
                                        <Button
                                            onClick={() =>
                                                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                                            }
                                            disabled={currentPage === totalPages || totalPages === 0}
                                            variant="outline"
                                            size="sm"
                                        >
                                            Next
                                            <ChevronRight className="h-4 w-4 ml-2" />
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </CardContent>
            </Card>
        </motion.div>
    );
}