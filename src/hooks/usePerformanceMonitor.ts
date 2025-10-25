import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPerformance } from '@/lib/monitoring/sentry';

export function usePerformanceMonitor(pageName: string) {
  const location = useLocation();

  useEffect(() => {
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
  }, [pageName, location.pathname]);
}

function getDeviceType(): string {
  const width = window.innerWidth;
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
}
