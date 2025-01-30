import { FailsData, TestRecord } from "@/types/api";
import { trackDevice, trackStation, trackTest } from '@/types/device';
import { ErrorData } from "@/types/errors";
import {
  TypedPocketBase,
  Collections,
  StationS02Record,
  StationS02LimitsRecord,
  LiveErrorsResponse
} from "@/types/pocketbase-types";

import PocketBase from "pocketbase";

// -------------------------------------------------------
// Initialize PocketBase client
// -------------------------------------------------------
export const pb = new PocketBase(`${process.env.POCKETBASE_URL}`) as TypedPocketBase;
pb.autoCancellation(false);

// -------------------------------------------------------
// Helper function to fetch the station collection names
// -------------------------------------------------------
async function fetchStationCollections(): Promise<string[]> {
  const url = `${process.env.POCKETBASE_URL}/api/stationCollections`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch station collections: ${res.statusText}`);
  }
  const data = await res.json();
  return data.stationCollections || [];
}

// -------------------------------------------------------
// Interfaces
// -------------------------------------------------------
interface BaseRecord {
  id?: string;
  collectionId?: string;
  collectionName?: string;
  created?: string;
  updated?: string;
  time?: string;
  test_fail?: boolean;
  device_code?: string;
  motor_type?: string;
  [key: string]: number | string | boolean | undefined;
}

interface Record extends BaseRecord {
  [key: string]: number | string | boolean | undefined;
}

interface RecordsByStation {
  count: number;
  records: Record[];
  testFailures: { [test: string]: number };
}

// -------------------------------------------------------
// 1) getStationData()
// [No new route defined, so keep existing logic]
// -------------------------------------------------------
export async function getStationData() {
  // Still directly using PocketBase SDK calls
  const records = await pb
    .collection("station_s02")
    .getList<StationS02Record>(1, 20, { sort: "-created" });
  return records.items;
}

// -------------------------------------------------------
// 2) getLimitsForMotorType(motorType?: "EFAD" | "ERAD" | "Short")
// [Refactored to use fetchStationCollections()]
// -------------------------------------------------------
export async function getLimitsForMotorType(motorType?: "EFAD" | "ERAD" | "Short") {
  // Get station collection names dynamically
  const stationCollections = await fetchStationCollections();
  const limitsByStation: { [key: string]: any } = {};

  for (const collection of stationCollections) {
    const limitsCollection = `${collection}_limits`;
    const filter = motorType ? `motor_type='${motorType}'` : "";
    const limits = await pb.collection(limitsCollection).getFullList<StationS02LimitsRecord>({
      filter,
      cache: "no-store",
    });

    if (motorType) {
      limitsByStation[collection] = limits;
    } else {
      // group limits by motor_type
      const groupedLimits = limits.reduce((acc: { [mt: string]: StationS02LimitsRecord[] }, limit) => {
        const mt = limit.motor_type || "unknown";
        if (!acc[mt]) acc[mt] = [];
        acc[mt].push(limit);
        return acc;
      }, {});
      limitsByStation[collection] = groupedLimits;
    }
  }

  return limitsByStation;
}

// -------------------------------------------------------
// 3) getTopFailsData()
// [Now calls your new /api/topFails route]
// -------------------------------------------------------
export async function getTopFailsData() {
  const url = `${process.env.POCKETBASE_URL}/api/topFails`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch top fails data: ${res.statusText}`);
  }
  return await res.json();
}

// -------------------------------------------------------
// 4) getStatsRecord()
// [Already pointing to your /api/stats route, kept as-is]
// -------------------------------------------------------
export async function getStatsRecord() {
  const url = `${process.env.POCKETBASE_URL}/api/stats`;
  const res = await fetch(url, { method: "GET" });
  if (!res.ok) {
    throw new Error(`Failed to fetch stats record: ${res.statusText}`);
  }
  return await res.json();
}

// -------------------------------------------------------
// 5) getFailedTestsGraphData()
// [Now calls your new /api/failedTestsGraph route]
// -------------------------------------------------------
export async function getFailedTestsGraphData() {
  const url = `${process.env.POCKETBASE_URL}/api/failedTestsGraph`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch failed tests graph: ${res.statusText}`);
  }
  return await res.json();
}

// -------------------------------------------------------
// 6) getDeviceData(deviceCode: string)
// [Now calls your new /api/deviceData?deviceCode=... route]
// -------------------------------------------------------
export async function getDeviceData(deviceCode: string) {
  const encoded = encodeURIComponent(deviceCode);
  const url = `${process.env.POCKETBASE_URL}/api/deviceData?deviceCode=${encoded}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch device data: ${res.statusText}`);
  }
  return await res.json();
}

// -------------------------------------------------------
// 7) getLiveErrorsData()
// [Now calls your new /api/liveErrors route]
// -------------------------------------------------------
export async function getLiveErrorsData() {
  const url = `${process.env.POCKETBASE_URL}/api/liveErrors`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch live errors data: ${res.statusText}`);
  }
  return await res.json();
}
