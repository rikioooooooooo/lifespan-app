"use client";

import { useEffect, useRef } from "react";

const KOSUKUMA_PATH =
  "M668.2,587.4C635,601.5,600.6,606.1,565.2,602.2C550.5,600.6,536.6,595.8,525.5,585.3C523.7,583.6,522.1,583.6,520.1,584.5C502.2,592.4,483.3,596.5,463.9,596.8C443.2,597,422.9,594.9,405.1,582.7C400.1,579.2,395.7,575,393,569.6C391,565.3,388.1,565,384.1,565.6C372.3,567.2,360.2,568,349,563.8C339.5,560.3,330.1,560.4,320.3,560.2C304,559.8,289.1,555.3,277.7,542.6C262.5,525.7,265,499,282.7,487.2C285.4,485.4,288.4,484,291.6,482.2C287,471.8,283.1,461.4,280.6,450.5C275.3,427.2,275.8,404.3,283.5,381.6C284.9,377.4,284.8,375.2,280.4,372.6C260.9,361.2,242.5,326.8,260.4,296.3C272.9,275.1,290.6,262,315.8,262.1C332.2,262.3,347,268.2,359,280.1C362,283,364.3,286.5,365.9,290.4C367.3,293.6,369.1,293.9,372.2,292.7C393.2,284.4,415.1,281,437.7,281.8C450.1,282.3,462.2,284.3,474.2,287.2C475.8,287.5,477.4,287.9,479.3,288.3C481.8,281.7,484.6,275.6,488.6,270C507.9,243,537.4,242.1,562.8,255.3C566.3,257.1,569.5,257.9,573.3,257.6C607.2,255.1,640,260.2,671.2,274C675.1,275.6,676.8,275.4,678.6,271.2C685.6,255.4,706.5,246.3,724.8,250.6C742.8,254.8,756.2,270.8,755,288.3C754.1,302.7,751.3,312,736.3,322.2C776.4,377.1,784.7,436.4,757.8,499.2C740.2,540.3,709.7,569.4,668.2,587.4Z";

// Death-themed hue palette (tighter range: blood, crimson, deep purple)
const DEATH_HUES = [355, 0, 5, 345, 320, 280, 10];

// === Mouse state (shared across layers) ===
const mouse = { x: -1000, y: -1000 };

// === Progress state (0-2, >1 = whiteout phase) ===
let progress = 0;
export function setBackgroundProgress(p: number) {
  progress = Math.max(0, Math.min(1, p));
}

// === Whiteout system ===
let whiteoutActive = false;
let whiteoutProgress = 0; // 0→1 over ~3 seconds
let whiteoutCallback: (() => void) | null = null;

export function triggerWhiteout(onComplete: () => void) {
  whiteoutActive = true;
  whiteoutProgress = 0;
  whiteoutCallback = onComplete;
}

let whiteoutElement: HTMLDivElement | null = null;

// Store canvas refs for reset
let canvasElements: HTMLCanvasElement[] = [];

export function resetWhiteout() {
  whiteoutActive = false;
  whiteoutProgress = 0;
  whiteoutCallback = null;
  // Restore canvases
  for (const c of canvasElements) {
    c.style.opacity = "1";
    c.style.transition = "none";
    c.style.transform = "none";
  }
  if (whiteoutElement) {
    whiteoutElement.style.transition = "none";
    whiteoutElement.style.opacity = "1";
    whiteoutElement.style.backgroundColor = "rgba(255,255,255,0)";
  }
}

// === Singleton bear offscreen canvas (shared, created once) ===
let bearOffCanvas: HTMLCanvasElement | null = null;
function getBearCanvas(): HTMLCanvasElement {
  if (bearOffCanvas) return bearOffCanvas;
  bearOffCanvas = document.createElement("canvas");
  bearOffCanvas.width = 1028;
  bearOffCanvas.height = 816;
  const ctx = bearOffCanvas.getContext("2d")!;
  const bearPath = new Path2D(KOSUKUMA_PATH);
  ctx.fillStyle = "black";
  ctx.fill(bearPath);
  return bearOffCanvas;
}

// === Progression curves (shared) ===
// "slow" = noticeable from Q6, moderate at Q18, dramatic Q30+
// "fast" = barely visible until Q18, then explodes Q30+
function pSlow() { return Math.pow(progress, 1.5); }  // visible early
function pFast() { return Math.pow(progress, 2.5); }  // dramatic late-game only

// === Global heartbeat (shared rhythm for all layers) ===
// Period: 1200ms at start → 380ms at progress=1 (tachycardia)
// Uses pSlow so the user FEELS acceleration from mid-quiz
function getHeartbeat(time: number) {
  const ps = pSlow();
  const period = 1200 - ps * 820; // 1200ms → 380ms
  const t = time % period;
  const beatPos1 = period * 0.125;
  const beatPos2 = period * 0.333;
  const spread = 1200 + ps * 1400;
  const beat1 = Math.exp(-((t - beatPos1) * (t - beatPos1)) / spread);
  const beat2 = Math.exp(-((t - beatPos2) * (t - beatPos2)) / spread);
  // Intensity: 1.0 → 2.8 (pSlow so it ramps noticeably from middle)
  const intensity = 1.0 + ps * 1.8;
  const raw = beat1 + beat2 * 0.6;
  return Math.min((0.2 + raw * 0.8) * intensity, 2.5);
}

// === Layer 1: Heartbeat Blobs (psychedelic + cardiac pulse) ===
function createBlobLayer(ctx: CanvasRenderingContext2D, w: number, h: number) {
  // Distribute blobs across screen quadrants for full coverage
  const blobs = Array.from({ length: 10 }, (_, i) => ({
    x: (i % 5) * (w / 4) + (Math.random() - 0.5) * (w / 3),
    y: Math.floor(i / 5) * (h / 1.5) + Math.random() * (h / 2),
    vx: (Math.random() - 0.5) * 1.2,
    vy: (Math.random() - 0.5) * 1.2,
    radius: 200 + Math.random() * 300,
    baseHue: DEATH_HUES[i % DEATH_HUES.length],
    hueSpeed: 0.02 + Math.random() * 0.04,
    phase: Math.random() * Math.PI * 2,
    phaseSpeed: 0.003 + Math.random() * 0.006,
  }));

  return (time: number) => {
    const heartbeat = getHeartbeat(time);

    ctx.clearRect(0, 0, w, h);
    ctx.globalCompositeOperation = "screen";

    for (const b of blobs) {
      // Mouse repulsion — gentle, blobs should stay visible
      const dx = b.x - mouse.x;
      const dy = b.y - mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 300 && dist > 0) {
        const force = (300 - dist) / 300;
        b.vx += (dx / dist) * force * 0.5;
        b.vy += (dy / dist) * force * 0.5;
      }

      b.vx *= 0.95;
      b.vy *= 0.95;
      b.phase += b.phaseSpeed;

      b.x += b.vx + Math.sin(time * 0.0005 + b.phase) * 0.4;
      b.y += b.vy + Math.cos(time * 0.0006 + b.phase) * 0.3;

      // Keep blobs within screen bounds (allow half-radius overflow max)
      const limit = b.radius * 0.5;
      if (b.x < -limit) { b.x = -limit; b.vx = Math.abs(b.vx) * 0.5 + 0.3; }
      if (b.x > w + limit) { b.x = w + limit; b.vx = -Math.abs(b.vx) * 0.5 - 0.3; }
      if (b.y < -limit) { b.y = -limit; b.vy = Math.abs(b.vy) * 0.5 + 0.3; }
      if (b.y > h + limit) { b.y = h + limit; b.vy = -Math.abs(b.vy) * 0.5 - 0.3; }

      const pulse = 1 + Math.sin(b.phase) * 0.3;
      const ps = pSlow();
      const r = b.radius * pulse * (1 + heartbeat * 0.25 + ps * 0.4);

      // Blood/death tones — hue oscillates around baseHue, never drifts
      const hue = b.baseHue + Math.sin(time * b.hueSpeed) * 15;
      // Saturation goes up, but LIGHTNESS stays capped low — intensity via alpha, not brightness
      const sat = 60 + Math.sin(b.phase * 0.7) * 15 + ps * 25;
      const lit = Math.min(16 + Math.sin(b.phase * 1.3) * 6 + heartbeat * 8, 38);
      const beatAlpha = Math.min(0.5 + heartbeat * 0.4 + ps * 0.2, 0.95);

      const grad = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, r);
      grad.addColorStop(0, `hsla(${hue}, ${sat + 20}%, ${lit + 12}%, ${beatAlpha})`);
      grad.addColorStop(0.35, `hsla(${hue}, ${sat}%, ${lit}%, ${beatAlpha * 0.6})`);
      grad.addColorStop(0.7, `hsla(${(hue + 15) % 360}, ${sat - 10}%, 8%, 0.08)`);
      grad.addColorStop(1, `hsla(${hue}, 20%, 2%, 0)`);

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(b.x, b.y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  };
}

// === Layer 2: Subliminal Kosukuma (5 patterns) ===
function createGhostLayer(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const pathCenterX = 513.6;
  const pathCenterY = 424.1;
  const offCanvas = getBearCanvas();

  // State
  let lastTime = 0;
  let prevHeartbeat = 0;
  let lastMouse = { x: -1000, y: -1000 };
  let mouseIdleTimer = 0;
  let glitchTimer = 0;
  let afterimageCooldown = 0;

  // Delayed ghost — appears where mouse was 2-4 seconds ago
  const delayedTrail: { x: number; y: number; spawnAt: number }[] = [];
  const delayedGhosts: { x: number; y: number; life: number }[] = [];
  let trailCooldown = 0;

  // Stalker spawns at screen edges (peripheral vision)
  const randomPeripheral = () => {
    const edge = Math.floor(Math.random() * 4);
    switch (edge) {
      case 0: return { x: Math.random() * w, y: Math.random() * h * 0.15 };
      case 1: return { x: w * (0.85 + Math.random() * 0.15), y: Math.random() * h };
      case 2: return { x: Math.random() * w, y: h * (0.85 + Math.random() * 0.15) };
      default: return { x: Math.random() * w * 0.15, y: Math.random() * h };
    }
  };

  const initPos = randomPeripheral();
  const stalker = { x: initPos.x, y: initPos.y, alpha: 0 };
  const afterimages: { x: number; y: number; life: number }[] = [];

  // Helper: draw kosukuma with configurable composite mode
  const drawBear = (
    x: number,
    y: number,
    scale: number,
    alpha: number,
    mode: GlobalCompositeOperation = "overlay",
  ) => {
    if (alpha < 0.001) return;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.translate(-pathCenterX, -pathCenterY);
    ctx.globalCompositeOperation = mode;
    ctx.globalAlpha = alpha;
    ctx.drawImage(offCanvas, 0, 0);
    ctx.restore();
  };

  return (time: number) => {
    ctx.clearRect(0, 0, w, h);
    const rawDt = lastTime === 0 ? 16 : time - lastTime;
    const dt = Math.min(rawDt, 32); // Cap to prevent tab-return timewarp
    lastTime = time;
    const isMouseOut = mouse.x === -1000;
    const mouseSpeed = isMouseOut
      ? 0
      : Math.hypot(mouse.x - lastMouse.x, mouse.y - lastMouse.y);

    const heartbeat = getHeartbeat(time);
    const isHeartbeatPeak = heartbeat > 1.2 && prevHeartbeat <= 1.2;
    prevHeartbeat = heartbeat;

    // 1. Micro-saccade Flash — fires on heartbeat peaks, much more frequent
    const pf = pFast();
    const ps = pSlow();
    const flashChance = 0.008 + ps * 0.04;
    const shouldFlash = isHeartbeatPeak
      ? Math.random() < 0.4 + ps * 0.6  // 40-100% chance on beat
      : Math.random() < flashChance;
    if (shouldFlash) {
      const flashAlpha = 0.14 + heartbeat * 0.18 + pf * 0.12;
      // Multiple flashes at high progress
      const flashCount = 1 + Math.floor(pf * 5);
      for (let f = 0; f < flashCount; f++) {
        drawBear(
          Math.random() * w,
          Math.random() * h,
          0.4 + Math.random() * 0.8,
          flashAlpha * (0.5 + Math.random() * 0.5),
          Math.random() < 0.5 ? "overlay" : "soft-light",
        );
      }
    }

    // 2. Peripheral Stalker — lurks at screen edge, vanishes when looked at
    const stalkerThreshold = Math.min(w, h) * 0.35;
    const distToStalker = isMouseOut
      ? 1000
      : Math.hypot(mouse.x - stalker.x, mouse.y - stalker.y);
    if (distToStalker < stalkerThreshold) {
      stalker.alpha = Math.max(0, stalker.alpha - dt * 0.003);
      if (stalker.alpha === 0) {
        const pos = randomPeripheral();
        stalker.x = pos.x;
        stalker.y = pos.y;
      }
    } else {
      stalker.alpha = Math.min(0.08 + progress * 0.06, stalker.alpha + dt * 0.00015);
    }
    if (stalker.alpha > 0) {
      // Pulse with heartbeat
      const stalkerBeat = stalker.alpha * (1 + heartbeat * 0.4);
      drawBear(stalker.x, stalker.y, 0.75, stalkerBeat, "multiply");
    }

    // 3. Afterimage of Regret — ghost left behind after fast mouse movement
    afterimageCooldown -= dt;
    if (!isMouseOut && mouseSpeed > 40 && afterimageCooldown <= 0) {
      afterimages.push({ x: lastMouse.x, y: lastMouse.y, life: 250 });
      afterimageCooldown = 40;
      if (afterimages.length > 15) afterimages.shift();
    }
    for (let i = afterimages.length - 1; i >= 0; i--) {
      const ai = afterimages[i];
      ai.life -= dt;
      if (ai.life <= 0) {
        afterimages.splice(i, 1);
      } else {
        drawBear(ai.x, ai.y, 0.6, 0.06 * (ai.life / 250), "soft-light");
      }
    }

    // 4. Breathing Phantom — appears center-screen when mouse idle >2s
    if (!isMouseOut && mouseSpeed < 2) {
      mouseIdleTimer += dt;
    } else {
      mouseIdleTimer = 0;
    }
    if (mouseIdleTimer > 2000) {
      const breathAlpha = (Math.sin(time * 0.002) * 0.5 + 0.5) * (0.06 + progress * 0.06);
      drawBear(w / 2, h / 2, 1.2 + heartbeat * 0.15, breathAlpha, "soft-light");
    }

    // 5. Glitch of Mortality — horizontal slit clipping, synced to heartbeat
    const glitchChance = 0.004 + pFast() * 0.1;
    if (Math.random() < glitchChance) glitchTimer = 80;
    if (glitchTimer > 0) {
      glitchTimer -= dt;
      ctx.save();
      ctx.beginPath();
      for (let y = 0; y < h; y += 15) {
        if (Math.random() > 0.6) ctx.rect(0, y, w, 15);
      }
      ctx.clip();
      drawBear(
        w / 2 + (Math.random() - 0.5) * 30,
        h / 2,
        0.9,
        0.08,
        "source-over",
      );
      ctx.restore();
    }

    // 6. Delayed Haunting — ghost appears where mouse was 2-4s ago
    trailCooldown -= dt;
    if (!isMouseOut && trailCooldown <= 0) {
      delayedTrail.push({ x: mouse.x, y: mouse.y, spawnAt: time + 2000 + Math.random() * 2000 });
      trailCooldown = 300;
      if (delayedTrail.length > 10) delayedTrail.shift();
    }
    for (let i = delayedTrail.length - 1; i >= 0; i--) {
      if (time >= delayedTrail[i].spawnAt) {
        const t = delayedTrail[i];
        delayedGhosts.push({ x: t.x, y: t.y, life: 400 });
        delayedTrail.splice(i, 1);
        if (delayedGhosts.length > 8) delayedGhosts.shift();
      }
    }
    for (let i = delayedGhosts.length - 1; i >= 0; i--) {
      const dg = delayedGhosts[i];
      dg.life -= dt;
      if (dg.life <= 0) {
        delayedGhosts.splice(i, 1);
      } else {
        drawBear(dg.x, dg.y, 0.5, 0.07 * (dg.life / 400), "overlay");
      }
    }

    lastMouse.x = mouse.x;
    lastMouse.y = mouse.y;
  };
}

// === Layer 3: Severed Lifelines (organic blood threads flowing down) ===
function createMeshLayer(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const lineCount = 22;
  const segments = 16;
  const lines = Array.from({ length: lineCount }, () => ({
    baseX: Math.random() * w,
    phase: Math.random() * Math.PI * 2,
    speed: 0.0006 + Math.random() * 0.0006,
    hue: DEATH_HUES[Math.floor(Math.random() * DEATH_HUES.length)],
    width: 0.6 + Math.random() * 1.4,
    startT: Math.random() < 0.3 ? Math.random() * 0.3 : 0,
    endT: Math.random() < 0.3 ? 0.7 + Math.random() * 0.3 : 1,
    dashLen: 6 + Math.random() * 8,
    gapLen: 18 + Math.random() * 16,
    tilt: (Math.random() - 0.5) * 0.04,
    flowOffset: 0,
  }));

  return (time: number) => {
    ctx.clearRect(0, 0, w, h);
    ctx.lineCap = "round";
    const heartbeat = getHeartbeat(time);

    for (const line of lines) {
      // Flow synced to heartbeat
      line.flowOffset += 0.5 * (1 + heartbeat * 0.6);

      ctx.beginPath();
      let started = false;
      for (let j = 0; j <= segments; j++) {
        const t = j / segments;

        // Varied start/end — some lines don't span full screen
        if (t < line.startT || t > line.endT) continue;

        const py = (h / segments) * j;
        // Amplitude increases with progress — lines get wilder as death approaches
        const ps = pSlow();
        const amplitude = 18 + ps * 55;
        const throb = heartbeat * ps * 16;
        let px =
          line.baseX +
          line.tilt * py +
          Math.sin(time * line.speed + py * 0.008 + line.phase) * amplitude +
          Math.sin(time * line.speed * 1.7 + py * 0.015) * (6 + throb);

        // Mouse repulsion — lifelines flinch away from touch
        if (mouse.x !== -1000) {
          const dx = mouse.x - px;
          const dy = mouse.y - py;
          const distSq = dx * dx + dy * dy;
          if (distSq < 22500) {
            const dist = Math.sqrt(distSq);
            const force = Math.pow((150 - dist) / 150, 2);
            px -= (dx / (dist + 1)) * force * 55;
          }
        }

        if (!started) {
          ctx.moveTo(px, py);
          started = true;
        } else {
          ctx.lineTo(px, py);
        }
      }

      // Dashed blood flow — individual dash/gap + heartbeat-synced dramatically
      const ps = pSlow();
      ctx.setLineDash([line.dashLen, line.gapLen]);
      ctx.lineDashOffset = -line.flowOffset;
      ctx.lineWidth = line.width + heartbeat * 1.8 + ps * 2.5;
      const lifeAlpha = Math.min(0.28 + heartbeat * 0.35 + ps * 0.25, 0.92);
      const lifeSat = 55 + heartbeat * 25 + ps * 15;
      const lifeLit = Math.min(28 + heartbeat * 12, 48);
      ctx.strokeStyle = `hsla(${line.hue}, ${lifeSat}%, ${lifeLit}%, ${lifeAlpha})`;
      ctx.stroke();
    }
  };
}

// === Layer 4: Mortal Particles (vortex flow + burn on touch + blood veins) ===
function createParticleLayer(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const isMobile = w < 768;
  const count = isMobile ? 70 : 130;

  const particles = Array.from({ length: count }, () => ({
    x: Math.random() * w,
    y: Math.random() * h,
    vx: (Math.random() - 0.5) * 1.5,
    vy: (Math.random() - 0.5) * 1.5,
    size: 0.5 + Math.random() * 1.8,
    baseHue: Math.random() < 0.9
      ? DEATH_HUES[Math.floor(Math.random() * DEATH_HUES.length)]
      : 180 + Math.random() * 40,
    hueOscSpeed: 0.001 + Math.random() * 0.002,
    life: Math.random() * Math.PI * 2,
    lifeSpeed: 0.015 + Math.random() * 0.03,
    burned: false,
    burnLife: 1.0,
    charLife: 0,
  }));

  // Vortex centers for organic flow
  const vortices = [
    { x: w * 0.25, y: h * 0.3, strength: 0.03, phase: 0, speed: 0.001 },
    { x: w * 0.7, y: h * 0.6, strength: -0.025, phase: Math.PI, speed: 0.0008 },
    { x: w * 0.5, y: h * 0.85, strength: 0.02, phase: Math.PI / 2, speed: 0.001 },
  ];

  const resetParticle = (p: (typeof particles)[0]) => {
    p.x = Math.random() * w;
    p.y = Math.random() * h;
    p.vx = (Math.random() - 0.5) * 1.5;
    p.vy = (Math.random() - 0.5) * 1.5;
    p.size = 0.5 + Math.random() * 1.8;
    p.burned = false;
    p.burnLife = 1.0;
    p.charLife = 0;
  };

  let lastConnectionTime = 0;
  let cachedConnections: { ax: number; ay: number; bx: number; by: number; alpha: number }[] = [];

  return (time: number) => {
    ctx.clearRect(0, 0, w, h);
    const heartbeat = getHeartbeat(time);

    // Update vortex positions
    for (const v of vortices) {
      v.phase += v.speed;
      v.x += Math.sin(v.phase) * 0.3;
      v.y += Math.cos(v.phase * 0.7) * 0.2;
    }

    // Update particles
    for (const p of particles) {
      // Char debris phase — slowly fading remnant
      if (p.charLife > 0) {
        p.charLife -= 0.006;
        p.vx *= 0.96;
        p.vy *= 0.96;
        p.x += p.vx;
        p.y += p.vy;

        if (p.charLife <= 0 || p.x < -10 || p.x > w + 10 || p.y > h + 10) {
          resetParticle(p);
          continue;
        }

        ctx.globalCompositeOperation = "source-over";
        ctx.fillStyle = `rgba(20, 8, 8, ${p.charLife * 0.7})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 0.7, 0, Math.PI * 2);
        ctx.fill();
        continue;
      }

      // Vortex vector field
      const fieldX =
        Math.sin(p.y * 0.003 + time * 0.0004) +
        Math.cos(p.x * 0.002 - time * 0.0003);
      const fieldY =
        Math.cos(p.x * 0.003 + time * 0.0004) +
        Math.sin(p.y * 0.002 - time * 0.0003);
      p.vx += fieldX * 0.03;
      p.vy += fieldY * 0.03;

      // Vortex influence
      for (const v of vortices) {
        const dx = p.x - v.x;
        const dy = p.y - v.y;
        const distSq = dx * dx + dy * dy;
        if (distSq < 122500) {
          const dist = Math.sqrt(distSq) + 1;
          const force = v.strength / (dist * 0.008);
          p.vx += -dy * force * 0.0008;
          p.vy += dx * force * 0.0008;
        }
      }

      // Mouse attraction — touch ignites particles
      const dx = mouse.x - p.x;
      const dy = mouse.y - p.y;
      const distSq = dx * dx + dy * dy;
      if (distSq < 122500 && distSq > 100) {
        const dist = Math.sqrt(distSq);
        const force = (350 - dist) / 350;
        p.vx += (dx / dist) * force * 0.3;
        p.vy += (dy / dist) * force * 0.3;

        // Burn on close proximity
        if (dist < 80 && !p.burned) {
          p.burned = true;
          p.vy += 1.0;
          p.size *= 1.6;
        }
      }

      // Burn decay → char debris transition
      if (p.burned) {
        p.burnLife -= 0.008;
        if (p.burnLife <= 0) {
          p.burned = false;
          p.charLife = 0.6;
          p.vx *= 0.2;
          p.vy *= 0.2;
          continue;
        }
      }

      p.vx *= 0.94;
      p.vy *= 0.94;
      p.x += p.vx;
      p.y += p.vy;
      p.life += p.lifeSpeed;

      if (p.x < -10 || p.x > w + 10 || p.y < -10 || p.y > h + 10) {
        resetParticle(p);
        continue;
      }

      // Draw particle — heartbeat boosts alpha
      const pulse = 0.5 + Math.sin(p.life) * 0.5;
      ctx.globalCompositeOperation = "screen";

      if (p.burned) {
        if (p.burnLife > 0.6) {
          ctx.fillStyle = `rgba(255, 50, 30, ${p.burnLife})`;
        } else {
          // Dying ember — floats upward
          p.vy -= 0.04;
          ctx.fillStyle = `rgba(255, 80, 40, ${p.burnLife * 0.8})`;
        }
      } else {
        const ps = pSlow();
        const alphaBase = Math.min(0.4 + pulse * 0.3 + heartbeat * 0.3 + ps * 0.15, 0.95);
        const pSat = 60 + heartbeat * 25 + ps * 15;
        const pLit = Math.min(45 + heartbeat * 10, 62);
        const pHue = p.baseHue + Math.sin(time * p.hueOscSpeed) * 12;
        ctx.fillStyle = `hsla(${pHue}, ${pSat}%, ${pLit}%, ${alphaBase})`;
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (0.6 + pulse * 0.4), 0, Math.PI * 2);
      ctx.fill();
    }

    // Blood vein connections — compute every 30ms, draw cached every frame
    const veinInterval = isMobile ? 50 : 30;
    if (time - lastConnectionTime > veinInterval) {
      lastConnectionTime = time;
      cachedConnections = [];
      const maxCheck = Math.min(particles.length, 70);
      for (let i = 0; i < maxCheck; i++) {
        const a = particles[i];
        if (a.burned || a.charLife > 0) continue;
        for (let j = i + 1; j < maxCheck; j++) {
          const b = particles[j];
          if (b.burned || b.charLife > 0) continue;
          const ddx = a.x - b.x;
          const ddy = a.y - b.y;
          if (Math.abs(ddx) > 100 || Math.abs(ddy) > 100) continue;
          const distSq = ddx * ddx + ddy * ddy;
          if (distSq < 10000) {
            const d = Math.sqrt(distSq);
            cachedConnections.push({
              ax: a.x, ay: a.y, bx: b.x, by: b.y,
              alpha: (1 - d / 100) * (0.18 + heartbeat * 0.15),
            });
          }
        }
      }
    }
    // Draw cached connections every frame
    if (cachedConnections.length > 0) {
      ctx.globalCompositeOperation = "screen";
      ctx.lineWidth = 0.6;
      for (const c of cachedConnections) {
        ctx.strokeStyle = `rgba(200,20,30,${c.alpha})`;
        ctx.beginPath();
        ctx.moveTo(c.ax, c.ay);
        ctx.lineTo(c.bx, c.by);
        ctx.stroke();
      }
    }
  };
}

// === Main component ===
export default function Background() {
  const blobRef = useRef<HTMLCanvasElement>(null);
  const ghostRef = useRef<HTMLCanvasElement>(null);
  const meshRef = useRef<HTMLCanvasElement>(null);
  const particleRef = useRef<HTMLCanvasElement>(null);
  const whiteoutRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const blob = blobRef.current;
    const ghost = ghostRef.current;
    const mesh = meshRef.current;
    const particle = particleRef.current;
    if (!blob || !ghost || !mesh || !particle) return;

    whiteoutElement = whiteoutRef.current;

    const canvases = [blob, ghost, mesh, particle];
    canvasElements = canvases;

    let renderBlobs: (time: number) => void;
    let renderGhosts: (time: number) => void;
    let renderMesh: (time: number) => void;
    let renderParticles: (time: number) => void;

    const setupRenderers = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      renderBlobs = createBlobLayer(blob.getContext("2d")!, width, height);
      renderGhosts = createGhostLayer(ghost.getContext("2d")!, width, height);
      renderMesh = createMeshLayer(mesh.getContext("2d")!, width, height);
      renderParticles = createParticleLayer(particle.getContext("2d")!, width, height);
    };

    const resize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio, 2);
      for (const c of canvases) {
        c.width = w * dpr;
        c.height = h * dpr;
        c.style.width = `${w}px`;
        c.style.height = `${h}px`;
        const ctx = c.getContext("2d")!;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);
      }
      setupRenderers();
    };

    resize();

    const handleMouse = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    const handleTouch = (e: TouchEvent) => {
      if (!e.touches[0]) return;
      mouse.x = e.touches[0].clientX;
      mouse.y = e.touches[0].clientY;
    };
    const handleLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
    };
    let running = false;

    const startLoop = () => {
      if (running) return;
      running = true;
      animRef.current = requestAnimationFrame(loop);
    };

    const stopLoop = () => {
      running = false;
      cancelAnimationFrame(animRef.current);
    };

    const handleVisibility = () => {
      if (document.hidden) {
        handleLeave();
        stopLoop();
      } else {
        startLoop();
      }
    };

    let lastLoopTime = 0;

    const loop = (time: number) => {
      if (!running || document.hidden) return;
      const loopDt = lastLoopTime === 0 ? 16 : Math.min(time - lastLoopTime, 32);
      lastLoopTime = time;

      // === Whiteout phase ===
      if (whiteoutActive) {
        // Advance whiteout: 0→1 over ~3 seconds
        whiteoutProgress = Math.min(1, whiteoutProgress + loopDt / 3000);

        // Phase 1 (0-0.4): Color explosion — force max heartbeat, explode colors
        // Phase 2 (0.4-0.8): White creeps in
        // Phase 3 (0.8-1.0): Full white

        // Override progress to max for heartbeat speed
        progress = 1;

        if (whiteoutRef.current) {
          if (whiteoutProgress < 0.3) {
            // Color explosion — fully opaque from frame 1 to hide Q36 content
            const flash = Math.sin(time * 0.03) * 0.5 + 0.5;
            const r = Math.round(200 + flash * 55);
            const g = Math.round(60 + Math.sin(time * 0.02) * 60);
            const b = Math.round(60 + Math.cos(time * 0.025) * 80);
            whiteoutRef.current.style.backgroundColor = `rgba(${r},${g},${b},1)`;
          } else if (whiteoutProgress < 0.7) {
            // White creeps in
            const t = (whiteoutProgress - 0.3) / 0.4;
            whiteoutRef.current.style.backgroundColor = `rgba(255,${Math.round(200 + t * 55)},${Math.round(200 + t * 55)},1)`;
          } else {
            // Full white
            whiteoutRef.current.style.backgroundColor = `rgba(255,255,255,1)`;
          }
        }

        if (whiteoutProgress >= 1) {
          // Whiteout complete — hide all canvases
          for (const c of canvases) {
            c.style.opacity = "0";
            c.style.transition = "none";
            c.style.transform = "none";
          }
          // Fire callback (setScreen("result"))
          if (whiteoutCallback) {
            const cb = whiteoutCallback;
            whiteoutCallback = null;
            cb();
          }
          // Delay whiteout fadeout — wait for QuestionScreen exit animation (0.5s)
          // to complete so kosukuma is fully gone before revealing result
          const wo = whiteoutRef.current;
          setTimeout(() => {
            if (wo) {
              wo.style.transition = "opacity 0.6s ease-out";
              wo.style.opacity = "0";
            }
          }, 600);
          whiteoutActive = false;
          running = false;
          return;
        }
      }

      // === Global heartbeat pulse — the "paper" breathes ===
      const hb = getHeartbeat(time);
      const ps = pSlow();
      // During whiteout: more violent pulsing
      const whiteoutBoost = whiteoutActive ? 1 + whiteoutProgress * 4 : 1;
      const breathIntensity = 0.012 + ps * 0.02;
      const scale = 1 + hb * breathIntensity * whiteoutBoost;
      const tx = Math.sin(time * 0.0007) * hb * (1.5 + ps * 3.5) * whiteoutBoost;
      const ty = Math.cos(time * 0.001) * hb * (1.0 + ps * 2.5) * whiteoutBoost;
      const transformStr = `scale(${scale}) translate(${tx}px, ${ty}px)`;
      for (const c of canvases) {
        c.style.transform = transformStr;
      }

      renderBlobs(time);
      renderGhosts(time);
      renderMesh(time);
      renderParticles(time);
      animRef.current = requestAnimationFrame(loop);
    };

    window.addEventListener("mousemove", handleMouse);
    window.addEventListener("touchmove", handleTouch, { passive: true });
    window.addEventListener("blur", handleLeave);
    document.addEventListener("visibilitychange", handleVisibility);
    document.addEventListener("pointerleave", handleLeave);
    window.addEventListener("touchend", handleLeave);
    window.addEventListener("touchcancel", handleLeave);
    window.addEventListener("resize", resize);

    startLoop();

    return () => {
      stopLoop();
      whiteoutElement = null;
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouse);
      window.removeEventListener("touchmove", handleTouch);
      window.removeEventListener("blur", handleLeave);
      document.removeEventListener("visibilitychange", handleVisibility);
      document.removeEventListener("pointerleave", handleLeave);
      window.removeEventListener("touchend", handleLeave);
      window.removeEventListener("touchcancel", handleLeave);
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
      <canvas ref={blobRef} style={{ ...canvasStyle, zIndex: 0 }} />
      <canvas ref={ghostRef} style={{ ...canvasStyle, zIndex: 1 }} />
      <canvas ref={meshRef} style={{ ...canvasStyle, zIndex: 2 }} />
      <canvas ref={particleRef} style={{ ...canvasStyle, zIndex: 3 }} />
      <div
        ref={whiteoutRef}
        style={{
          ...canvasStyle,
          zIndex: 50,
          backgroundColor: "rgba(255,255,255,0)",
          transition: "none",
        }}
      />
    </>
  );
}
