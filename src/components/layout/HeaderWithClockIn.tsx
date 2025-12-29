import { AppHeader } from './AppHeader';
import { useModalManager } from '@/hooks/useModalManager';
import { useShift } from '@/contexts/ShiftContext';

export function HeaderWithClockIn() {
  const { activeShift, shiftElapsed, refreshShift, clearShift } = useShift();
  const { openModal } = useModalManager();

  return (
    <AppHeader
      currentShiftId={activeShift?.id || null}
      shiftElapsed={shiftElapsed}
      onClockIn={() => openModal('employeeClockIn', {
        onSuccess: async () => {
          // Refresh shift context to pick up the new shift
          await refreshShift();
        },
      })}
      onClockOut={() => openModal('employeeClockOut', {
        shiftId: activeShift?.id,
        onSuccess: () => {
          // Clear shift from context
          clearShift();
        },
      })}
    />
  );
}
