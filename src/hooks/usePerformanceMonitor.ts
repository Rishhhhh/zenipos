import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPerformance } from '@/lib/monitoring/sentry';
import { getDeviceType } from '@/lib/utils/deviceDetection';

/**
 * Track FPS for a component
 */
export function trackFPS(componentName: string): () => void {
  let frameCount = 0;
  let lastTime = performance.now();
  let animationFrameId: number;

  const measureFPS = () => {
    frameCount++;
    const currentTime = performance.now();
    const elapsed = currentTime - lastTime;

    if (elapsed >= 1000) {
      const fps = Math.round((frameCount * 1000) / elapsed);
      trackPerformance('fps', fps, { component: componentName });
      frameCount = 0;
      lastTime = currentTime;
    }

    animationFrameId = requestAnimationFrame(measureFPS);
  };

  animationFrameId = requestAnimationFrame(measureFPS);

  return () => {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
    }
  };
}

export function usePerformanceMonitor(pageName: string) {
  const location = useLocation();
  const fpsCleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // Start FPS tracking for this page
    fpsCleanupRef.current = trackFPS(pageName);

    // Track page load performance
    if (typeof window !== 'undefined' && 'performance' in window) {
      const navigationTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      if (navigationTiming) {
        const tti = navigationTiming.domInteractive - navigationTiming.fetchStart;
        const fcp = navigationTiming.responseEnd - navigationTiming.fetchStart;
        
        trackPerformance('page_load', tti, {
          page: pageName,
          path: location.pathname,
          fcp,
          device_type: getDeviceType()
        });
      }

      // Track Core Web Vitals
      if ('PerformanceObserver' in window) {
        // Largest Contentful Paint (LCP)
        try {
          const lcpObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            if (lastEntry) {
              trackPerformance('lcp', lastEntry.startTime, { page: pageName });
            }
          });
          lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

          // First Input Delay (FID)
          const fidObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            entries.forEach((entry: any) => {
              const fid = entry.processingStart - entry.startTime;
              trackPerformance('fid', fid, { page: pageName });
            });
          });
          fidObserver.observe({ entryTypes: ['first-input'] });

          // Cumulative Layout Shift (CLS)
          let clsValue = 0;
          const clsObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (!(entry as any).hadRecentInput) {
                clsValue += (entry as any).value;
              }
            }
            // Convert to ms equivalent for consistent tracking
            trackPerformance('cls', clsValue * 1000, { page: pageName });
          });
          clsObserver.observe({ entryTypes: ['layout-shift'] });

          return () => {
            lcpObserver.disconnect();
            fidObserver.disconnect();
            clsObserver.disconnect();
          };
        } catch (error) {
          console.warn('Performance observer setup failed:', error);
        }
      }
    }

    return () => {
      // Cleanup FPS tracking when component unmounts
      if (fpsCleanupRef.current) {
        fpsCleanupRef.current();
      }
    };
  }, [pageName, location.pathname]);
}
