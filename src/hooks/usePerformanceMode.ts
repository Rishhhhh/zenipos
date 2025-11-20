import { useDeviceDetection } from './useDeviceDetection';
import { useMediaQuery } from './useMediaQuery';

export interface PerformanceMode {
  disableAnimations: boolean;
  disableHeavyEffects: boolean;
  disableBlur: boolean;
  enableGestures: boolean;
  animationDuration: number | undefined;
  reducedPolling: boolean;
}

/**
 * Performance mode hook
 * Determines which features should be disabled for optimal performance
 * - Mobile: Disable all heavy animations, blur effects
 * - Portrait Tablet: Disable heavy effects only
 * - Desktop: Full experience
 * - Respects prefers-reduced-motion
 */
export function usePerformanceMode(): PerformanceMode {
  const { device, isTouch } = useDeviceDetection();
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  
  // Mobile gets the most aggressive optimizations
  const isMobile = device === 'mobile';
  const isPortraitTablet = device === 'portrait-tablet';
  
  // Disable all animations on mobile or when user prefers reduced motion
  const disableAnimations = isMobile || prefersReducedMotion;
  
  // Disable heavy effects (glassmorphism, complex shadows) on mobile and portrait tablets
  const disableHeavyEffects = isMobile || isPortraitTablet;
  
  // Disable backdrop blur specifically (performance drain)
  const disableBlur = isMobile;
  
  // Enable touch gestures on touch devices
  const enableGestures = isTouch;
  
  // Set animation duration to 0 if disabled, otherwise use default
  const animationDuration = disableAnimations ? 0 : undefined;
  
  // Reduce polling frequency on mobile (slower network updates)
  const reducedPolling = isMobile;
  
  return {
    disableAnimations,
    disableHeavyEffects,
    disableBlur,
    enableGestures,
    animationDuration,
    reducedPolling
  };
}
