/** A dashboard metric and its display metadata. */
export interface Statistic {
  id: string;
  title: string;
  icon: string;
  value: number;
  change: string;
  changeLabel: string;
  changeType: 'positive' | 'negative' | 'neutral';
  color: string;
}

/** Complete API response for the statistics dashboard. */
export interface StatisticsResponse {
  statistics: Statistic[];
  lastUpdated: string;
}
