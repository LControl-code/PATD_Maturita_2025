'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

import type { DashboardOverviewProps } from './types';

/**
 * Client component that displays dashboard statistics with animations and tooltips.
 *
 * @component
 */
export function DashboardOverviewClient({ data }: DashboardOverviewProps) {
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
              <p className="text-2xl font-bold">{data.totalTested}</p>
            </div>

            {/* ACTIVE STATIONS */}
            <div>
              <p className="font-semibold">Active Stations:</p>
              <p className="text-2xl font-bold">{data.activeStations}</p>
            </div>

            {/* TODAY'S PRODUCTION */}
            <div>
              <p className="font-semibold">Today&apos;s Production:</p>
              <p className="text-2xl font-bold">{data.todaysProduction.toFixed(1)} %</p>
            </div>

            {/* OVERALL EFFICIENCY (progress bar) */}
            <div>
              <p className="font-semibold">Overall Efficiency:</p>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="w-full">
                      <Progress value={data.overallEfficiency} className="mt-2" />
                    </div>
                  </TooltipTrigger>

                  <TooltipContent>
                    <p>{data.overallEfficiency.toFixed(1)}% Efficiency</p>
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
