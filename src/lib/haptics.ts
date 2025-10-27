/**
 * Haptic Feedback System
 * Provides tactile feedback for touch interactions on mobile devices
 */

export const HapticPattern = {
  LIGHT: [10],           // Light tap
  MEDIUM: [20],          // Medium feedback
  HEAVY: [30],           // Strong feedback
  SUCCESS: [10, 50, 10], // Success pattern
  ERROR: [20, 50, 20, 50, 20], // Error shake
  SELECTION: [5],        // Quick tap for selections
} as const;

export function triggerHaptic(pattern: readonly number[] = HapticPattern.LIGHT) {
  // Only trigger on mobile devices with touch capability
  if ('vibrate' in navigator && window.matchMedia('(pointer: coarse)').matches) {
    navigator.vibrate([...pattern]);
  }
}

// Convenience functions
export const haptics = {
  light: () => triggerHaptic(HapticPattern.LIGHT),
  medium: () => triggerHaptic(HapticPattern.MEDIUM),
  heavy: () => triggerHaptic(HapticPattern.HEAVY),
  success: () => triggerHaptic(HapticPattern.SUCCESS),
  error: () => triggerHaptic(HapticPattern.ERROR),
  selection: () => triggerHaptic(HapticPattern.SELECTION),
};
