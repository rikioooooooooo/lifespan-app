"use client";

import { useEffect, useRef } from "react";

interface Props {
  text: string;
  className?: string;
  style?: React.CSSProperties;
}

export default function GlitchText({ text, className = "", style }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let frame = 0;
    let animId: number;

    const loop = () => {
      frame++;

      // Glitch triggers at irregular intervals
      const shouldGlitch = Math.random() < 0.03; // ~3% chance per frame ≈ every ~0.5s
      const isIntenseGlitch = shouldGlitch && Math.random() < 0.2; // 20% of glitches are intense

      if (shouldGlitch) {
        const duration = isIntenseGlitch ? 150 + Math.random() * 200 : 50 + Math.random() * 100;
        const offsetX = (Math.random() - 0.5) * (isIntenseGlitch ? 8 : 3);
        const skewX = (Math.random() - 0.5) * (isIntenseGlitch ? 4 : 1.5);

        // Apply glitch
        el.style.transform = `translate(${offsetX}px, 0) skewX(${skewX}deg)`;
        el.style.clipPath = isIntenseGlitch
          ? `inset(${Math.random() * 30}% 0 ${Math.random() * 30}% 0)`
          : "none";

        // Red/cyan chromatic aberration via text-shadow
        const spread = isIntenseGlitch ? 3 + Math.random() * 4 : 1 + Math.random() * 2;
        el.style.textShadow = `${spread}px 0 rgba(255,20,20,0.7), ${-spread}px 0 rgba(0,255,255,0.4)`;

        // Reset after duration
        setTimeout(() => {
          el.style.transform = "translate(0, 0) skewX(0deg)";
          el.style.clipPath = "none";
          el.style.textShadow = "none";
        }, duration);
      }

      // Subtle constant micro-jitter (barely perceptible)
      if (frame % 4 === 0 && !shouldGlitch) {
        const microX = (Math.random() - 0.5) * 0.3;
        el.style.transform = `translate(${microX}px, 0)`;
      }

      animId = requestAnimationFrame(loop);
    };

    // Reduced motion check
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        ...style,
        willChange: "transform",
        transition: "none",
      }}
    >
      {text}
    </div>
  );
}
