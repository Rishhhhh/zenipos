import { useState, useEffect, useMemo, Suspense } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { detectBreakpoint, areasToCSS, type BentoBreakpoint } from '@/lib/widgets/bentoGrid';
import { getBentoLayoutForRole } from '@/lib/widgets/bentoLayouts';
import { useBentoLayout } from '@/lib/widgets/useBentoLayout';
import { BentoWidget } from './BentoWidget';
import { BentoEffects } from './BentoEffects';
import { Skeleton } from '@/components/ui/skeleton';
import './bento.css';

interface BentoDashboardProps {
  onConfigure: (widgetId: string) => void;
  enableEffects?: boolean;
}

export default function BentoDashboard({ 
  onConfigure, 
  enableEffects = true 
}: BentoDashboardProps) {
  const { employee } = useAuth();
  const role = (employee?.role || 'staff') as 'staff' | 'manager' | 'owner';
  const [breakpoint, setBreakpoint] = useState<BentoBreakpoint>(() => detectBreakpoint());

  // Detect breakpoint on mount and window resize
  useEffect(() => {
    const handleResize = () => {
      setBreakpoint(detectBreakpoint());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const { widgetStates, toggleMinimize, removeWidget } = useBentoLayout(role, breakpoint);

  // Get layout for current role and breakpoint
  const layout = useMemo(() => 
    getBentoLayoutForRole(role, breakpoint), 
    [role, breakpoint]
  );

  // Apply CSS Grid template dynamically
  const gridStyles = useMemo(() => ({
    display: 'grid',
    gridTemplateColumns: layout.gridTemplate.columns,
    gridTemplateRows: layout.gridTemplate.rows,
    gridTemplateAreas: areasToCSS(layout.gridTemplate.areas),
    gap: layout.gridTemplate.gap,
    minHeight: layout.gridTemplate.minHeight,
  }), [layout.gridTemplate]);

  return (
    <div className="bento-container" style={gridStyles}>
      {enableEffects && <BentoEffects />}
      
      {layout.widgets.map(widget => (
        <BentoWidget
          key={widget.id}
          widgetId={widget.id}
          area={widget.area}
          colSpan={widget.colSpan}
          rowSpan={widget.rowSpan}
          isMinimized={widgetStates[widget.id]?.isMinimized || false}
          onMinimize={() => toggleMinimize(widget.id)}
          onConfigure={() => onConfigure(widget.id)}
          onClose={() => removeWidget(widget.id)}
        />
      ))}
    </div>
  );
}
