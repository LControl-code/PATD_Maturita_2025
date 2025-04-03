// types/limits.ts
export interface Limit {
  id: string;
  device_type: string[];
  station: string[];
  limits_data: {
    [testName: string]: {
      min: number;
      max: number;
    };
  };
}

export interface DeviceType {
  id: string;
  name: string;
}

export interface Station {
  id: string;
  name: string;
  line: string;
}

export interface LimitUpdatePayload {
  id: string;
  limits_data: {
    [testName: string]: {
      min: number;
      max: number;
    };
  };
}