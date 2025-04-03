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

import pb from "@/lib/pocketbase";

// -------------------------------------------------------
// Initialize PocketBase client
// -------------------------------------------------------
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

interface PocketbaseFailure {
  id: string;
  test_data: string;
  test: string;
  value: number;
  limit: number;
  offset: number;
  type: 'above' | 'below';
  station: string;
}

interface StationInfo {
  id: string;
  name: string;
  status: 'passed' | 'failed' | 'pending' | 'in-progress';
  line: string;
  tests: Array<{
    name: string;
    result: 'passed' | 'failed';
    measuredValue: number;
    offsetFromLimit: string | null;
  }>;
}

export async function getDeviceData(deviceCode: string) {
  try {
    console.log(`Fetching device: ${deviceCode}`);

    // 1. Get all test data records for this device
    const testRecords = await pb.collection('test_data').getFullList({
      filter: `device_code = "${deviceCode}"`,
      sort: 'time'
    });

    if (testRecords.length === 0) {
      throw new Error(`No test data found for device ${deviceCode}`);
    }

    const latestTest = testRecords[testRecords.length - 1];

    // 2. Resolve device type name
    let deviceTypeName = 'Unknown';
    try {
      if (latestTest.device_type) {
        const deviceType = await pb.collection('device_types').getOne(latestTest.device_type);
        deviceTypeName = deviceType.name;
      }
    } catch (e) {
      console.warn('Failed to get device type name:', e);
    }

    // 3. Resolve current station and line
    let stationName = 'Unknown';
    let lineName = 'Unknown';
    let lineId = null;

    try {
      if (latestTest.station) {
        const station = await pb.collection('stations').getOne(latestTest.station);
        stationName = station.name;

        if (station.line) {
          lineId = station.line;
          const line = await pb.collection('lines').getOne(station.line);
          lineName = line.name;
        }
      }
    } catch (e) {
      console.warn('Failed to get station or line information:', e);
    }

    // 4. Get all stations in manufacturing flow, prioritizing current line
    let stations: StationInfo[] = [];
    try {
      // Get station and line information
      const allStations = await pb.collection('stations').getFullList();
      const allLines = await pb.collection('lines').getFullList();

      // Create lookup maps for quick access
      const stationMap = new Map(allStations.map(s => [s.id, s]));
      const lineMap = new Map(allLines.map(l => [l.id, l]));

      // Create station by name map, prioritizing the current line
      const stationsByName = new Map();

      for (const station of allStations) {
        const line = lineMap.get(station.line) || { name: 'Unknown' };

        // Skip stations we've already seen unless they're from the current line
        if (stationsByName.has(station.name) && station.line !== lineId) {
          continue;
        }

        stationsByName.set(station.name, {
          id: station.id,
          name: station.name,
          status: 'pending',
          line: line.name,
          tests: []
        });
      }

      // Process each test record - maintain latest record per station
      const latestTestByStation = new Map();

      for (const record of testRecords) {
        const stationId = record.station;
        if (!stationId) continue;

        const station = stationMap.get(stationId);
        if (!station) continue;

        // Track the latest test per station
        latestTestByStation.set(station.name, record);
      }

      // Now process test data for each station's latest test
      for (const [stationName, testRecord] of latestTestByStation.entries()) {
        const stationInfo = stationsByName.get(stationName);
        if (!stationInfo) continue;

        // Process test data
        const testData = testRecord.test_data || {};
        const tests = [];

        // Get failures for just this specific test record (avoids filter issue)
        let recordFailures: PocketbaseFailure[] = [];
        try {
          recordFailures = await pb.collection('failures').getFullList({
            filter: `test_data = "${testRecord.id}"`
          });
        } catch (e) {
          console.warn(`Failed to get failures for test ${testRecord.id}:`, e);
        }

        for (const [testName, value] of Object.entries(testData)) {
          // Skip non-numeric values and special fields
          if (typeof value !== 'number') continue;
          if (['Finish_Temp', 'Start_Temp'].includes(testName)) continue;

          // Find if this test failed
          const failure = recordFailures.find(f => f.test === testName);

          const test = {
            name: testName,
            result: failure ? 'failed' : 'passed',
            measuredValue: value,
            offsetFromLimit: failure ?
              (failure.type === 'above' ? `+${failure.offset.toFixed(3)}` : `-${failure.offset.toFixed(3)}`) :
              null
          };

          tests.push(test);
        }

        // Update station status based on test results
        stationInfo.status = tests.some(t => t.result === 'failed') ? 'failed' : 'passed';
        stationInfo.tests = tests;
      }

      // Convert map to array for output
      stations = Array.from(stationsByName.values()).map(s => ({
        name: s.name,
        status: s.status,
        line: s.line,
        tests: s.tests
      }));

      // Sort by station name for consistent order
      stations.sort((a, b) => a.name.localeCompare(b.name));
    } catch (e) {
      console.warn('Failed to process stations:', e);
    }

    return {
      code: deviceCode,
      type: deviceTypeName,
      currentStation: stationName,
      currentLine: lineName,
      stations: stations
    };
  } catch (error) {
    console.error('Error fetching device data:', error);
    throw error;
  }
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
