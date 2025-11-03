import * as Sentry from "@sentry/react";
import { supabase } from "@/integrations/supabase/client";
import { getDeviceType, getConnectionType, getBrowser } from '@/lib/utils/deviceDetection';
import { checkPerformanceAlerts } from './alerting';

export function initSentry() {
  const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;
  
  if (!SENTRY_DSN) {
    console.warn('⚠️ Sentry DSN not configured - error tracking disabled');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: import.meta.env.MODE,
    
    // Performance Monitoring
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0, // 10% in prod, 100% in dev
    
    // Session Replay (for debugging)
    replaysSessionSampleRate: 0.1, // 10% of sessions
    replaysOnErrorSampleRate: 1.0, // 100% of error sessions
    
    integrations: [
      new Sentry.BrowserTracing({
        // Performance tracking for all routes
        tracePropagationTargets: ["localhost", /^https:\/\/.*\.supabase\.co/],
      }),
      new Sentry.Replay({
        maskAllText: true, // Privacy: mask all text
        blockAllMedia: true, // Privacy: block all media
      }),
    ],
    
    // Filter out sensitive data
    beforeSend(event) {
      // Remove passwords, tokens, PINs from error reports
      if (event.request?.data) {
        const data = event.request.data as any;
        delete data?.password;
        delete data?.pin;
        delete data?.token;
        delete data?.manager_pin;
      }
      return event;
    },
    
    // Performance budgets
    beforeSendTransaction(transaction) {
      // Flag slow transactions
      const lcp = transaction.measurements?.['lcp']?.value;
      if (lcp && lcp > 2500) {
        transaction.tags = {
          ...transaction.tags,
          performance_issue: 'slow_lcp'
        };
      }
      return transaction;
    },
  });

  console.log('✅ Sentry initialized');
}

// Custom performance tracking
export async function trackPerformance(metricType: string, duration: number, metadata?: any) {
  // Send to Sentry if available
  try {
    Sentry.metrics.distribution(metricType, duration, {
      unit: 'millisecond',
      tags: metadata
    });
  } catch (error) {
    // Sentry not initialized or metrics not available
    console.debug('Sentry metrics not available:', error);
  }

  // Log to Supabase for analytics
  await logPerformanceMetric(metricType, duration, metadata);
  
  // Check for performance alerts
  await checkPerformanceAlerts(metricType, duration, metadata?.page || window.location.pathname);
}

async function logPerformanceMetric(metricType: string, duration: number, metadata?: any) {
  const budget = getPerformanceBudget(metricType);
  
  try {
    // Extract only safe fields, filter out 'component' and other unsafe fields
    const { component, ...safeMetadata } = metadata || {};
    
    const { error } = await supabase
      .from('performance_metrics')
      .insert({
        metric_type: metricType,
        page_path: metadata?.page || window.location.pathname,
        duration_ms: Math.round(duration), // Round to integer for DB
        exceeded_budget: duration > budget,
        device_type: getDeviceType(),
        browser: navigator.userAgent,
        connection_type: getConnectionType(),
      });

    if (error) {
      console.error('Failed to log performance metric:', error);
    }
  } catch (error) {
    console.error('Performance logging error:', error);
  }
}

function getPerformanceBudget(metricType: string): number {
  const budgets: Record<string, number> = {
    page_load: 1500,
    tti: 1500,
    fcp: 800,
    lcp: 2500,
    fid: 100,
    cls: 100, // 0.1 * 1000 (we multiply CLS by 1000 for ms storage)
    fps: 45,
  };
  return budgets[metricType] || 5000;
}

// Re-export utility functions for backward compatibility
export { getDeviceType, getConnectionType, getBrowser };
