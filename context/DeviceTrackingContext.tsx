import React, { createContext, useContext, useState, useCallback } from 'react';
import { Device } from '@/types/device';

interface DeviceContextType {
  device: Device | null;
  loading: boolean;
  error: string | null;
  setDevice: (device: Device | null) => void;
  fetchDevice: (deviceCode: string) => Promise<void>;
  refreshDevice: () => Promise<void>;
}

const DeviceContext = createContext<DeviceContextType | undefined>(undefined);

const fetchDeviceData = async (deviceCode: string): Promise<Device> => {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL}/api/data/devices/${encodeURIComponent(deviceCode)}`,
  );
  if (!response.ok) {
    throw new Error('Failed to fetch device data');
  }
  return response.json();
};

export const DeviceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [device, setDevice] = useState<Device | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDevice = useCallback(async (deviceCode: string) => {
    setLoading(true);
    setError(null);
    try {
      const fetchedData = await fetchDeviceData(deviceCode);
      if (fetchedData.stations.length <= 0) {
        setDevice(null);
      } else {
        setDevice(fetchedData);
      }
    } catch (err) {
      setError('Failed to fetch device data. Please check the device code and try again.');
      setDevice(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshDevice = useCallback(async () => {
    if (device) {
      await fetchDevice(device.code);
    }
  }, [device, fetchDevice]);

  const value = {
    device,
    loading,
    error,
    setDevice,
    fetchDevice,
    refreshDevice,
  };

  return <DeviceContext.Provider value={value}>{children}</DeviceContext.Provider>;
};

export const useDevice = () => {
  const context = useContext(DeviceContext);
  if (context === undefined) {
    throw new Error('useDevice must be used within a DeviceProvider');
  }
  return context;
};
