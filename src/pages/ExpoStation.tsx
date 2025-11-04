import { ExpoStationView } from "@/components/kds/ExpoStationView";
import { usePerformanceMonitor } from "@/hooks/usePerformanceMonitor";
import { useOrderRealtime } from "@/hooks/useOrderRealtime";

export default function ExpoStation() {
  usePerformanceMonitor('ExpoStation');
  useOrderRealtime(); // Enable real-time sync

  return <ExpoStationView />;
}
