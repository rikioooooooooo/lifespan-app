"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export type KosukumaAnimation = "dance" | "gorogoro" | "kaikai" | "osirihurihuri" | "utouto" | "random";

const ANIM_NAMES = ["dance", "gorogoro", "kaikai", "osirihurihuri", "utouto"] as const;
type SingleAnimation = (typeof ANIM_NAMES)[number];

const ANIMATION_META: Record<SingleAnimation, { count: number; prefix: string }> = {
  dance:          { count: 49, prefix: "dance" },
  gorogoro:       { count: 61, prefix: "gorogoro" },
  kaikai:         { count: 57, prefix: "kaikai" },
  osirihurihuri:  { count: 32, prefix: "osirihurihuri" },
  utouto:         { count: 48, prefix: "utouto" },
};

// Next.js basePath support — resolved at runtime
function getBasePath(): string {
  return process.env.NEXT_PUBLIC_BASE_PATH ?? "";
}

function buildFrames(anim: SingleAnimation): string[] {
  const { count, prefix } = ANIMATION_META[anim];
  const base = getBasePath();
  return Array.from(
    { length: count },
    (_, i) => `${base}/kosukuma/${prefix}/${prefix}_${String(i + 1).padStart(3, "0")}.png`,
  );
}

function getStaticSrc(): string {
  return `${getBasePath()}/kosukuma/static.png`;
}

const FRAME_CACHE: Partial<Record<SingleAnimation, string[]>> = {};
function getFrames(anim: SingleAnimation): string[] {
  return (FRAME_CACHE[anim] ??= buildFrames(anim));
}

const preloaded = new Set<string>();
function preloadAnimation(anim: SingleAnimation): void {
  if (preloaded.has(anim)) return;
  preloaded.add(anim);
  for (const src of getFrames(anim)) {
    const img = new Image();
    img.src = src;
  }
}

function pickRandom(exclude?: SingleAnimation): SingleAnimation {
  const candidates = exclude ? ANIM_NAMES.filter((a) => a !== exclude) : [...ANIM_NAMES];
  return candidates[Math.floor(Math.random() * candidates.length)];
}

const FPS = 24;
const FRAME_INTERVAL = Math.round(1000 / FPS);

interface Props {
  size?: number;
  className?: string;
  animate?: boolean;
  animation?: KosukumaAnimation;
}

export default function KosukumaAnimated({
  size = 36,
  className = "",
  animate = true,
  animation = "random",
}: Props) {
  const isRandom = animation === "random";
  const resolvedAnim = isRandom ? undefined : (animation as SingleAnimation);

  const [currentAnim, setCurrentAnim] = useState<SingleAnimation>(
    resolvedAnim ?? pickRandom(),
  );
  const [frame, setFrame] = useState(0);
  const [ready, setReady] = useState(false);
  const currentAnimRef = useRef(currentAnim);
  currentAnimRef.current = currentAnim;

  const frames = getFrames(currentAnim);

  useEffect(() => {
    if (resolvedAnim) {
      setCurrentAnim(resolvedAnim);
      setFrame(0);
    }
  }, [resolvedAnim]);

  useEffect(() => {
    if (!animate) return;
    preloadAnimation(currentAnim);
    const firstImg = new Image();
    firstImg.src = frames[0];
    const onLoad = () => setReady(true);
    firstImg.onload = onLoad;
    if (firstImg.complete) setReady(true);
  }, [animate]);

  useEffect(() => {
    if (!animate) return;
    preloadAnimation(currentAnim);
  }, [currentAnim, animate]);

  const advanceFrame = useCallback(() => {
    setFrame((f) => {
      const next = f + 1;
      if (next >= getFrames(currentAnimRef.current).length) {
        if (isRandom) {
          const nextAnim = pickRandom(currentAnimRef.current);
          preloadAnimation(nextAnim);
          setCurrentAnim(nextAnim);
        }
        return 0;
      }
      return next;
    });
  }, [isRandom]);

  useEffect(() => {
    if (!animate || !ready) return;
    const id = setInterval(advanceFrame, FRAME_INTERVAL);
    return () => clearInterval(id);
  }, [animate, ready, advanceFrame]);

  const src = !animate ? getStaticSrc() : frames[frame];
  const hidden = animate && !ready;

  return (
    <img
      className={className}
      src={hidden ? undefined : src}
      alt="こすくまくん"
      width={size}
      height={size}
      style={{ objectFit: "contain", opacity: hidden ? 0 : 1 }}
    />
  );
}
