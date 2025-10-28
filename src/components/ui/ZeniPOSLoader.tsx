import { ZeniPOSLogo } from '../layout/ZeniPOSLogo';

export function ZeniPOSLoader() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <div className="relative">
        {/* Animated Z icon */}
        <div className="w-24 h-24 mb-6 animate-pulse">
          <ZeniPOSLogo variant="icon" className="w-full h-full" />
        </div>
        
        {/* Loading text */}
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">
            <span className="text-foreground">ZENI</span>
            <span className="text-primary">POS</span>
          </h2>
          <p className="text-sm text-muted-foreground tracking-widest">ZERO ERROR</p>
          
          {/* Gold loading bar */}
          <div className="mt-4 w-48 h-1 bg-muted rounded-full overflow-hidden mx-auto">
            <div className="h-full bg-primary animate-[shimmer_2s_linear_infinite]" />
          </div>
        </div>
      </div>
    </div>
  );
}
