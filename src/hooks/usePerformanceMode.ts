import { useDeviceDetection } from './useDeviceDetection';
import { useMediaQuery } from './useMediaQuery';
import { useSpeedMode } from './useSpeedMode';

export interface PerformanceMode {
  disableAnimations: boolean;
  disableHeavyEffects: boolean;
  disableBlur: boolean;
  enableGestures: boolean;
  animationDuration: number | undefined;
  reducedPolling: boolean;
  isSpeedMode: boolean;
}

/**
 * Performance mode hook
 * Determines which features should be disabled for optimal performance
 * - Speed Mode: Force all optimizations for 60fps 0-lag experience
 * - Mobile: Disable all heavy animations, blur effects
 * - Portrait Tablet: Disable heavy effects only
 * - Desktop: Full experience
 * - Respects prefers-reduced-motion
 */
export function usePerformanceMode(): PerformanceMode {
  const { device, isTouch } = useDeviceDetection();
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const { speedMode } = useSpeedMode();
  
  // Mobile gets the most aggressive optimizations
  const isMobile = device === 'mobile';
  const isPortraitTablet = device === 'portrait-tablet';
  
  // Speed mode forces all optimizations for maximum performance
  const forceOptimizations = speedMode;
  
  // Disable all animations on mobile, speed mode, or when user prefers reduced motion
  const disableAnimations = forceOptimizations || isMobile || prefersReducedMotion;
  
  // Disable heavy effects (glassmorphism, complex shadows) on mobile, portrait tablets, or speed mode
  const disableHeavyEffects = forceOptimizations || isMobile || isPortraitTablet;
  
  // Disable backdrop blur specifically (performance drain)
  const disableBlur = forceOptimizations || isMobile;
  
  // Enable touch gestures on touch devices
  const enableGestures = isTouch;
  
  // Set animation duration to 0 if disabled, otherwise use default
  const animationDuration = disableAnimations ? 0 : undefined;
  
  // Reduce polling frequency on mobile but NOT in speed mode (we want fast updates)
  const reducedPolling = isMobile && !speedMode;
  
  return {
    disableAnimations,
    disableHeavyEffects,
    disableBlur,
    enableGestures,
    animationDuration,
    reducedPolling,
    isSpeedMode: speedMode,
  };
}
