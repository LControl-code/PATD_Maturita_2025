"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import { Zap } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface StatsData {
  id: string;
  totalTested: number;
  activeStations?: number;
  todaysProduction?: number;
  overallEfficiency?: number;
}

interface DashboardOverviewProps {
  initialData: StatsData;
}

/**
 * Client-side component that displays an overview dashboard with key statistics.
 *
 * @component
 * @param {Object} props - Component props
 * @param {StatsData} props.initialData - Initial statistics data to display
 *
 * @returns {JSX.Element} A card containing statistics including:
 * - Total number of tested devices
 * - Number of active stations
 * - Today's production percentage
 * - Overall efficiency with progress bar
 *
 * The component includes animations on mount and displays loading state
 * if stats are not available (rare case due to SSR).
 */
export default function DashboardOverviewClient({
  initialData,
}: DashboardOverviewProps) {
  const [stats, setStats] = useState<StatsData>(initialData);

  // If stats are not loaded (rare, since we had initialData), we can show a fallback
  // but realistically we always have something from server side
  if (!stats) {
    return <div>Loading...</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.2 }}
      className="grow"
    >
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Zap className="mr-2" />
            Dashboard Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {/* TOTAL DEVICES */}
            <div>
              <p className="font-semibold">Total Devices:</p>
              <p className="text-2xl font-bold">{stats.totalTested ?? 0}</p>
            </div>

            {/* ACTIVE STATIONS */}
            <div>
              <p className="font-semibold">Active Stations:</p>
              <p className="text-2xl font-bold">{stats.activeStations ?? 0}</p>
            </div>

            {/* TODAY'S PRODUCTION */}
            <div>
              <p className="font-semibold">Today&apos;s Production:</p>
              {/* e.g. 45.8 => "45.8 %" */}
              <p className="text-2xl font-bold">
                {stats.todaysProduction?.toFixed(1) ?? 0} %
              </p>
            </div>

            {/* OVERALL EFFICIENCY (progress bar) */}
            <div>
              <p className="font-semibold">Overall Efficiency:</p>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="w-full">
                      <Progress
                        value={stats.overallEfficiency ?? 0}
                        className="mt-2"
                      />
                    </div>
                  </TooltipTrigger>

                  <TooltipContent>
                    <p>
                      {stats.overallEfficiency?.toFixed(1) ?? 0}% Efficiency
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
