import * as Sentry from "@sentry/react";
import { supabase } from "@/integrations/supabase/client";

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
export function trackPerformance(metricType: string, duration: number, metadata?: any) {
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

  // Also log to database
  logPerformanceMetric(metricType, duration, metadata);
}

async function logPerformanceMetric(metricType: string, duration: number, metadata?: any) {
  const budget = getPerformanceBudget(metricType);
  
  try {
    const { error } = await supabase
      .from('performance_metrics')
      .insert({
        metric_type: metricType,
        page_path: metadata?.page || window.location.pathname,
        duration_ms: duration,
        exceeded_budget: duration > budget,
        device_type: getDeviceType(),
        browser: navigator.userAgent,
        connection_type: getConnectionType(),
        ...metadata
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
    'page_load': 1500, // TTI budget: 1.5s
    'route_change': 200, // Route switch: 200ms
    'kds_update': 1000, // KDS update: 1s
    'api_call': 500,
    'render': 100
  };
  return budgets[metricType] || 1000;
}

function getDeviceType(): string {
  const width = window.innerWidth;
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
}

function getConnectionType(): string {
  const connection = (navigator as any).connection;
  return connection?.effectiveType || 'unknown';
}
