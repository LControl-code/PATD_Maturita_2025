/**
 * Represents a single test failure record
 */
export interface TestRecord {
    deviceCode: string;
    deviceType: string;
    difference: number;
    limit: number;
    line: string;
    type: string;
    measuredValue: number;
    time: string;
}

/**
 * Nested structure of fails data organized by station and test name
 */
export interface FailsData {
    [stationName: string]: {
        [testName: string]: TestRecord[];
    };
}

/**
 * Props for the FailedTestsGraph component
 */
export interface FailedTestsGraphProps {
    data: FailsData;
}