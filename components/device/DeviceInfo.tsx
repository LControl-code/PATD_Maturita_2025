import React from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useDevice } from '@/context/DeviceTrackingContext';

import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';

/**
 * Component that displays detailed information about a device.
 *
 * This component uses the device context through the `useDevice` hook to access
 * device information and displays it in a card format. The information includes:
 * - Device code
 * - Device type
 * - Current station
 * - Overall progress
 *
 * The component features an animation on mount using Framer Motion,
 * sliding in from the left with a fade effect.
 *
 * @returns {JSX.Element | null} Returns the device information card or null if no device is available
 */
export default function DeviceInfo() {
  const { device } = useDevice();

  if (!device) return null;

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
            Device Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="font-semibold">Code:</p>
              <p className="truncate" title={device.code}>
                {device.code}
              </p>
            </div>
            <div>
              <p className="font-semibold">Type:</p>
              <p>{device.type}</p>
            </div>
            <div>
              <p className="font-semibold">Current Station:</p>
              <p>{device.currentStation}</p>
            </div>
            <div>
              <p className="font-semibold">Current Line:</p>
              <p>{device.currentLine}</p>
            </div>
            <div className="col-span-2">
              <p className="font-semibold">Overall Progress:</p>
              <Progress value={60} className="mt-2" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
