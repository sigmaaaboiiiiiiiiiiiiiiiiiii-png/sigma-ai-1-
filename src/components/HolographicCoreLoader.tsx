import React from 'react';

interface HolographicCoreLoaderProps {
  color?: string;
  themeColor?: string;
  themeColorHex?: string;
  ring1Color?: string;
  ring2Color?: string;
  size?: number;
  className?: string;
  showParticles?: boolean;
  stopAnimations?: boolean;
}

/**
 * Sigma Original Morphing Harmonic Prism & Waveform Response Animation
 * - Replaces the old atom/nucleus/electron orbital loader
 * - Uses the active Personalization / Custom Palette color
 * - Respects "Stop Animations" setting
 */
export const HolographicCoreLoader: React.FC<HolographicCoreLoaderProps> = ({
  color,
  themeColor,
  themeColorHex,
  ring1Color,
  size = 38,
  className = '',
  stopAnimations = false,
}) => {
  const activeColor = color || themeColor || themeColorHex || ring1Color || '#00ea77';
  const isStopped =
    stopAnimations ||
    (typeof document !== 'undefined' &&
      document.documentElement.classList.contains('stop-animations'));

  const outerSize = Math.round(size * 0.9);
  const innerSize = Math.round(size * 0.54);

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none flex-shrink-0 ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
      }}
      aria-label="Sigma AI is generating a response..."
      role="status"
    >
      {/* Ambient Personalization Aura */}
      <div
        className="absolute rounded-xl pointer-events-none"
        style={{
          width: `${Math.round(size * 0.76)}px`,
          height: `${Math.round(size * 0.76)}px`,
          backgroundColor: activeColor,
          filter: 'blur(7px)',
          opacity: 0.26,
        }}
      />

      {/* Morphing Organic Squircle Ribbon 1 */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: `${outerSize}px`,
          height: `${outerSize}px`,
          borderRadius: '38% 62% 55% 45% / 48% 36% 64% 52%',
          border: `1.6px solid ${activeColor}`,
          boxShadow: `0 0 10px ${activeColor}55, inset 0 0 6px ${activeColor}33`,
          animation: isStopped ? 'none' : 'sigmaMorphWaveA 3.2s ease-in-out infinite',
        }}
      />

      {/* Morphing Counter-Harmonic Ribbon 2 */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: `${innerSize + 6}px`,
          height: `${innerSize + 6}px`,
          borderRadius: '60% 40% 42% 58% / 52% 62% 38% 48%',
          border: `1.3px solid ${activeColor}bb`,
          animation: isStopped ? 'none' : 'sigmaMorphWaveB 2.4s ease-in-out infinite reverse',
        }}
      />

      {/* Central Harmonic Equalizer Bars */}
      <div className="relative z-10 flex items-center justify-center gap-[2.5px]">
        {[0, 1, 2, 3].map((idx) => (
          <span
            key={idx}
            className="rounded-full"
            style={{
              width: '2.5px',
              height: isStopped ? `${idx % 2 === 0 ? 8 : 13}px` : '12px',
              backgroundColor: activeColor,
              boxShadow: `0 0 6px ${activeColor}`,
              animation: isStopped
                ? 'none'
                : `sigmaHarmonicBar 1.05s ease-in-out ${idx * 0.16}s infinite alternate`,
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes sigmaMorphWaveA {
          0% {
            border-radius: 38% 62% 55% 45% / 48% 36% 64% 52%;
            transform: rotate(0deg) scale(0.95);
          }
          50% {
            border-radius: 62% 38% 44% 56% / 38% 64% 36% 62%;
            transform: rotate(180deg) scale(1.04);
          }
          100% {
            border-radius: 38% 62% 55% 45% / 48% 36% 64% 52%;
            transform: rotate(360deg) scale(0.95);
          }
        }
        @keyframes sigmaMorphWaveB {
          0% {
            border-radius: 60% 40% 42% 58% / 52% 62% 38% 48%;
            transform: rotate(0deg) scale(1.02);
          }
          50% {
            border-radius: 40% 60% 58% 42% / 62% 38% 62% 38%;
            transform: rotate(180deg) scale(0.92);
          }
          100% {
            border-radius: 60% 40% 42% 58% / 52% 62% 38% 48%;
            transform: rotate(360deg) scale(1.02);
          }
        }
        @keyframes sigmaHarmonicBar {
          0% {
            transform: scaleY(0.45);
            opacity: 0.65;
          }
          100% {
            transform: scaleY(1.25);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};
