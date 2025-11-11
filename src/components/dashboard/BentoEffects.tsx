import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { detectBreakpoint } from '@/lib/widgets/bentoGrid';

const SPOTLIGHT_RADIUS = 300;
const PROXIMITY_THRESHOLD = 150;
const FADE_DISTANCE = 250;

function calculateDistance(x: number, y: number, rect: DOMRect): number {
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const dx = x - centerX;
  const dy = y - centerY;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  // Subtract half the diagonal to get distance from edge
  const halfDiagonal = Math.sqrt(rect.width * rect.width + rect.height * rect.height) / 2;
  return Math.max(0, distance - halfDiagonal);
}

function calculateGlowIntensity(distance: number): number {
  if (distance <= PROXIMITY_THRESHOLD) {
    return 1;
  } else if (distance <= FADE_DISTANCE) {
    return (FADE_DISTANCE - distance) / (FADE_DISTANCE - PROXIMITY_THRESHOLD);
  }
  return 0;
}

export function BentoEffects() {
  const spotlightRef = useRef<HTMLDivElement>(null);
  const [isInsideDashboard, setIsInsideDashboard] = useState(false);
  const rafRef = useRef<number | null>(null);
  const isMobile = detectBreakpoint() === 'mobile';

  useEffect(() => {
    // Disable effects on mobile for performance
    if (isMobile || !spotlightRef.current) return;

    let lastX = 0;
    let lastY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      lastX = e.clientX;
      lastY = e.clientY;

      // Check if mouse is inside bento container
      const container = document.querySelector('.bento-container');
      if (container) {
        const rect = container.getBoundingClientRect();
        const inside = 
          e.clientX >= rect.left && 
          e.clientX <= rect.right && 
          e.clientY >= rect.top && 
          e.clientY <= rect.bottom;
        
        setIsInsideDashboard(inside);

        if (!inside) {
          // Reset all glow intensities
          document.querySelectorAll('.bento-widget').forEach(widget => {
            (widget as HTMLElement).style.setProperty('--glow-intensity', '0');
          });
          return;
        }
      }

      // Cancel previous frame
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }

      // Schedule update for next frame
      rafRef.current = requestAnimationFrame(() => {
        if (!spotlightRef.current) return;

        // Update spotlight position with GSAP
        gsap.to(spotlightRef.current, {
          left: lastX,
          top: lastY,
          duration: 0.1,
          ease: 'power2.out',
        });

        // Update widget glow intensities
        let minDistance = Infinity;
        
        document.querySelectorAll('.bento-widget').forEach(widget => {
          const rect = widget.getBoundingClientRect();
          const distance = calculateDistance(lastX, lastY, rect);
          minDistance = Math.min(minDistance, distance);
          
          const intensity = calculateGlowIntensity(distance);
          const relativeX = ((lastX - rect.left) / rect.width) * 100;
          const relativeY = ((lastY - rect.top) / rect.height) * 100;
          
          const el = widget as HTMLElement;
          el.style.setProperty('--glow-x', `${relativeX}%`);
          el.style.setProperty('--glow-y', `${relativeY}%`);
          el.style.setProperty('--glow-intensity', intensity.toString());
        });
      });
    };

    const handleMouseLeave = () => {
      setIsInsideDashboard(false);
      
      // Reset all glow intensities
      document.querySelectorAll('.bento-widget').forEach(widget => {
        (widget as HTMLElement).style.setProperty('--glow-intensity', '0');
      });
      
      if (spotlightRef.current) {
        gsap.to(spotlightRef.current, {
          opacity: 0,
          duration: 0.3,
          ease: 'power2.out',
        });
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [isMobile]);

  // Don't render on mobile
  if (isMobile) return null;

  return (
    <div
      ref={spotlightRef}
      className="bento-spotlight"
      style={{
        opacity: isInsideDashboard ? 0.8 : 0,
      }}
    />
  );
}
