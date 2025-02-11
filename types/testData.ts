export interface IssueCountData {
  [key: string]: {
    [location: string]: {
      material: number;
      tester: number;
    };
  };
}

export interface TopFailsResponse {
  'Issue Count': {
    [location: string]: {
      material: number;
      tester: number;
    };
  };
  [key: string]: any;
}
