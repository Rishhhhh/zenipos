import { useState } from 'react';
import { AppHeader } from './AppHeader';
import { useModalManager } from '@/hooks/useModalManager';

export function HeaderWithClockIn() {
  const [currentEmployee, setCurrentEmployee] = useState<any>(null);
  const [currentShiftId, setCurrentShiftId] = useState<string | null>(null);
  const [shiftElapsed, setShiftElapsed] = useState<string>('00:00');
  const { openModal } = useModalManager();

  return (
    <AppHeader
      currentShiftId={currentShiftId}
      shiftElapsed={shiftElapsed}
      onClockIn={() => openModal('employeeClockIn', {
        onSuccess: (employee: any, shiftId: string) => {
          setCurrentEmployee(employee);
          setCurrentShiftId(shiftId);
        },
      })}
      onClockOut={() => openModal('employeeClockOut', {
        shiftId: currentShiftId,
        onSuccess: () => {
          setCurrentEmployee(null);
          setCurrentShiftId(null);
          setShiftElapsed('00:00');
        },
      })}
    />
  );
}
