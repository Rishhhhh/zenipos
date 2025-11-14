import { supabase } from '@/integrations/supabase/client';

interface PerformanceAlert {
  severity: 'warning' | 'critical';
  metric: string;
  value: number;
  threshold: number;
  page: string;
}

const ALERT_THRESHOLDS = {
  tti_critical: 3000, // 3s
  tti_warning: 2000,  // 2s
  lcp_critical: 4000, // 4s
  lcp_warning: 2500,  // 2.5s
  fid_critical: 300,  // 300ms
  fid_warning: 100,   // 100ms
  cls_critical: 250,  // CLS * 1000 (see sentry.ts conversion)
  cls_warning: 100,   // 0.1 * 1000
  page_load_critical: 3000,
  page_load_warning: 2000,
  route_change_critical: 500, // 500ms for route transitions
  route_change_warning: 200,  // 200ms target
  kds_update_critical: 2000, // 2s for KDS updates
  kds_update_warning: 1000,  // 1s target
  fps_critical: 20, // Below 20 FPS is critical (severe lag)
  fps_warning: 30,  // Below 30 FPS is warning (noticeable lag)
};

export async function checkPerformanceAlerts(
  metricType: string,
  value: number,
  page: string
): Promise<PerformanceAlert | null> {
  const criticalKey = `${metricType}_critical` as keyof typeof ALERT_THRESHOLDS;
  const warningKey = `${metricType}_warning` as keyof typeof ALERT_THRESHOLDS;

  const criticalThreshold = ALERT_THRESHOLDS[criticalKey];
  const warningThreshold = ALERT_THRESHOLDS[warningKey];

  let alert: PerformanceAlert | null = null;

  // For FPS, lower is worse (inverted check)
  if (metricType === 'fps') {
    if (criticalThreshold && value < criticalThreshold) {
      alert = {
        severity: 'critical',
        metric: metricType,
        value,
        threshold: criticalThreshold,
        page,
      };
    } else if (warningThreshold && value < warningThreshold) {
      alert = {
        severity: 'warning',
        metric: metricType,
        value,
        threshold: warningThreshold,
        page,
      };
    }
  } else {
    // For other metrics, higher is worse
    if (criticalThreshold && value > criticalThreshold) {
      alert = {
        severity: 'critical',
        metric: metricType,
        value,
        threshold: criticalThreshold,
        page,
      };
    } else if (warningThreshold && value > warningThreshold) {
      alert = {
        severity: 'warning',
        metric: metricType,
        value,
        threshold: warningThreshold,
        page,
      };
    }
  }

  if (alert) {
    try {
      // Log to database
      await supabase.from('performance_alerts').insert({
        severity: alert.severity,
        metric_type: alert.metric,
        measured_value: alert.value,
        threshold_value: alert.threshold,
        page_path: alert.page,
        resolved: false,
      });

      // Send push notification to admins (if critical)
      if (alert.severity === 'critical') {
        await supabase.functions.invoke('send-push-notification', {
          body: {
            title: '⚠️ Performance Alert',
            body: `Critical: ${metricType} on ${page} is ${value}ms (threshold: ${alert.threshold}ms)`,
            audience: 'admins',
          },
        }).catch(err => console.warn('Failed to send alert notification:', err));
      }
    } catch (error) {
      console.warn('Failed to log performance alert:', error);
    }
  }

  return alert;
}

/**
 * Get unresolved performance alerts for dashboard
 */
export async function getUnresolvedAlerts(limit: number = 10) {
  const { data, error } = await supabase
    .from('performance_alerts')
    .select('*')
    .eq('resolved', false)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Failed to fetch unresolved alerts:', error);
    return [];
  }

  return data || [];
}

/**
 * Mark an alert as resolved
 */
export async function resolveAlert(alertId: string) {
  const { error } = await supabase
    .from('performance_alerts')
    .update({ resolved: true, resolved_at: new Date().toISOString() })
    .eq('id', alertId);

  if (error) {
    console.error('Failed to resolve alert:', error);
    throw error;
  }
}
