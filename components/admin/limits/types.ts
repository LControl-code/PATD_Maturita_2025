// components/admin/limits/types.ts
export interface LimitData {
  id: string;
  device_type: string[];
  station: string[];
  limits_data: Record<string, LimitValue>;
}

export interface LimitValue {
  min: number;
  max: number;
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

export interface LimitsEditorProps {
  initialLimits: LimitData[];
  deviceTypes: DeviceType[];
  stations: Station[];
}
