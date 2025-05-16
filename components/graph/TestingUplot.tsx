'use client';

import React, { useMemo, useState, useEffect, useRef, useLayoutEffect } from 'react';
import { useRouter } from 'next/navigation';
import UplotReact from 'uplot-react';
import 'uplot/dist/uPlot.min.css';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertCircle, HelpCircle, Info } from 'lucide-react';
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  subWeeks,
  subMonths,
  subDays,
} from 'date-fns';
import { pb_public } from "@/lib/pocketbase";
import { DateRange } from 'react-day-picker';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Types for the new database schema
interface Station {
  id: string;
  name: string;
  line: string;
}

interface DeviceType {
  id: string;
  name: string;
}

interface Line {
  id: string;
  name: string;
}

interface TestDataRecord {
  id: string;
  device_code: string;
  device_type: string;
  station: string;
  test_data: Record<string, number>;
  test_fail: boolean;
  time: string;
}

interface LimitRecord {
  id: string;
  device_type: string[];
  station: string[];
  limits_data: Record<string, { min: number; max: number }>;
}

interface DataPoint {
  time: string;
  value: number;
  device_code: string;
}

// Constants
const EXCLUDED_FIELDS = [
  'id',
  'time',
  'created',
  'updated',
  'collectionId',
  'collectionName',
  'device_code',
  'device_type',
  'test_fail',
];

export function TestingUplot() {
  // Router for navigation
  const router = useRouter();

  // Chart dimensions
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [chartWidth, setChartWidth] = useState(800);

  // Selection state
  const [lines, setLines] = useState<Line[]>([]);
  const [selectedLine, setSelectedLine] = useState<string>('all'); // Default to "all"
  const [stations, setStations] = useState<{ [lineId: string]: Station[] }>({});
  const [selectedStation, setSelectedStation] = useState<string>('');
  const [deviceTypes, setDeviceTypes] = useState<DeviceType[]>([]);
  const [selectedDeviceType, setSelectedDeviceType] = useState<string>('');

  // Test selection
  const [availableTests, setAvailableTests] = useState<string[]>([]);
  const [selectedTest, setSelectedTest] = useState<string>('');

  // Limits
  const [limits, setLimits] = useState<Record<string, { min: number; max: number }>>({});
  const [upperLimit, setUpperLimit] = useState<number>(8);
  const [lowerLimit, setLowerLimit] = useState<number>(2);

  // Data
  const [data, setData] = useState<[number[], number[]]>([[], []]);
  const [indices, setIndices] = useState<number[]>([]);
  const [deviceCodes, setDeviceCodes] = useState<string[]>([]);

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [isTestsLoading, setIsTestsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Date range
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const today = new Date();
    // Set default to today's date range
    return {
      from: startOfDay(today),
      to: endOfDay(today),
    };
  });

  // Data cache
  const dataCache = useRef<{
    [key: string]: TestDataRecord[];
  }>({});

  // Format timestamp for tooltip display
  const formatTimestamp = (unixTimestamp: number): string => {
    const date = new Date(unixTimestamp * 1000);
    return date.toLocaleString();
  };

  // Handle chart point click to navigate to device details
  const handlePointClick = (deviceCode: string) => {
    if (deviceCode) {
      const encodedDeviceCode = encodeURIComponent(deviceCode);
      router.push(`/device?deviceCode=${encodedDeviceCode}`);
    }
  };

  // Set chart width based on container size
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

  // Fetch lines and device types on component mount
  useEffect(() => {
    const initializeComponent = async () => {
      try {
        // Fetch lines
        const linesData = await pb_public.collection('lines').getFullList<Line>();
        setLines(linesData);

        if (linesData.length > 0) {
          setSelectedLine(linesData[0].id);
        }

        // Fetch device types
        const deviceTypesData = await pb_public.collection('device_types').getFullList<DeviceType>();
        setDeviceTypes(deviceTypesData);

        if (deviceTypesData.length > 0) {
          setSelectedDeviceType(deviceTypesData[0].id);
        }
      } catch (error) {
        console.error('Error initializing component:', error);
        setError('Failed to load initial data');
      }
    };

    initializeComponent();
  }, []);

  // Fetch stations when line changes
  useEffect(() => {
    const fetchStations = async () => {
      try {
        let stationsData: Station[] = [];

        if (selectedLine === 'all') {
          // Fetch stations from all lines
          stationsData = await pb_public.collection('stations').getFullList<Station>();

          // Group by line for organization
          const groupedStations: { [lineId: string]: Station[] } = {};

          // Initialize with empty arrays for each line
          lines.forEach((line) => {
            groupedStations[line.id] = [];
          });

          // Add "all" line for combined view
          groupedStations['all'] = stationsData;

          // Group stations by their line
          stationsData.forEach((station) => {
            if (groupedStations[station.line]) {
              groupedStations[station.line].push(station);
            }
          });

          setStations(groupedStations);
        } else {
          // Fetch stations for specific line
          stationsData = await pb_public.collection('stations').getFullList<Station>({
            filter: `line = "${selectedLine}"`,
          });

          setStations((prev) => ({ ...prev, [selectedLine]: stationsData }));
        }

        if (stationsData.length > 0) {
          setSelectedStation(stationsData[0].id);
        }
      } catch (error) {
        console.error('Error fetching stations:', error);
        setError('Failed to load stations');
      }
    };

    if (selectedLine || selectedLine === 'all') {
      fetchStations();
    }
  }, [selectedLine, lines]);

  // Fetch available tests when station and device type change
  useEffect(() => {
    const fetchTests = async () => {
      if (!selectedStation || !selectedDeviceType) {
        setAvailableTests([]);
        setSelectedTest('');
        return;
      }

      setIsTestsLoading(true);
      setError(null);

      try {
        // Get a sample record to find available tests
        const record = await pb_public
          .collection('test_data')
          .getFirstListItem<TestDataRecord>(
            `station = "${selectedStation}" && device_type = "${selectedDeviceType}"`,
            { sort: '-time' },
          );

        if (record && record.test_data) {
          const tests = Object.keys(record.test_data).filter(
            (key) => !EXCLUDED_FIELDS.includes(key),
          );

          setAvailableTests(tests);

          if (tests.length > 0) {
            setSelectedTest(tests[0]);
          } else {
            setSelectedTest('');
            setError('No test data available for this combination');
          }
        } else {
          setAvailableTests([]);
          setSelectedTest('');
          setError('No test data found for the selected parameters');
        }
      } catch (error) {
        console.error('Error fetching tests:', error);
        setAvailableTests([]);
        setSelectedTest('');
        setError('Failed to fetch test data');
      } finally {
        setIsTestsLoading(false);
      }
    };

    fetchTests();
  }, [selectedStation, selectedDeviceType]);

  // Fetch limits when station and device type change
  useEffect(() => {
    const fetchLimits = async () => {
      if (!selectedStation || !selectedDeviceType) return;

      try {
        // Try to find a matching limits record
        const records = await pb_public.collection('limits').getFullList<LimitRecord>({
          filter: `station ~ "${selectedStation}" && device_type ~ "${selectedDeviceType}"`,
        });

        if (records.length > 0 && records[0].limits_data) {
          setLimits(records[0].limits_data);
        } else {
          // No matching limits found, set defaults
          console.log(
            `No limits found for station=${selectedStation} and device_type=${selectedDeviceType}`,
          );
          setLimits({});
        }
      } catch (error) {
        console.error('Error fetching limits:', error);
        setLimits({});
      }
    };

    fetchLimits();
  }, [selectedStation, selectedDeviceType]);

  // Update upper and lower limits when selected test or limits change
  useEffect(() => {
    if (selectedTest && limits[selectedTest]) {
      setUpperLimit(limits[selectedTest].max);
      setLowerLimit(limits[selectedTest].min);
    } else {
      // Apply smart defaults based on data if available
      if (data[1] && data[1].length > 0) {
        // If we have data but no limits, estimate reasonable bounds
        const values = data[1].filter((v) => v !== null && v !== undefined);
        if (values.length > 0) {
          const min = Math.min(...values);
          const max = Math.max(...values);
          const range = max - min;

          // Set bounds with 10% padding
          setUpperLimit(max + range * 0.1);
          setLowerLimit(min - range * 0.1);
          return;
        }
      }

      // Fallback to default values if no data or limits found
      setUpperLimit(8);
      setLowerLimit(2);
    }
  }, [selectedTest, limits, data]);

  // Fetch test data when parameters change
  useEffect(() => {
    const fetchData = async () => {
      if (
        !selectedStation ||
        !selectedDeviceType ||
        !selectedTest ||
        !dateRange?.from ||
        !dateRange?.to
      ) {
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const cacheKey = `${selectedStation}_${selectedDeviceType}_${dateRange.from.toISOString()}_${dateRange.to.toISOString()}`;

        if (!dataCache.current[cacheKey]) {
          const records = await pb_public.collection('test_data').getFullList<TestDataRecord>({
            filter: `station = "${selectedStation}" && device_type = "${selectedDeviceType}" && time >= "${dateRange.from.toISOString()}" && time <= "${dateRange.to.toISOString()}"`,
            sort: 'time',
          });

          dataCache.current[cacheKey] = records;
        }

        const cachedData = dataCache.current[cacheKey];

        if (cachedData.length === 0) {
          setError('No data available for the selected parameters');
          setData([[], []]);
          setIndices([]);
          setDeviceCodes([]);
        } else {
          const [timestamps, values, codes] = extractTestData(cachedData, selectedTest);
          setData([timestamps, values]);
          setIndices(Array.from({ length: timestamps.length }, (_, i) => i));
          setDeviceCodes(codes);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to fetch data');
        setData([[], []]);
        setIndices([]);
        setDeviceCodes([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [selectedStation, selectedDeviceType, selectedTest, dateRange]);

  // Extract test data from records
  const extractTestData = (
    records: TestDataRecord[],
    test: string,
  ): [number[], number[], string[]] => {
    const timestamps: number[] = [];
    const values: number[] = [];
    const deviceCodes: string[] = [];

    records.forEach((record) => {
      if (record.test_data && test in record.test_data) {
        timestamps.push(new Date(record.time).getTime() / 1000);
        values.push(record.test_data[test]);
        deviceCodes.push(record.device_code);
      }
    });

    return [timestamps, values, deviceCodes];
  };

  // Chart options
  const options = useMemo(() => {
    // Find the selected station and device type names for title
    const stationName =
      stations[selectedLine]?.find((s) => s.id === selectedStation)?.name || 'Unknown Station';
    const deviceTypeName =
      deviceTypes.find((dt) => dt.id === selectedDeviceType)?.name || 'Unknown Type';

    return {
      title: `${stationName} - ${deviceTypeName} - ${selectedTest}`,
      width: chartWidth,
      height: 500,
      series: [
        {},
        {
          show: true,
          spanGaps: true,
          label: selectedTest,
          stroke: 'orange',
          width: 2,
          value: (self: any, rawValue: number) => (rawValue ? `${rawValue}` : '--'),
          scale: 'y',
          points: {
            show: true,
            size: 5,
            fill: 'orange',
          },
        },
        {
          show: true,
          spanGaps: true,
          label: 'Upper Limit',
          stroke: 'red',
          width: 1,
          dash: [5, 5],
          scale: 'y',
          points: { show: false },
        },
        {
          show: true,
          spanGaps: true,
          label: 'Lower Limit',
          stroke: 'blue',
          width: 1,
          dash: [5, 5],
          scale: 'y',
          points: { show: false },
        },
      ],
      scales: {
        x: {
          time: false,
        },
        y: {
          auto: true,
          side: 3,
        },
      },
      axes: [
        {
          scale: 'x',
          values: (self: any, ticks: number[]) =>
            ticks.map((v) => {
              const index = Math.floor(v);
              const timestamp = data[0][index];
              return timestamp ? new Date(timestamp * 1000).toLocaleDateString() : '';
            }),
          space: 80,
          grid: { show: true, stroke: '#e0e0e0', width: 1, dash: [5, 5] },
          ticks: { show: true, size: 10, stroke: '#000', width: 1 },
          side: 2,
          label: 'Date',
        },
        {
          scale: 'y',
          values: (self: any, ticks: number[]) => ticks.map((v) => `${v}`),
          grid: { show: true, stroke: '#e0e0e0', width: 1, dash: [5, 5] },
          ticks: { show: true, size: 10, stroke: '#000', width: 1 },
          side: 3,
          label: selectedTest,
        },
      ],
      cursor: {
        drag: {
          x: true,
          y: false,
        },
        y: false,
        x: false,
        points: {
          show: true,
          size: 5,
          fill: 'orange',
        },
        dataIdx: (self: any, seriesIdx: number, closestIdx: number) => {
          if (seriesIdx === 1) {
            // When hovering over a point, show time and device code in tooltip
            const deviceCode = deviceCodes[closestIdx];
            const timestamp = data[0][closestIdx];

            if (deviceCode && timestamp) {
              // Format the tooltip to show both time and device code
              self.over.title = `Time: ${formatTimestamp(timestamp)}\nDevice: ${deviceCode}\n(Click for details)`;
            }
          }
          return closestIdx;
        },
      },
      hooks: {
        setCursor: [
          (self: any) => {
            const idx = self.cursor.idx;
            if (idx !== null && deviceCodes[idx] && data[0][idx]) {
              self.over.title = `Time: ${formatTimestamp(data[0][idx])}\nDevice: ${deviceCodes[idx]}\n(Click for details)`;
            }
          },
        ],
        // Add click handling for point navigation
        setSelect: [
          (self: any) => {
            const idx = self.cursor.idx;
            if (idx !== null && deviceCodes[idx]) {
              handlePointClick(deviceCodes[idx]);
            }
          }
        ]
      },
    };
  }, [
    selectedTest,
    chartWidth,
    data,
    upperLimit,
    lowerLimit,
    selectedLine,
    selectedStation,
    selectedDeviceType,
    stations,
    deviceTypes,
    deviceCodes,
    router,
  ]);

  return (
    <Card className="w-full rounded [&_.u-cursor-pt]:cursor-pointer">
      <CardHeader className="flex flex-col gap-4 border-b">
        <div className="flex flex-row justify-between items-center">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <CardTitle>SPC Chart</CardTitle>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Click on data points to view device details</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <CardDescription>
              {dateRange?.from && dateRange?.to
                ? `${dateRange.from.toLocaleDateString()} - ${dateRange.to.toLocaleDateString()}`
                : 'Select a date range'}
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2 sm:gap-4">
            {/* Line Selection */}
            <Select
              value={selectedLine}
              onValueChange={(line) => {
                setSelectedLine(line);
                setError(null);
              }}
            >
              <SelectTrigger className="w-24 sm:w-32">
                <SelectValue placeholder="Line" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Lines</SelectItem>
                {lines.map((line) => (
                  <SelectItem key={line.id} value={line.id}>
                    {line.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Station Selection */}
            <Select
              value={selectedStation}
              onValueChange={(station) => {
                setSelectedStation(station);
                setError(null);
              }}
              disabled={!selectedLine || !stations[selectedLine]?.length}
            >
              <SelectTrigger className="w-24 sm:w-32">
                <SelectValue placeholder="Station" />
              </SelectTrigger>
              <SelectContent>
                {selectedLine &&
                  stations[selectedLine]?.map((station) => (
                    <SelectItem key={station.id} value={station.id}>
                      {station.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>

            {/* Device Type Selection */}
            <Select
              value={selectedDeviceType}
              onValueChange={(type) => {
                setSelectedDeviceType(type);
                setError(null);
              }}
            >
              <SelectTrigger className="w-24 sm:w-32">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                {deviceTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Test Selection */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Select
                      value={selectedTest}
                      onValueChange={(test) => {
                        setSelectedTest(test);
                        setError(null);
                      }}
                      disabled={availableTests.length === 0 || isTestsLoading}
                    >
                      <SelectTrigger className="w-32 sm:w-40">
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
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Select a test parameter to display on the chart</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Date Range Selection */}
            <Select
              defaultValue="today"
              onValueChange={(value) => {
                const today = new Date();

                switch (value) {
                  case 'today':
                    setDateRange({
                      from: startOfDay(today),
                      to: endOfDay(today),
                    });
                    break;
                  case 'this-week':
                    setDateRange({
                      from: startOfWeek(today, { weekStartsOn: 1 }),
                      to: today,
                    });
                    break;
                  case 'last-week':
                    const lastWeekStart = startOfWeek(subWeeks(today, 1), { weekStartsOn: 1 });
                    const lastWeekEnd = endOfWeek(lastWeekStart, { weekStartsOn: 1 });
                    setDateRange({
                      from: lastWeekStart,
                      to: lastWeekEnd,
                    });
                    break;
                  case 'last-2-weeks':
                    setDateRange({
                      from: startOfWeek(subWeeks(today, 2), { weekStartsOn: 1 }),
                      to: today,
                    });
                    break;
                  case 'last-month':
                    setDateRange({
                      from: subMonths(today, 1),
                      to: today,
                    });
                    break;
                }
              }}
            >
              <SelectTrigger className="w-32 sm:w-40">
                <SelectValue placeholder="Date range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="this-week">This week</SelectItem>
                <SelectItem value="last-week">Last week</SelectItem>
                <SelectItem value="last-2-weeks">Last 2 weeks</SelectItem>
                <SelectItem value="last-month">Last month</SelectItem>
              </SelectContent>
            </Select>
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
          <>
            <UplotReact
              options={options}
              data={[
                indices, // Use indices for x-axis
                data[1], // Values
                Array(indices.length).fill(upperLimit), // Upper limit line
                Array(indices.length).fill(lowerLimit), // Lower limit line
              ]}
            />
            {data[1].length > 0 && (
              <TooltipProvider>
                <div className="flex items-center justify-center gap-2 mt-3">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground cursor-help">
                        <Info className="h-3 w-3" />
                        <span>Hovering shows details, clicking navigates to device page</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-xs">
                      <p>Hover over points to see time and device code. Click to analyze the specific device in detail.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </TooltipProvider>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}