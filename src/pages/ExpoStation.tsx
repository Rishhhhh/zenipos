import { ExpoStationView } from "@/components/kds/ExpoStationView";
import { usePerformanceMonitor } from "@/hooks/usePerformanceMonitor";

export default function ExpoStation() {
  usePerformanceMonitor('ExpoStation');

  return <ExpoStationView />;
}
