import React, { useEffect, useRef, useState } from 'react';

export interface GlowingCursorProps {
  colorHex?: string;
}

export const GlowingCursor: React.FC<GlowingCursorProps> = ({
  colorHex = '#00ea77',
}) => {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isPointerDevice, setIsPointerDevice] = useState(true);

  useEffect(() => {
    // Only enable on devices that have a fine mouse/pointer (laptops/desktops)
    const mediaQuery = window.matchMedia('(pointer: fine)');
    setIsPointerDevice(mediaQuery.matches);

    const handleMediaChange = (e: MediaQueryListEvent) => {
      setIsPointerDevice(e.matches);
    };
    mediaQuery.addEventListener('change', handleMediaChange);

    return () => {
      mediaQuery.removeEventListener('change', handleMediaChange);
    };
  }, []);

  useEffect(() => {
    if (!isPointerDevice) return;

    let mouseX = -100;
    let mouseY = -100;
    let ringX = -100;
    let ringY = -100;
    let animationFrameId: number;

    const onMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;

      if (!isVisible) {
        setIsVisible(true);
      }

      // Zero-lag instant position update for the core glowing dot
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`;
      }
    };

    const onMouseEnter = () => {
      setIsVisible(true);
    };

    const onMouseLeave = () => {
      setIsVisible(false);
    };

    // Smooth subtle ring follows slightly behind with high responsiveness
    const loop = () => {
      ringX += (mouseX - ringX) * 0.45;
      ringY += (mouseY - ringY) * 0.45;

      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ringX}px, ${ringY}px, 0)`;
      }

      animationFrameId = requestAnimationFrame(loop);
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    document.addEventListener('mouseenter', onMouseEnter);
    document.addEventListener('mouseleave', onMouseLeave);
    animationFrameId = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseenter', onMouseEnter);
      document.removeEventListener('mouseleave', onMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isPointerDevice, isVisible]);

  if (!isPointerDevice) return null;

  return (
    <div
      id="glowing-mouse-cursor-container"
      className="fixed inset-0 pointer-events-none z-[99999] overflow-hidden"
      aria-hidden="true"
    >
      {/* Outer subtle glowing halo */}
      <div
        ref={ringRef}
        className={`fixed top-0 left-0 -ml-3.5 -mt-3.5 w-7 h-7 rounded-full pointer-events-none transition-opacity duration-150 will-change-transform ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          border: `1px solid ${colorHex}55`,
          backgroundColor: `${colorHex}18`,
          boxShadow: `0 0 16px ${colorHex}40`,
        }}
      />

      {/* Core bright glowing dot at cursor tip - Zero Lag */}
      <div
        ref={dotRef}
        className={`fixed top-0 left-0 -ml-1.5 -mt-1.5 w-3 h-3 rounded-full pointer-events-none transition-opacity duration-100 will-change-transform border border-white/80 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          backgroundColor: colorHex,
          boxShadow: `0 0 8px ${colorHex}, 0 0 18px ${colorHex}, 0 0 28px ${colorHex}99`,
        }}
      />
    </div>
  );
};
