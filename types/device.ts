export type TestResult = 'passed' | 'failed' | 'in-progress' | 'pending';

export interface Test {
  name: string;
  result: 'passed' | 'failed';
  measuredValue?: number | string;
  offsetFromLimit?: string | number;
}

export interface Station {
  name: string;
  status: 'passed' | 'failed' | 'in-progress' | 'pending';
  tests: Test[];
  line: string; // Added line property
}

export interface Device {
  code: string;
  type: string;
  currentStation: string;
  currentLine: string; // Added currentLine property
  stations: Station[];
}

export interface trackTest {
  name: string;
  result: 'passed' | 'failed';
  measuredValue: string;
  offsetFromLimit?: string; // Optional parameter
}

export interface trackStation {
  name: string;
  status: 'passed' | 'failed' | 'pending';
  tests: Test[];
}

export interface trackDevice {
  code: string;
  type: string;
  currentStation: string;
  stations: Station[];
}