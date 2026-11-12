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

export interface StatisticsResponse {
  statistics: Statistic[];
  lastUpdated: string;
}
