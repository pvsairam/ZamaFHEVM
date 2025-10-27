import { useQuery, useMutation } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Origin } from "@shared/schema";

export function useOrigins() {
  const { address } = useAccount();

  return useQuery<Origin[]>({
    queryKey: ['/api/origins/owner', address],
    queryFn: async () => {
      if (!address) return [];
      const response = await fetch(`/api/origins/owner/${address}`);
      if (!response.ok) {
        if (response.status === 404) return [];
        throw new Error('Failed to fetch origins');
      }
      return response.json();
    },
    enabled: !!address,
    staleTime: 0, // Always refetch when invalidated
    refetchOnWindowFocus: true, // Refetch when window regains focus
  });
}

export function useCreateOrigin() {
  const { address } = useAccount();

  return useMutation({
    mutationFn: async (domain: string) => {
      if (!address) throw new Error("Wallet not connected");
      
      console.log('[Frontend] Creating origin:', { domain, address });
      const response = await apiRequest("POST", "/api/origins", {
        domain,
        ownerAddress: address,
      });
      
      const data = await response.json();
      console.log('[Frontend] Origin created:', data);
      return data;
    },
    onMutate: async (domain: string) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['/api/origins/owner', address] });

      // Snapshot the previous value
      const previousOrigins = queryClient.getQueryData<Origin[]>(['/api/origins/owner', address]);

      // Optimistically update to the new value
      const optimisticOrigin: Origin = {
        id: `temp-${Date.now()}`, // Temporary ID
        domain,
        ownerAddress: address!,
        token: 'generating...', // Placeholder
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      queryClient.setQueryData<Origin[]>(
        ['/api/origins/owner', address],
        (old) => [...(old || []), optimisticOrigin]
      );

      // Return context with snapshot
      return { previousOrigins };
    },
    onSuccess: () => {
      // Refetch to get the real data from server
      queryClient.invalidateQueries({ queryKey: ['/api/origins/owner'] });
    },
    onError: (error, _domain, context) => {
      console.error('[Frontend] Create origin failed:', error);
      // Rollback on error
      if (context?.previousOrigins) {
        queryClient.setQueryData(['/api/origins/owner', address], context.previousOrigins);
      }
    },
  });
}

export function useDeleteOrigin() {
  const { address } = useAccount();

  return useMutation({
    mutationFn: async (originId: string) => {
      console.log('[Frontend] Deleting origin:', originId);
      const response = await apiRequest("DELETE", `/api/origins/${originId}`);
      const data = await response.json();
      console.log('[Frontend] Origin deleted:', data);
      return data;
    },
    onMutate: async (originId: string) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['/api/origins/owner', address] });

      // Snapshot the previous value
      const previousOrigins = queryClient.getQueryData<Origin[]>(['/api/origins/owner', address]);

      // Optimistically remove from UI
      queryClient.setQueryData<Origin[]>(
        ['/api/origins/owner', address],
        (old) => (old || []).filter(origin => origin.id !== originId)
      );

      // Return context with snapshot
      return { previousOrigins };
    },
    onSuccess: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['/api/origins/owner'] });
    },
    onError: (error, _originId, context) => {
      console.error('[Frontend] Delete origin failed:', error);
      // Rollback on error
      if (context?.previousOrigins) {
        queryClient.setQueryData(['/api/origins/owner', address], context.previousOrigins);
      }
    },
  });
}

export function useOriginKey(originId?: string) {
  return useQuery({
    queryKey: ['/api/keys', originId, 'current'],
    queryFn: async () => {
      if (!originId) return null;
      const response = await fetch(`/api/keys/${originId}/current`);
      if (!response.ok) throw new Error('Failed to fetch key');
      return response.json();
    },
    enabled: !!originId,
  });
}
