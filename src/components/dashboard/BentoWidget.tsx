import { Suspense, useMemo, Component, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { getWidgetById } from '@/lib/widgets/widgetCatalog';
import { WidgetHeader } from './WidgetHeader';
import { Skeleton } from '@/components/ui/skeleton';

interface BentoWidgetProps {
  widgetId: string;
  area: string;
  colSpan: number;
  rowSpan: number;
  isMinimized: boolean;
  onMinimize: () => void;
  onConfigure: () => void;
}

// Widget-specific error boundary
class WidgetErrorBoundary extends Component<
  { children: ReactNode; widgetId: string },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode; widgetId: string }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error(`Widget ${this.props.widgetId} error:`, error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-full p-4 text-center">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Failed to load widget: {this.props.widgetId}
            </p>
            <p className="text-xs text-muted-foreground">
              Try refreshing the page or removing this widget.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export function BentoWidget({
  widgetId,
  area,
  colSpan,
  rowSpan,
  isMinimized,
  onMinimize,
  onConfigure,
}: BentoWidgetProps) {
  const navigate = useNavigate();
  const widgetDef = getWidgetById(widgetId);

  const gridStyles = useMemo(() => ({
    gridArea: area,
    ...(isMinimized && { gridRow: 'span 1' }),
  }), [area, isMinimized]);

  const handleNavigateToModule = () => {
    if (widgetDef?.moduleRoute) {
      navigate(widgetDef.moduleRoute);
    }
  };

  if (!widgetDef) {
    return (
      <div className="bento-widget" style={gridStyles}>
        <div className="p-4 text-center text-muted-foreground">
          Widget not found: {widgetId}
        </div>
      </div>
    );
  }

  const WidgetComponent = widgetDef.component;

  return (
    <div 
      className="bento-widget group" 
      style={gridStyles}
      data-minimized={isMinimized}
      data-widget-id={widgetId}
    >
      <WidgetHeader
        widgetId={widgetId}
        widgetName={widgetDef.name}
        isMinimized={isMinimized}
        onMinimize={onMinimize}
        onConfigure={onConfigure}
        onNavigateToModule={handleNavigateToModule}
      />

      {!isMinimized && (
        <div className="bento-widget__content">
          <WidgetErrorBoundary widgetId={widgetId}>
            <Suspense fallback={
              <div className="p-4 space-y-3">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-8 w-3/4" />
              </div>
            }>
              <WidgetComponent />
            </Suspense>
          </WidgetErrorBoundary>
        </div>
      )}

      {isMinimized && (
        <div className="bento-widget__minimized-indicator" />
      )}
    </div>
  );
}
