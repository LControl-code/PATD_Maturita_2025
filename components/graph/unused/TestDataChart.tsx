"use client"

import React, { useState, useEffect, useCallback, useMemo, type JSX } from "react";
import { CartesianGrid, Line, XAxis, YAxis, Brush, ComposedChart, ResponsiveContainer, ReferenceArea } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import DatePickerWithRange from "@/components/ui/date-picker-with-range" // Assuming you have this component
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart"
import { pb } from "@/lib/pocketbase_connect"
import { CategoricalChartState } from "recharts/types/chart/types";

type TestDataPoint = {
  time: string
  [key: string]: any
}

/**
 * A component that displays test data in a chart format.
 * 
 * Features:
 * - Displays test data over time in a line chart
 * - Allows selection of different test metrics
 * - Supports date range filtering
 * - Interactive zoom/brush functionality
 * - Custom tooltip and legend
 * - Area selection capability
 * 
 * @returns {JSX.Element} A card containing the chart and controls
 * 
 * State:
 * @property {TestDataPoint[]} chartData - Array of test data points
 * @property {string[]} availableTests - List of available test metrics
 * @property {string} selectedTest - Currently selected test metric
 * @property {Object} dateRange - Selected date range with from and to dates
 * @property {Object} selection - Current area selection coordinates
 * @property {boolean} selecting - Whether area selection is in progress
 * @property {Object} range - Zoom range coordinates
 * 
 * Components:
 * - Uses ResponsiveContainer and ComposedChart from recharts
 * - Includes DatePickerWithRange for date filtering
 * - Select component for test metric selection
 * - Custom ChartContainer for styling
 */
export function TestDataChart(): JSX.Element {
  const [chartData, setChartData] = useState<TestDataPoint[]>([])
  const [availableTests, setAvailableTests] = useState<string[]>([])
  const [selectedTest, setSelectedTest] = useState<string>("")
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(new Date().setDate(new Date().getDate() - 2)),
    to: new Date(),
  })
  const [selection, setSelection] = useState<{ left: number | null; right: number | null }>({ left: null, right: null });
  const [selecting, setSelecting] = useState(false);
  const [range, setRange] = useState<{ left: number; right: number }>({ left: 0, right: 0 });


  const chartConfig = useMemo(() => {
    const config: ChartConfig = {}
    if (selectedTest) {
      config[selectedTest] = {
        label: selectedTest,
        color: "hsl(var(--chart-1))",
      }
    }
    return config
  }, [selectedTest])

  useEffect(() => {
    const fetchTestData = async () => {
      try {
        const records = await pb.collection('station_s02').getFullList({
          filter: `time>="${dateRange.from.toISOString()}" && time<="${dateRange.to.toISOString()}"`,
          sort: '-created',
          cache: 'no-store',
        })

        const testNames = Object.keys(records[0] || {}).filter(key =>
          !['time', 'id', 'created', 'updated', 'collectionId', 'collectionName', 'device_code', 'motor_type', 'test_fail'].includes(key)
        )

        setAvailableTests(testNames)
        setSelectedTest(testNames[0] || "")

        const formattedData = records.map(record => ({
          time: new Date(record.time).toISOString(),
          ...record
        }))

        setChartData(formattedData)
      } catch (error) {
        console.error('Error fetching test data:', error)
      }
    }

    fetchTestData()
  }, [dateRange])

  const handleDateRangeChange = useCallback((range: { from: Date; to: Date }) => {
    console.log(range)
    setDateRange(range)
  }, [])

  const handleMouseDown = useCallback(
    (e: CategoricalChartState) => {
      if (e.activeLabel) {
        setSelection({
          left: chartData.findIndex((d) => d.time === e.activeLabel),
          right: null,
        });
        setSelecting(true);
      }
    },
    [chartData]
  );

  const handleMouseMove = useCallback(
    (e: CategoricalChartState) => {
      if (selecting && e.activeLabel) {
        setSelection((prev) => ({
          ...prev,
          right: chartData.findIndex((d) => d.time === e.activeLabel),
        }));
      }
    },
    [selecting, chartData]
  );

  const handleMouseUp = useCallback(() => {
    if (selection.left !== null && selection.right !== null) {
      const [tempLeft, tempRight] = [selection.left, selection.right].sort(
        (a, b) => a - b
      );
      setRange({ left: tempLeft, right: tempRight });
    }
    setSelection({ left: null, right: null });
    setSelecting(false);
  }, [selection]);

  const reset = useCallback(() => {
    setRange({ left: 0, right: chartData.length - 1 });
  }, [chartData]);

  const memoizedChart = useMemo(() => (
    <ResponsiveContainer>
      <ComposedChart
        data={chartData}
        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="time"
          tickLine={false}
          axisLine={false}
          tickMargin={7}
          tickFormatter={(value) => {
            const date = new Date(value)
            return date.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })
          }}
          style={{ userSelect: "none" }}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          width={40}
          style={{ userSelect: "none" }}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              className="w-[200px]"
              labelFormatter={(value) => {
                return new Date(value).toLocaleString('en-US', {
                  dateStyle: 'medium',
                  timeStyle: 'short'
                })
              }}
            />
          }
        />

        {selectedTest && (
          <Line
            key={selectedTest}
            dataKey={selectedTest}
            type="monotone"
            stroke={chartConfig[selectedTest].color}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        )}

        {selection.left !== null && selection.right !== null && (
          <ReferenceArea
            x1={chartData[selection.left].time}
            x2={chartData[selection.right].time}
            strokeOpacity={0.3}
            fill="hsl(var(--chart-3))"
            fillOpacity={0.05}
          />
        )}

        <ChartLegend content={<ChartLegendContent />} />
        <Brush
          dataKey="time"
          height={50}
          stroke="hsl(var(--chart-1))"
          fill="hsl(var(--chart-5))"
        />
      </ComposedChart>
    </ResponsiveContainer>
  ), [chartData, selectedTest, chartConfig, selection])

  return (
    <Card className="w-full rounded">
      <CardHeader className="flex flex-row flex-wrap gap-4 sm:gap-0 justify-between items-center border-b">
        <div className="flex flex-col gap-1">
          <CardTitle>Test Data Analysis</CardTitle>
          <CardDescription>
            {dateRange.from.toLocaleDateString()} - {dateRange.to.toLocaleDateString()}
          </CardDescription>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <DatePickerWithRange
            onDateRangeChange={handleDateRangeChange}
          />
          <div className="flex items-center gap-2">
            <Select value={selectedTest} onValueChange={setSelectedTest}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select a test" />
              </SelectTrigger>
              <SelectContent>
                {availableTests.map(test => (
                  <SelectItem key={test} value={test}>
                    {test}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              variant="outline"
              className="rounded"
              onClick={reset}
            >
              Reset Zoom
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="w-full h-[450px] my-4">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-full w-full"
        >
          {memoizedChart}
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

export default TestDataChart