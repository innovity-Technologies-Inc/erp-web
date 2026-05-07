import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import type { DashboardAnalyticsResponse } from './types';

export const dashboardKeys = {
  all: ['dashboard'] as const,
  analytics: () => [...dashboardKeys.all, 'analytics'] as const,
};

export const useGetDashboardAnalytics = () => {
  return useQuery({
    queryKey: dashboardKeys.analytics(),
    queryFn: async () => {
      const { data } = await apiClient.get<DashboardAnalyticsResponse>('/dashboard/analytics');
      return data;
    },
  });
};
