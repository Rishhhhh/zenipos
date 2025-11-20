import { useState, useEffect } from 'react';

export type DeviceType = 'mobile' | 'portrait-tablet' | 'landscape-tablet' | 'desktop';
export type Orientation = 'portrait' | 'landscape';

export interface DeviceDetection {
  device: DeviceType;
  orientation: Orientation;
  isTouch: boolean;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  width: number;
  height: number;
}

/**
 * Enhanced device detection hook
 * Detects device type, orientation, and touch capability
 * Optimized for restaurant POS tablet/mobile views
 */
export function useDeviceDetection(): DeviceDetection {
  const [device, setDevice] = useState<DeviceType>('desktop');
  const [orientation, setOrientation] = useState<Orientation>('landscape');
  const [isTouch, setIsTouch] = useState(false);
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const detect = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const isPortrait = h > w;
      
      setWidth(w);
      setHeight(h);
      setOrientation(isPortrait ? 'portrait' : 'landscape');
      setIsTouch('ontouchstart' in window || navigator.maxTouchPoints > 0);

      // Device classification based on width
      if (w < 768) {
        setDevice('mobile');
      } else if (w >= 768 && w < 834) {
        // Portrait tablet range (iPad Mini portrait: 768px)
        setDevice('portrait-tablet');
      } else if (w >= 834 && w < 1024) {
        // Landscape tablet range (iPad portrait: 834px, landscape: 1024px)
        setDevice('landscape-tablet');
      } else {
        setDevice('desktop');
      }
    };

    // Initial detection
    detect();

    // Listen for resize and orientation changes
    window.addEventListener('resize', detect);
    window.addEventListener('orientationchange', () => {
      // Delay to allow browser to update dimensions
      setTimeout(detect, 100);
    });
    
    return () => {
      window.removeEventListener('resize', detect);
      window.removeEventListener('orientationchange', detect);
    };
  }, []);

  return { 
    device, 
    orientation, 
    isTouch,
    isMobile: device === 'mobile',
    isTablet: device === 'portrait-tablet' || device === 'landscape-tablet',
    isDesktop: device === 'desktop',
    width,
    height
  };
}
