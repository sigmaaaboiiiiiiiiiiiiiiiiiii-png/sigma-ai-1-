import React, { useEffect, useRef } from 'react';

interface GlowingParticlesProps {
  colorHex: string;
  stopAnimations?: boolean;
}

interface Particle {
  x: number;
  y: number;
  radius: number;
  vy: number;
  swayAngle: number;
  swaySpeed: number;
  swayAmplitude: number;
  alpha: number;
  alphaSpeed: number;
}

export const GlowingParticles: React.FC<GlowingParticlesProps> = ({
  colorHex,
  stopAnimations = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (stopAnimations) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Spawn 55 lightweight glowing particles
    const particleCount = 55;
    const particles: Particle[] = [];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: 1.2 + Math.random() * 2.2,
        // Gravity needs to be 0.5 (gentle, steady, slow descent)
        vy: 0.45 + Math.random() * 0.15,
        swayAngle: Math.random() * Math.PI * 2,
        swaySpeed: 0.015 + Math.random() * 0.02,
        swayAmplitude: 0.8 + Math.random() * 1.4,
        alpha: 0.25 + Math.random() * 0.65,
        alphaSpeed: 0.01 + Math.random() * 0.015,
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Motion update: gravity 0.5 with swaying lateral drift
        p.y += p.vy;
        p.swayAngle += p.swaySpeed;
        p.x += Math.sin(p.swayAngle) * p.swayAmplitude;

        // Subtle alpha pulsation
        p.alpha += Math.sin(p.swayAngle * 2) * 0.005;
        const clampedAlpha = Math.max(0.15, Math.min(0.85, p.alpha));

        // Draw glowing particle
        ctx.save();
        ctx.shadowBlur = p.radius * 3.5;
        ctx.shadowColor = colorHex;
        ctx.fillStyle = colorHex;
        ctx.globalAlpha = clampedAlpha;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Loop around when falling below viewport
        if (p.y > height + 10) {
          p.y = -10;
          p.x = Math.random() * width;
          p.vy = 0.45 + Math.random() * 0.15;
        }
        if (p.x < -20) p.x = width + 20;
        if (p.x > width + 20) p.x = -20;
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
    };
  }, [colorHex, stopAnimations]);

  if (stopAnimations) {
    return null;
  }

  return (
    <canvas
      id="sigma-glowing-particles-canvas"
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-0 opacity-80"
    />
  );
};
