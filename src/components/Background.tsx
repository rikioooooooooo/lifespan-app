"use client";

import { useEffect, useRef } from "react";

// Layer 1: Fluid gradient blobs (outermost)
function FluidLayer({ canvas }: { canvas: HTMLCanvasElement }) {
  const ctx = canvas.getContext("2d")!;
  const w = canvas.width;
  const h = canvas.height;

  const blobs = Array.from({ length: 6 }, (_, i) => ({
    x: Math.random() * w,
    y: Math.random() * h,
    radius: 150 + Math.random() * 200,
    vx: (Math.random() - 0.5) * 0.3,
    vy: (Math.random() - 0.5) * 0.3,
    hue: (i * 60) % 360,
    hueSpeed: 0.02 + Math.random() * 0.03,
    pulsePhase: Math.random() * Math.PI * 2,
    pulseSpeed: 0.003 + Math.random() * 0.005,
  }));

  return (time: number) => {
    ctx.clearRect(0, 0, w, h);
    for (const blob of blobs) {
      blob.x += blob.vx;
      blob.y += blob.vy;
      blob.hue = (blob.hue + blob.hueSpeed) % 360;
      blob.pulsePhase += blob.pulseSpeed;

      if (blob.x < -200) blob.x = w + 200;
      if (blob.x > w + 200) blob.x = -200;
      if (blob.y < -200) blob.y = h + 200;
      if (blob.y > h + 200) blob.y = -200;

      const pulse = 1 + Math.sin(blob.pulsePhase) * 0.3;
      const r = blob.radius * pulse;

      const grad = ctx.createRadialGradient(blob.x, blob.y, 0, blob.x, blob.y, r);
      grad.addColorStop(0, `hsla(${blob.hue}, 20%, 22%, 0.35)`);
      grad.addColorStop(0.5, `hsla(${blob.hue}, 18%, 15%, 0.15)`);
      grad.addColorStop(1, `hsla(${blob.hue}, 15%, 10%, 0)`);

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(blob.x, blob.y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  };
}

// Layer 2: Geometric mesh (middle)
function MeshLayer({ canvas }: { canvas: HTMLCanvasElement }) {
  const ctx = canvas.getContext("2d")!;
  const w = canvas.width;
  const h = canvas.height;
  const cols = Math.ceil(w / 80) + 1;
  const rows = Math.ceil(h / 80) + 1;
  const spacing = 80;

  const points = Array.from({ length: cols * rows }, (_, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    return {
      baseX: col * spacing,
      baseY: row * spacing,
      x: col * spacing,
      y: row * spacing,
      phaseX: Math.random() * Math.PI * 2,
      phaseY: Math.random() * Math.PI * 2,
      ampX: 5 + Math.random() * 15,
      ampY: 5 + Math.random() * 15,
      speedX: 0.005 + Math.random() * 0.01,
      speedY: 0.005 + Math.random() * 0.01,
    };
  });

  return (time: number) => {
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
    ctx.lineWidth = 0.5;

    for (const p of points) {
      p.phaseX += p.speedX;
      p.phaseY += p.speedY;
      p.x = p.baseX + Math.sin(p.phaseX) * p.ampX;
      p.y = p.baseY + Math.sin(p.phaseY) * p.ampY;
    }

    // Draw horizontal lines
    for (let row = 0; row < rows; row++) {
      ctx.beginPath();
      for (let col = 0; col < cols; col++) {
        const p = points[row * cols + col];
        if (col === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
    }

    // Draw vertical lines
    for (let col = 0; col < cols; col++) {
      ctx.beginPath();
      for (let row = 0; row < rows; row++) {
        const p = points[row * cols + col];
        if (row === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
    }
  };
}

// Layer 3: Particles (foreground)
function ParticleLayer({ canvas }: { canvas: HTMLCanvasElement }) {
  const ctx = canvas.getContext("2d")!;
  const w = canvas.width;
  const h = canvas.height;
  const count = Math.min(Math.floor((w * h) / 8000), 120);

  const particles = Array.from({ length: count }, () => ({
    x: Math.random() * w,
    y: Math.random() * h,
    vx: (Math.random() - 0.5) * 0.4,
    vy: (Math.random() - 0.5) * 0.4,
    size: 0.5 + Math.random() * 1.5,
    hue: Math.random() * 360,
    hueSpeed: 0.1 + Math.random() * 0.3,
    opacity: 0.1 + Math.random() * 0.25,
    pulsePhase: Math.random() * Math.PI * 2,
    pulseSpeed: 0.01 + Math.random() * 0.03,
  }));

  // Vortex centers
  const vortices = [
    { x: w * 0.3, y: h * 0.4, strength: 0.02, phase: 0, speed: 0.001 },
    { x: w * 0.7, y: h * 0.6, strength: -0.015, phase: Math.PI, speed: 0.0008 },
  ];

  return (time: number) => {
    ctx.clearRect(0, 0, w, h);

    // Update vortex positions slowly
    for (const v of vortices) {
      v.phase += v.speed;
      v.x += Math.sin(v.phase) * 0.3;
      v.y += Math.cos(v.phase * 0.7) * 0.2;
    }

    for (const p of particles) {
      // Vortex influence
      for (const v of vortices) {
        const dx = p.x - v.x;
        const dy = p.y - v.y;
        const dist = Math.sqrt(dx * dx + dy * dy) + 1;
        if (dist < 300) {
          const force = v.strength / (dist * 0.01);
          p.vx += -dy * force * 0.001;
          p.vy += dx * force * 0.001;
        }
      }

      // Damping
      p.vx *= 0.999;
      p.vy *= 0.999;

      p.x += p.vx;
      p.y += p.vy;
      p.hue = (p.hue + p.hueSpeed) % 360;
      p.pulsePhase += p.pulseSpeed;

      // Wrap around
      if (p.x < -10) p.x = w + 10;
      if (p.x > w + 10) p.x = -10;
      if (p.y < -10) p.y = h + 10;
      if (p.y > h + 10) p.y = -10;

      const pulse = 0.7 + Math.sin(p.pulsePhase) * 0.3;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * pulse, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${p.hue}, 20%, 55%, ${p.opacity * pulse})`;
      ctx.fill();
    }
  };
}

export default function Background() {
  const fluidRef = useRef<HTMLCanvasElement>(null);
  const meshRef = useRef<HTMLCanvasElement>(null);
  const particleRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const fluid = fluidRef.current;
    const mesh = meshRef.current;
    const particle = particleRef.current;
    if (!fluid || !mesh || !particle) return;

    const resize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio, 2);
      for (const c of [fluid, mesh, particle]) {
        c.width = w * dpr;
        c.height = h * dpr;
        c.style.width = `${w}px`;
        c.style.height = `${h}px`;
        c.getContext("2d")!.scale(dpr, dpr);
      }
    };

    resize();

    const renderFluid = FluidLayer({ canvas: fluid });
    const renderMesh = MeshLayer({ canvas: mesh });
    const renderParticle = ParticleLayer({ canvas: particle });

    let time = 0;
    const loop = () => {
      time++;
      renderFluid(time);
      renderMesh(time);
      renderParticle(time);
      animRef.current = requestAnimationFrame(loop);
    };

    loop();
    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  const canvasStyle: React.CSSProperties = {
    position: "fixed",
    inset: 0,
    width: "100%",
    height: "100%",
    pointerEvents: "none",
  };

  return (
    <>
      <canvas ref={fluidRef} style={{ ...canvasStyle, zIndex: 0 }} />
      <canvas ref={meshRef} style={{ ...canvasStyle, zIndex: 1 }} />
      <canvas ref={particleRef} style={{ ...canvasStyle, zIndex: 2 }} />
    </>
  );
}
