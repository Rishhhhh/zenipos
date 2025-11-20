import { useDeviceDetection } from './useDeviceDetection';

/**
 * Provides optimized query configurations based on device type
 * Mobile devices use slower polling to reduce network usage and battery drain
 */
export function useQueryConfig() {
  const { isMobile, isTablet } = useDeviceDetection();

  return {
    // Refetch intervals (in milliseconds)
    refetchInterval: {
      fast: isMobile ? 10000 : 3000,      // 10s mobile, 3s desktop (order updates)
      normal: isMobile ? 30000 : 5000,     // 30s mobile, 5s desktop (stats)
      slow: isMobile ? 60000 : 10000,      // 60s mobile, 10s desktop (analytics)
    },
    // Stale time
    staleTime: {
      fast: isMobile ? 5000 : 1000,        // 5s mobile, 1s desktop
      normal: isMobile ? 30000 : 5000,     // 30s mobile, 5s desktop
      slow: isMobile ? 60000 : 30000,      // 60s mobile, 30s desktop
    },
    // Cache time
    cacheTime: {
      short: 60000,                        // 1 minute
      medium: 300000,                      // 5 minutes
      long: 600000,                        // 10 minutes
    },
  };
}
