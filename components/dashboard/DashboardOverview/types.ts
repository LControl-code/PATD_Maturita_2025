/**
 * Interface representing dashboard statistics data
 */
export interface DashboardStats {
  totalTested: number;
  activeStations: number;
  todaysProduction: number;
  overallEfficiency: number;
}

/**
 * Props for the DashboardOverview component
 */
export interface DashboardOverviewProps {
  data: DashboardStats;
}