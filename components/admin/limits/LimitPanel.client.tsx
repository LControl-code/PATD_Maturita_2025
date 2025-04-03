// components/admin/limits/LimitPanel.client.tsx
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import { LimitData, DeviceType, Station } from './types';

interface LimitPanelProps {
  limit: LimitData;
  deviceTypes: DeviceType[];
  stations: Station[];
  onChange: (limitId: string, testName: string, field: 'min' | 'max', value: number) => void;
  editedValues: Record<string, any>;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export function LimitPanel({
  limit,
  deviceTypes,
  stations,
  onChange,
  editedValues,
  isExpanded,
  onToggleExpand,
}: LimitPanelProps) {
  // Prepare data for rendering
  const testNames = Object.keys(limit.limits_data).sort();

  // Get current value (edited or original)
  const getValue = (testName: string, field: 'min' | 'max') => {
    // Check for edited value first
    if (editedValues[testName]?.[field] !== undefined) {
      return editedValues[testName][field];
    }
    // Fall back to original value
    return limit.limits_data[testName][field];
  };

  // Check if any test has validation errors
  const hasErrors = testNames.some((testName) => {
    const minValue = getValue(testName, 'min');
    const maxValue = getValue(testName, 'max');
    return minValue > maxValue;
  });

  // Handle input change
  const handleInputChange = (testName: string, field: 'min' | 'max', value: string) => {
    const numericValue = parseFloat(value);
    if (!isNaN(numericValue)) {
      onChange(limit.id, testName, field, numericValue);
    }
  };

  // Validation - check for min > max
  const hasError = (testName: string) => {
    const minValue = getValue(testName, 'min');
    const maxValue = getValue(testName, 'max');
    return minValue > maxValue;
  };

  // Get station names (grouped by name)
  const stationNames = Array.from(new Set(stations.map((station) => station.name)));

  // Get device type names
  const deviceTypeNames = deviceTypes.map((type) => type.name);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card>
        <CardContent className="p-0">
          <div
            className="p-4 cursor-pointer flex items-center justify-between"
            onClick={onToggleExpand}
          >
            <div>
              <div className="text-lg font-semibold flex items-center">
                <span className="mr-2">Station: {stationNames.join(', ')}</span>
                {hasErrors && (
                  <Badge variant="destructive" className="flex items-center">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Invalid Values
                  </Badge>
                )}
              </div>
              <div className="text-sm text-muted-foreground flex gap-1 flex-wrap mt-1">
                <span>Device Types: </span>
                {deviceTypeNames.map((name) => (
                  <Badge key={name} variant="outline" className="mr-1">
                    {name}
                  </Badge>
                ))}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpand();
              }}
            >
              {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </Button>
          </div>

          {isExpanded && (
            <div className="border-t p-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Test Parameter</TableHead>
                    <TableHead>Minimum</TableHead>
                    <TableHead>Maximum</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {testNames.map((testName) => (
                    <TableRow
                      key={testName}
                      className={hasError(testName) ? 'bg-red-50 dark:bg-red-950/20' : ''}
                    >
                      <TableCell className="font-medium">{testName}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.001"
                          value={getValue(testName, 'min')}
                          onChange={(e) => handleInputChange(testName, 'min', e.target.value)}
                          className={hasError(testName) ? 'border-red-500' : ''}
                        />
                        {hasError(testName) && (
                          <p className="text-xs text-red-500 mt-1">Min must be less than Max</p>
                        )}
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.001"
                          value={getValue(testName, 'max')}
                          onChange={(e) => handleInputChange(testName, 'max', e.target.value)}
                          className={hasError(testName) ? 'border-red-500' : ''}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
