"use client"
import React, { useState, useEffect, useCallback, useMemo, useRef, type JSX } from "react";
import { CartesianGrid, Line, XAxis, YAxis, Brush, ComposedChart, ResponsiveContainer, ReferenceArea } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { Button } from "@/components/ui/button";
import { CategoricalChartState } from "recharts/types/chart/types";
import { pb } from "@/lib/pocketbase_connect";

type DataPoint = {
  date: string;
  [key: string]: any;
};

// Create a date index map for O(1) lookups
type DateIndexMap = {
  [key: string]: number;
};

const generateData = async (startDate: Date, endDate: Date): Promise<DataPoint[]> => {
  const records = await pb.collection('station_s02').getFullList({
    filter: `time>="${startDate.toISOString().split('T')[0]} 00:00:00" && time<="${endDate.toISOString().split('T')[0]} 23:59:59"`,
    fields: "time, HiPot_1_UVW_G_NTC",
  });

  return records.map(record => ({
    date: record.time,
    HiPot_1_UVW_G_NTC: record.HiPot_1_UVW_G_NTC,
  }));
};

const chartConfig: ChartConfig = {
  HiPot_1_UVW_G_NTC: {
    label: "HiPot 1 UVW GNTC",
    color: "hsl(var(--chart-1))",
  },
  humidity: {
    label: "Humidity (%)",
    color: "hsl(var(--chart-2))",
  },
  daylightHours: {
    label: "Daylight Hours",
    color: "hsl(var(--chart-3))",
  },
};

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export function TestingChart(): JSX.Element {
  const [chartData, setChartData] = useState<DataPoint[]>([]);
  const [dateIndexMap, setDateIndexMap] = useState<DateIndexMap>({});
  const [range, setRange] = useState({ left: 0, right: 0 });
  const [selection, setSelection] = useState<{ left: number | null; right: number | null }>({ left: null, right: null });
  const [selecting, setSelecting] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);

  // Create index map on data load
  useEffect(() => {
    const fetchData = async () => {
      const startDate = new Date("2024-10-20");
      const endDate = new Date("2024-10-27");
      const generatedData = await generateData(startDate, endDate);

      // Create date index map for O(1) lookups
      const indexMap: DateIndexMap = {};
      generatedData.forEach((point, index) => {
        indexMap[point.date] = index;
      });

      setChartData(generatedData);
      setDateIndexMap(indexMap);
      setRange({ left: 0, right: generatedData.length - 1 });
    };
    fetchData();
  }, []);

  const handleMouseDown = useCallback(
    (e: CategoricalChartState) => {
      if (e.activeLabel && dateIndexMap[e.activeLabel] !== undefined) {
        setSelection({
          left: dateIndexMap[e.activeLabel],
          right: null,
        });
        setSelecting(true);
      }
    },
    [dateIndexMap]
  );

  const handleMouseMove = useCallback(
    (e: CategoricalChartState) => {
      if (selecting && e.activeLabel && dateIndexMap[e.activeLabel] !== undefined) {
        setSelection((prev) => ({
          ...prev,
          right: dateIndexMap[e.activeLabel],
        }));
      }
    },
    [selecting, dateIndexMap]
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

  const handleZoom = useCallback(
    (e: React.WheelEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
      if (!chartData.length || !chartRef.current) return;

      const zoomFactor = 0.1;
      let direction = 0;
      let clientX = 0;

      if ("deltaY" in e) {
        direction = e.deltaY < 0 ? 1 : -1;
        clientX = e.clientX;
      } else if (e.touches.length === 2) {
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const currentDistance = Math.hypot(
          touch1.clientX - touch2.clientX,
          touch1.clientY - touch2.clientY
        );

        if ((e as any).lastTouchDistance) {
          direction = currentDistance > (e as any).lastTouchDistance ? 1 : -1;
        }
        (e as any).lastTouchDistance = currentDistance;

        clientX = (touch1.clientX + touch2.clientX) / 2;
      } else {
        return;
      }

      const { left, right } = range;
      const currentRange = right - left;
      const zoomAmount = currentRange * zoomFactor * direction;

      const chartRect = chartRef.current.getBoundingClientRect();
      const mouseX = clientX - chartRect.left;
      const chartWidth = chartRect.width;
      const mousePercentage = mouseX / chartWidth;

      const newLeft = Math.max(
        0,
        left + Math.floor(zoomAmount * mousePercentage)
      );
      const newRight = Math.min(
        chartData.length - 1,
        right - Math.ceil(zoomAmount * (1 - mousePercentage))
      );

      if (newLeft >= newRight) return;
      setRange({ left: newLeft, right: newRight });
    },
    [chartData, range]
  );

  const memoizedChart = useMemo(
    () => (
      <ResponsiveContainer width="100%" height="100%">
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
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tickMargin={7}
            tickFormatter={formatDate}
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
                className="w-[150px]"
                labelFormatter={(value) => {
                  return new Date(value).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  });
                }}
              />
            }
          />

          {Object.entries(chartConfig).map(([key, config]) => (
            <Line
              key={key}
              dataKey={key}
              type="monotone"
              stroke={config.color}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          ))}
          {selection.left !== null && selection.right !== null && (
            <ReferenceArea
              x1={chartData[selection.left].date}
              x2={chartData[selection.right].date}
              strokeOpacity={0.3}
              fill="hsl(var(--chart-3)"
              fillOpacity={0.05}
            />
          )}
          <ChartLegend content={<ChartLegendContent />} />
          <Brush
            dataKey="date"
            height={50}
            startIndex={range.left}
            endIndex={range.right}
            onChange={(e) =>
              setRange({
                left: e.startIndex ?? 0,
                right: e.endIndex ?? chartData.length - 1,
              })
            }
            stroke="hsl(var(--chart-1))"
            fill="hsl(var(--chart-5))"
            tickFormatter={(value) => {
              const date = new Date(value);
              return `${date.getFullYear()}-${String(
                date.getMonth() + 1
              ).padStart(2, "0")}`;
            }}
          >
            <ComposedChart>
              {Object.entries(chartConfig).map(([key, config]) => (
                <Line
                  key={key}
                  dataKey={key}
                  type="monotone"
                  stroke={config.color}
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                  opacity={0.5}
                />
              ))}
            </ComposedChart>
          </Brush>
        </ComposedChart>
      </ResponsiveContainer>
    ),
    [
      chartData,
      range,
      selection,
      handleMouseDown,
      handleMouseMove,
      handleMouseUp,
    ]
  );

  return (
    <Card className="w-full rounded">
      <CardHeader className="flex flex-row flex-wrap gap-2 sm:gap-0 justify-between border-b">
        <div className="flex flex-col gap-1">
          <CardTitle>Zoomable Chart with Brush</CardTitle>
          <CardDescription>
            {chartData[range.left]?.date} - {chartData[range.right]?.date}
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="rounded"
            onClick={reset}
          >
            Reset
          </Button>
        </div>
      </CardHeader>
      <CardContent className="w-full h-[450px] my-4">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-full w-full"
        >
          <div
            className="h-full"
            onWheel={handleZoom}
            onTouchMove={handleZoom}
            ref={chartRef}
            style={{ touchAction: "none", overflow: "hidden" }}
          >
            {memoizedChart}
          </div>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}