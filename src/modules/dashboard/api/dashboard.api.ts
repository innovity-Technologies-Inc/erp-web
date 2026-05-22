import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import type { DashboardAnalyticsResponse } from './types';

export const dashboardKeys = {
  all: ['dashboard'] as const,
  analytics: (params?: any) => [...dashboardKeys.all, 'analytics', params] as const,
};

export const useGetDashboardAnalytics = (params?: any, options?: any) => {
  return useQuery({
    queryKey: dashboardKeys.analytics(params),
    queryFn: async () => {
      const { data } = await apiClient.get<DashboardAnalyticsResponse>('/dashboard/analytics', { params });
      return data;
    },
    ...options
  });
};
