import { QueryClient } from '@tanstack/react-query';

/**
 * Centralized React Query client with performance-optimized defaults
 * 
 * Optimizations:
 * - staleTime: 1500ms (data is "fresh" for this duration)
 * - gcTime: 3min (keep unused data in memory)
 * - refetchOnWindowFocus: false (prevent wasteful refetches)
 * - retry: 1 (faster failure feedback)
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1500, // 1.5s - balance between freshness and performance
      gcTime: 3 * 60 * 1000, // 3 minutes - reduced memory footprint
      refetchOnWindowFocus: false, // Disable auto-refetch on window focus
      retry: 1, // Only retry failed queries once for faster UX
    },
  },
});
