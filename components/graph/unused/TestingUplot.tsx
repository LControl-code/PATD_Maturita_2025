"use client"

import React, { useMemo, useState, useEffect, useRef, useLayoutEffect } from 'react';
import UplotReact from 'uplot-react';
import 'uplot/dist/uPlot.min.css';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon, AlertCircle } from "lucide-react";
import { format, startOfWeek, endOfWeek, subWeeks, addDays, subDays, subMonths, subYears } from "date-fns";
import { pb } from "@/lib/pocketbase_connect";
import { DateRange } from "react-day-picker";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Types
type Station = keyof typeof STATIONS;
interface DataPoint {
  time: string;
  [key: string]: any;
}

// Update interfaces for station limits
interface TestLimit {
  motor_type: string;
  [limitName: string]: number | string;
}

interface StationLimits {
  [station: string]: TestLimit[];
}

// Constants
const STATIONS = {
  station_a20: 'A20',
  station_a25: 'A25',
  station_a26: 'A26',
  station_nvh: 'NVH',
  station_s02: 'S02',
  station_r23: 'R23'
} as const;

const EXCLUDED_FIELDS = [
  'time',
  'id',
  'created',
  'updated',
  'collectionId',
  'collectionName',
  'device_code',
  'motor_type',
  'test_fail'
];

const getAvailableTests = async (station: Station): Promise<string[]> => {
  try {
    const record = await pb.collection(station).getFirstListItem('');
    return Object.keys(record).filter(key => !EXCLUDED_FIELDS.includes(key));
  } catch (error) {
    console.error('Error fetching tests:', error);
    return [];
  }
};

const generateAllData = async (
  station: Station,
  startDate: Date,
  endDate: Date
): Promise<DataPoint[]> => {
  try {
    const records = await pb.collection(station).getFullList<DataPoint>({
      filter: `time>="${startDate.toISOString().split('T')[0]} 00:00:00" && time<="${endDate.toISOString().split('T')[0]} 23:59:59"`,
    });

    return records;
  } catch (error) {
    console.error('Error generating data:', error);
    return [];
  }
};

export function TestingUplot() {
  const [selectedStation, setSelectedStation] = useState<Station>('station_s02');
  const [availableTests, setAvailableTests] = useState<string[]>([]);
  const [selectedTest, setSelectedTest] = useState<string>('');
  const [data, setData] = useState<[number[], number[]]>([[], []]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [chartWidth, setChartWidth] = useState(800);
  const [isTestsLoading, setIsTestsLoading] = useState(true); // New state for tests loading

  // Cache for storing fetched data
  const dataCache = useRef<{ [station: string]: { [range: string]: DataPoint[] } }>({});

  // Adjust state for station limits
  const [stationLimits, setStationLimits] = useState<StationLimits>({});

  // Replace hard-coded limits with dynamic state
  const [upperLimit, setUpperLimit] = useState<number>(8); // Default value
  const [lowerLimit, setLowerLimit] = useState<number>(2); // Default value

  // Update dateRange initial state to not go beyond 3 months ago
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const currentDate = new Date();
    const maxDate = currentDate;
    const minDate = subMonths(currentDate, 3);
    const lastWeekStart = startOfWeek(subWeeks(currentDate, 1));
    const adjustedStart = lastWeekStart < minDate ? minDate : lastWeekStart;
    const lastWeekEnd = endOfWeek(lastWeekStart);
    const adjustedEnd = lastWeekEnd > maxDate ? maxDate : lastWeekEnd;
    return {
      from: adjustedStart,
      to: adjustedEnd,
    };
  });

  // Update presetOptions to ensure date ranges are within the last 3 months
  const presetOptions = [
    { label: 'Today', range: { from: new Date(), to: new Date() } },
    { label: 'Yesterday', range: { from: subDays(new Date(), 1), to: subDays(new Date(), 1) } },
    { label: 'Last 7 Days', range: { from: subDays(new Date(), 7), to: new Date() } },
    { label: 'Last 30 Days', range: { from: subDays(new Date(), 30), to: new Date() } },
    {
      label: 'Last 3 Months',
      range: { from: subMonths(new Date(), 3), to: new Date() }
    },
    // Remove or adjust presets that go beyond 3 months
  ];

  useLayoutEffect(() => {
    const updateWidth = () => {
      if (chartContainerRef.current) {
        setChartWidth(chartContainerRef.current.offsetWidth - 50);
      }
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // Combine fetching tests and initial data when station changes
  useEffect(() => {
    const fetchTestsAndData = async () => {
      setIsTestsLoading(true);
      setError(null);
      try {
        const tests = await getAvailableTests(selectedStation);
        setAvailableTests(tests);
        if (tests.length > 0) {
          const initialTest = tests[0];
          setSelectedTest(initialTest);
          // Fetch all data for the station within the date range
          const rangeKey = `${dateRange.from?.toISOString()}_${dateRange.to?.toISOString()}`;
          if (dataCache.current[selectedStation]?.[rangeKey]) {
            setData(extractTestData(dataCache.current[selectedStation][rangeKey], initialTest));
            setIndices(dataCache.current[selectedStation][rangeKey].map((_, idx) => idx));
          } else {
            const allData = await generateAllData(selectedStation, dateRange.from, dateRange.to);
            if (!dataCache.current[selectedStation]) {
              dataCache.current[selectedStation] = {};
            }
            dataCache.current[selectedStation][rangeKey] = allData;
            setData(extractTestData(allData, initialTest));
            setIndices(allData.map((_, idx) => idx));
            if (allData.length === 0) {
              setError('No data available for the selected parameters');
            }
          }
        } else {
          setSelectedTest('');
          setData([[], []]);
        }
      } catch (error) {
        setError('Failed to fetch tests or data');
      } finally {
        setIsTestsLoading(false);
        setIsLoading(false);
      }
    };

    fetchTestsAndData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStation]);

  // Separate useEffect for fetching data when dateRange changes
  useEffect(() => {
    const fetchData = async () => {
      if (!dateRange?.from || !dateRange?.to) return;

      setIsLoading(true);
      setError(null);
      try {
        const rangeKey = `${dateRange.from?.toISOString()}_${dateRange.to?.toISOString()}`;
        if (dataCache.current[selectedStation]?.[rangeKey]) {
          setData(extractTestData(dataCache.current[selectedStation][rangeKey], selectedTest));
          setIndices(dataCache.current[selectedStation][rangeKey].map((_, idx) => idx));
        } else {
          const allData = await generateAllData(selectedStation, dateRange.from, dateRange.to);
          if (!dataCache.current[selectedStation]) {
            dataCache.current[selectedStation] = {};
          }
          dataCache.current[selectedStation][rangeKey] = allData;
          setData(extractTestData(allData, selectedTest));
          setIndices(allData.map((_, idx) => idx));
          if (allData.length === 0) {
            setError('No data available for the selected parameters');
          }
        }
      } catch (error) {
        setError('Failed to fetch data');
      } finally {
        setIsLoading(false);
      }
    };

    // Avoid fetching data again if it's already fetched during station change
    if (!isTestsLoading) {
      fetchData();
    }
  }, [dateRange]);

  // Add a state for indices
  const [indices, setIndices] = useState<number[]>([]);

  // Function to extract test data from all data
  const extractTestData = (allData: DataPoint[], test: string): [number[], number[]] => {
    const timestamps: number[] = [];
    const values: number[] = [];

    allData.forEach(record => {
      timestamps.push(new Date(record.time).getTime() / 1000);
      values.push(record[test]);
    });

    return [timestamps, values];
  };

  // Update fetchStationLimits to handle API array structure
  const fetchStationLimits = async () => {
    try {
      const response = await fetch('/api/data/stations');
      const data: any[] = await response.json();
      const limitsMap: StationLimits = {};

      data.forEach(stationEntry => {
        Object.entries(stationEntry).forEach(([station, limitsArray]) => {
          if (!limitsMap[station]) {
            limitsMap[station] = [];
          }
          limitsMap[station].push(...limitsArray);
        });
      });

      console.log('Fetched station limits:', limitsMap);
      setStationLimits(limitsMap);
    } catch (error) {
      console.error('Error fetching station limits:', error);
      // Optionally handle error state
    }
  };

  // Fetch station limits on component mount
  useEffect(() => {
    fetchStationLimits();
  }, []);

  // Update limits when selectedTest or stationLimits change
  useEffect(() => {
    if (selectedTest && stationLimits[selectedStation]) {
      const stationTests = stationLimits[selectedStation];
      for (const testLimit of stationTests) {
        const upperKey = `${selectedTest}_MAX`;
        const lowerKey = `${selectedTest}_MIN`;
        if (upperKey in testLimit && lowerKey in testLimit) {
          const upper = testLimit[upperKey];
          const lower = testLimit[lowerKey];
          if (typeof upper === 'number' && typeof lower === 'number') {
            setUpperLimit(upper);
            setLowerLimit(lower);
            break;
          }
        }
      }
    }
  }, [selectedTest, stationLimits, selectedStation]);

  // Update data when selected test changes
  useEffect(() => {
    if (selectedTest && dataCache.current[selectedStation]) {
      const rangeKey = `${dateRange.from?.toISOString()}_${dateRange.to?.toISOString()}`;
      const cachedData = dataCache.current[selectedStation][rangeKey];
      if (cachedData) {
        setData(extractTestData(cachedData, selectedTest));
      }
    }
  }, [selectedTest]);

  const options = useMemo(() => ({
    title: `${STATIONS[selectedStation]} - ${selectedTest}`,
    width: chartWidth,
    height: 500,
    series: [
      {},
      {
        show: true,
        spanGaps: true,
        label: selectedTest,
        stroke: "orange",
        width: 2,
        value: (self: any, rawValue: number) => rawValue ? `${rawValue}` : "--",
        scale: 'y',
        points: { show: false } // Hide the dots
      },
      {
        show: true,
        spanGaps: true,
        label: "Upper Limit",
        stroke: "red",
        width: 1,
        dash: [5, 5],
        scale: 'y',
        points: { show: false } // Hide the dots
      },
      {
        show: true,
        spanGaps: true,
        label: "Lower Limit",
        stroke: "blue",
        width: 1,
        dash: [5, 5],
        scale: 'y',
        points: { show: false } // Hide the dots
      }
    ],
    scales: {
      x: {
        time: false // Set time to false to use ordinal scale
      },
      y: {
        auto: true,
        side: 3
      }
    },
    axes: [
      {
        scale: "x",
        // Update values to display dates from original timestamps
        values: (self: any, ticks: number[]) => ticks.map(v => {
          const index = Math.floor(v);
          const timestamp = data[0][index];
          return timestamp ? new Date(timestamp * 1000).toLocaleDateString() : '';
        }),
        space: 80,
        grid: { show: true, stroke: "#e0e0e0", width: 1, dash: [5, 5] },
        ticks: { show: true, size: 10, stroke: "#000", width: 1 },
        side: 2,
        label: "Date"
      },
      {
        scale: 'y',
        values: (self: any, ticks: number[]) => ticks.map(v => `${v} V`),
        grid: { show: true, stroke: "#e0e0e0", width: 1, dash: [5, 5] },
        ticks: { show: true, size: 10, stroke: "#000", width: 1 },
        side: 3,
        label: selectedTest
      }
    ],
    cursor: {
      drag: {
        x: true,
        y: false
      },
      y: false,
      x: false,
    }
  }), [selectedTest, chartWidth, data, upperLimit, lowerLimit]);

  // Ensure manual date selections are within the allowed range
  useEffect(() => {
    if (dateRange?.from && dateRange.to) {
      const minDate = subMonths(new Date(), 3);
      const maxDate = new Date();
      const adjustedFrom = dateRange.from < minDate ? minDate : dateRange.from;
      const adjustedTo = dateRange.to > maxDate ? maxDate : dateRange.to;
      if (adjustedFrom !== dateRange.from || adjustedTo !== dateRange.to) {
        setDateRange({ from: adjustedFrom, to: adjustedTo });
      }
    }
  }, [dateRange]);

  return (
    <Card className="w-full rounded">
      <CardHeader className="flex flex-col gap-4 border-b">
        <div className="flex flex-row justify-between items-center">
          <div className="flex flex-col gap-1">
            <CardTitle>Time Series Chart</CardTitle>
            <CardDescription>
              {dateRange?.from && dateRange?.to
                ? `${format(dateRange.from, 'PP')} - ${format(dateRange.to, 'PP')}`
                : 'Select a date range'
              }
            </CardDescription>
          </div>
          <div className="flex gap-4">
            <Select
              value={selectedStation}
              onValueChange={(station) => {
                setSelectedStation(station as Station);
                setSelectedTest('');
                setError(null);
              }}
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Select station" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(STATIONS).map(([key, name]) => (
                  <SelectItem key={key} value={key}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={selectedTest}
              onValueChange={(test) => {
                setSelectedTest(test);
                setError(null);
              }}
              disabled={availableTests.length === 0}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select test" />
              </SelectTrigger>
              <SelectContent>
                {availableTests.map((test) => (
                  <SelectItem key={test} value={test}>
                    {test}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[280px] justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from && dateRange?.to ? (
                    `${format(dateRange.from, 'PP')} - ${format(dateRange.to, 'PP')}`
                  ) : (
                    <span>Pick a date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-2" align="start">
                <Select
                  onValueChange={(value) => {
                    const selectedPreset = presetOptions.find(option => option.label === value);
                    if (selectedPreset) {
                      setDateRange(selectedPreset.range);
                    }
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Preset" />
                  </SelectTrigger>
                  <SelectContent>
                    {presetOptions.map(option => (
                      <SelectItem key={option.label} value={option.label}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="rounded-md border mt-2">
                  <Calendar
                    mode="range"
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                    disabled={{
                      before: subMonths(new Date(), 3),
                      after: new Date(),
                    }}
                  />
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </CardHeader>
      <CardContent className="w-full my-4 grow" ref={chartContainerRef}>
        {isLoading ? (
          <div className="flex justify-center items-center h-96">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
          </div>
        ) : error ? (
          <Alert variant="destructive" className="my-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : (
          <UplotReact
            options={options}
            data={[
              indices,                                  // Use indices for x-axis
              data[1],                                  // Values
              Array(indices.length).fill(upperLimit),   // Upper limit line
              Array(indices.length).fill(lowerLimit)    // Lower limit line
            ]}
          />
        )}
      </CardContent>
    </Card>
  );
}