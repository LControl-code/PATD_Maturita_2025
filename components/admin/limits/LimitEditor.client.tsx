// components/admin/limits/LimitsEditor.client.tsx
'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Save, Filter } from 'lucide-react';
import { toast } from 'sonner';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

import { LimitPanel } from './LimitPanel.client';
import { LimitData, DeviceType, Station } from './types';

export function LimitsEditor({
  initialLimits,
  deviceTypes,
  stations,
}: {
  initialLimits: LimitData[];
  deviceTypes: DeviceType[];
  stations: Station[];
}) {
  // State management
  const [limits, setLimits] = useState<LimitData[]>(initialLimits);
  const [selectedStation, setSelectedStation] = useState<string>('all');
  const [selectedDeviceType, setSelectedDeviceType] = useState<string>('all');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [editedLimits, setEditedLimits] = useState<Record<string, any>>({});
  const [hasChanges, setHasChanges] = useState<boolean>(false);
  const [expandedPanels, setExpandedPanels] = useState<Set<string>>(new Set());

  // Group stations by name
  const stationGroups = useMemo(() => {
    const groups: Record<
      string,
      {
        name: string;
        ids: string[];
      }
    > = {};

    stations.forEach((station) => {
      if (!groups[station.name]) {
        groups[station.name] = {
          name: station.name,
          ids: [],
        };
      }
      groups[station.name].ids.push(station.id);
    });

    return Object.values(groups);
  }, [stations]);

  // Handle filtering
  const handleStationChange = useCallback((station: string) => {
    setSelectedStation(station);
  }, []);

  const handleDeviceTypeChange = useCallback((deviceType: string) => {
    setSelectedDeviceType(deviceType);
  }, []);

  // Toggle panel expanded state
  const togglePanel = useCallback((panelId: string) => {
    setExpandedPanels((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(panelId)) {
        newSet.delete(panelId);
      } else {
        newSet.add(panelId);
      }
      return newSet;
    });
  }, []);

  // Get filtered limits
  const filteredLimits = useMemo(() => {
    return limits.filter((limit) => {
      // For device type, check if any device type matches
      const matchesDeviceType =
        selectedDeviceType === 'all' || limit.device_type.includes(selectedDeviceType);

      // For station, check if any station matches by name
      const matchesStation =
        selectedStation === 'all' ||
        limit.station.some((stationId) => {
          const station = stations.find((s) => s.id === stationId);
          return station?.name === selectedStation;
        });

      return matchesStation && matchesDeviceType;
    });
  }, [limits, selectedStation, selectedDeviceType, stations]);

  // Handle limit changes
  const handleLimitChange = useCallback(
    (limitId: string, testName: string, field: 'min' | 'max', value: number) => {
      // Create a nested structure if it doesn't exist
      if (!editedLimits[limitId]) {
        editedLimits[limitId] = {};
      }
      if (!editedLimits[limitId][testName]) {
        editedLimits[limitId][testName] = {};
      }

      // Set the value
      editedLimits[limitId][testName][field] = value;

      // Mark that we have changes
      setHasChanges(true);
      setEditedLimits({ ...editedLimits });
    },
    [editedLimits],
  );

  // Save changes to database
  const saveChanges = async () => {
    setIsSaving(true);

    try {
      // Process each edited limit
      for (const limitId in editedLimits) {
        const limitData = limits.find((l) => l.id === limitId)?.limits_data || {};
        const updatedLimitData = { ...limitData };

        // Apply edits to the limit data
        for (const testName in editedLimits[limitId]) {
          updatedLimitData[testName] = {
            ...updatedLimitData[testName],
            ...editedLimits[limitId][testName],
          };
        }

        // Validation - check min <= max for all tests
        let isValid = true;
        for (const testName in updatedLimitData) {
          if (updatedLimitData[testName].min > updatedLimitData[testName].max) {
            toast(`Invalid range for ${testName}: Min must be less than Max`);
            isValid = false;
            break;
          }
        }

        if (!isValid) continue;

        // Send update to API
        const response = await fetch('/api/admin/limits/update', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: limitId,
            limits_data: updatedLimitData,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to update limits');
        }
      }

      // Update local state to reflect changes
      const updatedLimits = limits.map((limit) => {
        if (editedLimits[limit.id]) {
          const updatedData = { ...limit.limits_data };
          for (const testName in editedLimits[limit.id]) {
            updatedData[testName] = {
              ...updatedData[testName],
              ...editedLimits[limit.id][testName],
            };
          }
          return { ...limit, limits_data: updatedData };
        }
        return limit;
      });

      setLimits(updatedLimits);
      setEditedLimits({});
      setHasChanges(false);
      toast('Limits updated successfully');
    } catch (error) {
      console.error('Error saving limits:', error);
      toast(`Failed to save: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Test Limits Configuration</CardTitle>
          {hasChanges && (
            <Button onClick={saveChanges} disabled={isSaving}>
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <Label htmlFor="station-select">Station</Label>
              <Select onValueChange={handleStationChange} value={selectedStation}>
                <SelectTrigger id="station-select">
                  <SelectValue placeholder="All Stations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stations</SelectItem>
                  {stationGroups.map((group) => (
                    <SelectItem key={group.name} value={group.name}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="device-type-select">Device Type</Label>
              <Select onValueChange={handleDeviceTypeChange} value={selectedDeviceType}>
                <SelectTrigger id="device-type-select">
                  <SelectValue placeholder="All Device Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Device Types</SelectItem>
                  {deviceTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center">
              <Filter className="h-5 w-5 mr-2 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Showing {filteredLimits.length} of {limits.length} limit sets
              </span>
            </div>
          </div>

          {hasChanges && (
            <Alert className="mb-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                You have unsaved changes. Click "Save Changes" to apply them.
              </AlertDescription>
            </Alert>
          )}

          {filteredLimits.length === 0 ? (
            <div className="flex items-center justify-center text-center my-12 text-muted-foreground h-[200px]">
              No limits match the selected filters.
            </div>
          ) : (
            <div className="space-y-4">
              {filteredLimits.map((limit) => (
                <LimitPanel
                  key={limit.id}
                  limit={limit}
                  deviceTypes={deviceTypes.filter((dt) => limit.device_type.includes(dt.id))}
                  stations={stations.filter((s) => limit.station.includes(s.id))}
                  onChange={handleLimitChange}
                  editedValues={editedLimits[limit.id] || {}}
                  isExpanded={expandedPanels.has(limit.id)}
                  onToggleExpand={() => togglePanel(limit.id)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
