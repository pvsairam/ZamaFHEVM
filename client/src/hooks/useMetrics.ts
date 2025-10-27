import { useQuery, useMutation } from "@tanstack/react-query";
import { useEffect } from "react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { DashboardMetrics, TimeSeriesData, TopPage } from "@shared/schema";

interface MetricsResponse {
  metrics: DashboardMetrics;
  timeSeries: TimeSeriesData;
  topPages: TopPage[];
}

export function useMetrics(originId?: string) {
  const query = useQuery<MetricsResponse>({
    queryKey: ['/api/metrics', originId],
    queryFn: async () => {
      if (!originId) throw new Error('No origin ID provided');
      const response = await fetch(`/api/metrics/${originId}`);
      if (!response.ok) throw new Error('Failed to fetch metrics');
      return response.json();
    },
    enabled: !!originId,
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes since we have SSE
  });

  // Subscribe to real-time updates via SSE
  useEffect(() => {
    if (!originId) return;

    let eventSource: EventSource | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;
    let isMounted = true;

    const connect = () => {
      try {
        eventSource = new EventSource(`/api/metrics/${originId}/stream`);

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.metrics) {
              // Update metrics in cache with optimistic data
              queryClient.setQueryData(['/api/metrics', originId], (old: MetricsResponse | undefined) => {
                if (!old) return old;
                return {
                  ...old,
                  metrics: data.metrics,
                };
              });
            }
          } catch (error) {
            console.error('[SSE] Failed to parse message:', error);
          }
        };

        eventSource.onerror = (error) => {
          console.warn('[SSE] Connection error, will retry in 3s...', error);
          
          // Close the failed connection
          if (eventSource) {
            eventSource.close();
            eventSource = null;
          }
          
          // Retry connection after delay (only if component is still mounted)
          if (isMounted) {
            reconnectTimeout = setTimeout(() => {
              if (isMounted) {
                connect();
              }
            }, 3000);
          }
        };
      } catch (error) {
        console.error('[SSE] Failed to create EventSource:', error);
      }
    };

    connect();

    return () => {
      isMounted = false;
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [originId]);

  return query;
}

export function useCollectEvent() {
  return useMutation({
    mutationFn: async (params: {
      originToken: string;
      eventType: 'pageview' | 'session' | 'conversion' | 'event';
      page?: string;
      value?: number;
    }) => {
      return apiRequest("POST", "/api/collect", {
        originToken: params.originToken,
        timestamp: new Date().toISOString(),
        page: params.page || window.location.pathname,
        eventType: params.eventType,
        value: params.value || 1,
      });
    },
  });
}
