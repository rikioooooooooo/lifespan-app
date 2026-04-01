"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { LifespanResult } from "@/lib/calculator";
import CategoryBreakdown from "@/components/CategoryBreakdown";
import KosukumaIllustration from "./KosukumaIllustration";

interface Props {
  result: LifespanResult;
  onRestart: () => void;
}

type RevealStage = "loading" | "countdown" | "detail";
type DropPhase = "reveal" | "lifespan" | "dropping-healthy" | "healthy" | "dropping-awake" | "awake" | "done";
type CountdownMode = "lifespan" | "healthy" | "awake";

const BLACK = "#000000";
const RED = "#dc1414";
const BLACK_SUB = "rgba(0,0,0,0.7)";

// EKG SVG path
function EKGLine() {
  const pathLength = 320;
  return (
    <svg width="200" height="40" viewBox="0 0 200 40" aria-hidden="true">
      <motion.path
        d="M0,20 L30,20 L40,20 L50,5 L55,35 L60,10 L65,25 L70,20 L100,20 L110,20 L120,5 L125,35 L130,10 L135,25 L140,20 L200,20"
        fill="none"
        stroke={RED}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        style={{ pathLength: 0, strokeDasharray: pathLength, strokeDashoffset: pathLength }}
      />
    </svg>
  );
}

// Animated counter that drops from one value to another
function useDropCounter(result: LifespanResult) {
  const [displaySeconds, setDisplaySeconds] = useState(0);
  const [phase, setPhase] = useState<DropPhase>("reveal");
  const [label, setLabel] = useState("あなたの推定寿命");
  const [subLabel, setSubLabel] = useState("");
  const [age, setAge] = useState(0);
  const displayRef = useRef(0);
  const tickTimer = useRef<ReturnType<typeof setInterval>>(undefined);
  const animFrame = useRef<number>(undefined);
  const timeouts = useRef<ReturnType<typeof setTimeout>[]>([]);

  const schedule = useCallback((fn: () => void, ms: number) => {
    const id = setTimeout(fn, ms);
    timeouts.current.push(id);
    return id;
  }, []);

  const startTicking = useCallback(() => {
    if (tickTimer.current) clearInterval(tickTimer.current);
    tickTimer.current = setInterval(() => {
      displayRef.current = Math.max(0, displayRef.current - 1);
      setDisplaySeconds(displayRef.current);
    }, 1000);
  }, []);

  const stopTicking = useCallback(() => {
    if (tickTimer.current) clearInterval(tickTimer.current);
  }, []);

  const animateTo = useCallback((target: number, duration: number, onDone: () => void) => {
    const from = displayRef.current;
    const start = performance.now();

    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      // easeInOutCubic — starts slow, accelerates hard, slows at end
      const eased = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
      const val = Math.round(from + (target - from) * eased);
      displayRef.current = val;
      setDisplaySeconds(val);

      if (p < 1) {
        animFrame.current = requestAnimationFrame(tick);
      } else {
        displayRef.current = target;
        setDisplaySeconds(target);
        onDone();
      }
    };
    animFrame.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    // Phase 0: Show age for 2 seconds
    setAge(result.estimatedLifespan);
    setLabel("あなたの推定寿命");
    setPhase("reveal");

    // Phase 1: Transition to seconds counter (after 2s reveal)
    schedule(() => {
      setPhase("lifespan");
      displayRef.current = result.remainingSeconds;
      setDisplaySeconds(result.remainingSeconds);
      setSubLabel(`${result.estimatedLifespan}歳`);
      startTicking();

      // Phase 2: Drop to healthy lifespan (1秒長めに見せる)
      schedule(() => {
        stopTicking();
        setPhase("dropping-healthy");
        setLabel("健康に動ける時間は、もっと短い");
        setSubLabel("");
        animateTo(result.remainingHealthySeconds, 2500, () => {
          setPhase("healthy");
          setAge(result.healthyLifespan);
          setSubLabel(`健康寿命 ${result.healthyLifespan}歳`);
          startTicking();

          // Phase 3: Drop to awake lifespan
          schedule(() => {
            stopTicking();
            setPhase("dropping-awake");
            setLabel("睡眠を除くと、さらに減る");
            setSubLabel("");
            animateTo(result.remainingAwakeSeconds, 2500, () => {
              setPhase("awake");
              setAge(result.awakeLifespan);
              setSubLabel(`起きている時間のみ`);
              startTicking();

              schedule(() => {
                stopTicking();
                setPhase("done");
              }, 2500);
            });
          }, 3000);
        });
      }, 4500);
    }, 2000);

    return () => {
      timeouts.current.forEach(clearTimeout);
      if (tickTimer.current) clearInterval(tickTimer.current);
      if (animFrame.current) cancelAnimationFrame(animFrame.current);
    };
  }, []);

  const isDropping = phase === "dropping-healthy" || phase === "dropping-awake";

  return { displaySeconds, phase, label, subLabel, age, isDropping };
}

function CountdownTimer({
  seconds: targetSeconds,
  label,
  large = false,
}: {
  seconds: number;
  label: string;
  large?: boolean;
}) {
  const [displaySeconds, setDisplaySeconds] = useState(targetSeconds);
  const displayRef = useRef(targetSeconds);
  const endTimeRef = useRef(Date.now() + targetSeconds * 1000);
  const animFrame = useRef<number>(undefined);
  const tickTimer = useRef<ReturnType<typeof setInterval>>(undefined);
  const isAnimating = useRef(false);
  const [isDropping, setIsDropping] = useState(false);

  // When target changes (tab switch), animate to the new value
  const prevTarget = useRef(targetSeconds);
  useEffect(() => {
    if (prevTarget.current === targetSeconds) return;
    const from = displayRef.current;
    const to = targetSeconds;
    prevTarget.current = targetSeconds;

    // Stop normal ticking during animation
    if (tickTimer.current) clearInterval(tickTimer.current);
    if (animFrame.current) cancelAnimationFrame(animFrame.current);
    isAnimating.current = true;
    setIsDropping(true);

    const duration = 1200;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
      const v = Math.round(from + (to - from) * eased);
      displayRef.current = v;
      setDisplaySeconds(v);

      if (p < 1) {
        animFrame.current = requestAnimationFrame(tick);
      } else {
        displayRef.current = to;
        setDisplaySeconds(to);
        isAnimating.current = false;
        setIsDropping(false);
        // Resume normal ticking from new target
        endTimeRef.current = Date.now() + to * 1000;
        tickTimer.current = setInterval(() => {
          if (!isAnimating.current) {
            displayRef.current = Math.max(0, Math.floor((endTimeRef.current - Date.now()) / 1000));
            setDisplaySeconds(displayRef.current);
          }
        }, 1000);
      }
    };
    animFrame.current = requestAnimationFrame(tick);
  }, [targetSeconds]);

  // Normal 1s ticking
  useEffect(() => {
    endTimeRef.current = Date.now() + targetSeconds * 1000;
    displayRef.current = targetSeconds;
    setDisplaySeconds(targetSeconds);
    tickTimer.current = setInterval(() => {
      if (!isAnimating.current) {
        displayRef.current = Math.max(0, Math.floor((endTimeRef.current - Date.now()) / 1000));
        setDisplaySeconds(displayRef.current);
      }
    }, 1000);
    return () => {
      if (tickTimer.current) clearInterval(tickTimer.current);
      if (animFrame.current) cancelAnimationFrame(animFrame.current);
    };
  }, []);

  return (
    <div className="text-center">
      <AnimatePresence mode="wait">
        <motion.p
          key={label}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="text-[clamp(10px,1.2vw,14px)] tracking-[0.25em] uppercase mb-4 font-[family-name:var(--font-mono)]"
          style={{ color: BLACK_SUB }}
        >
          {label}
        </motion.p>
      </AnimatePresence>
      <span
        className={`font-[family-name:var(--font-mono)] font-light tabular-nums ${
          isDropping ? "drop-shake" : "countdown-flicker"
        } ${
          large ? "text-[clamp(2rem,6vw,4.5rem)]" : "text-[clamp(1.6rem,5vw,3.5rem)]"
        }`}
        style={{ color: RED }}
      >
        {displaySeconds.toLocaleString()}
      </span>
      <p
        className="text-[clamp(10px,1.1vw,14px)] mt-2 tracking-[0.2em] font-[family-name:var(--font-mono)]"
        style={{ color: BLACK_SUB }}
      >
        秒
      </p>
    </div>
  );
}

export default function ResultScreen({ result, onRestart }: Props) {
  const [stage, setStage] = useState<RevealStage>("loading");
  const [countdownMode, setCountdownMode] = useState<CountdownMode>("lifespan");
  const [copied, setCopied] = useState(false);
  const drop = useDropCounter(result);

  useEffect(() => {
    const t = setTimeout(() => setStage("countdown"), 3000);
    return () => clearTimeout(t);
  }, []);

  // Auto-transition to detail when drop sequence finishes
  useEffect(() => {
    if (drop.phase === "done" && stage === "countdown") {
      const t = setTimeout(() => setStage("detail"), 500);
      return () => clearTimeout(t);
    }
  }, [drop.phase, stage]);

  const skipToDetail = useCallback(() => {
    setStage("detail");
  }, []);

  const countdownSeconds =
    countdownMode === "lifespan" ? result.remainingSeconds
    : countdownMode === "healthy" ? result.remainingHealthySeconds
    : result.remainingAwakeSeconds;

  const countdownLabel =
    countdownMode === "lifespan" ? "あなたの残り時間"
    : countdownMode === "healthy" ? "健康でいられる時間"
    : "起きていられる時間";

  const lifespanTabs = [
    { key: "lifespan" as const, label: "推定寿命", value: result.estimatedLifespan },
    { key: "healthy" as const, label: "健康寿命", value: result.healthyLifespan },
    { key: "awake" as const, label: "起床寿命", value: result.awakeLifespan, sub: "睡眠を除く" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
      className="flex flex-col items-center min-h-dvh px-6 py-12"
      style={{ backgroundColor: "#ffffff" }}
    >
      {/* Skip button */}
      {stage !== "detail" && stage !== "loading" && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={skipToDetail}
          className="fixed bottom-8 z-20 cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
        >
          <span className="text-[clamp(10px,1vw,14px)] tracking-[0.2em]" style={{ color: BLACK_SUB }}>
            スキップ →
          </span>
        </motion.button>
      )}

      <AnimatePresence mode="wait">
        {/* Loading — EKG heartbeat monitor */}
        {stage === "loading" && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="flex-1 flex items-center justify-center"
          >
            <div className="text-center flex flex-col items-center gap-8">
              <motion.div
                animate={{ y: [0, -8, 0], scale: [1, 1.02, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <KosukumaIllustration size={100} />
              </motion.div>
              <motion.div
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 2.5, repeat: Infinity }}
              >
                <p
                  className="font-[family-name:var(--font-mono)] text-xs tracking-[0.4em]"
                  style={{ color: RED }}
                >
                  分析中
                </p>
              </motion.div>
              <EKGLine />
            </div>
          </motion.div>
        )}

        {/* Countdown drop sequence */}
        {stage === "countdown" && (
          <motion.div
            key="countdown"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="flex-1 flex flex-col items-center justify-center"
          >
            {/* Label */}
            <AnimatePresence mode="wait">
              <motion.p
                key={drop.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.5 }}
                className="text-[clamp(13px,1.8vw,18px)] mb-6 tracking-wide text-center"
                style={{ color: BLACK }}
              >
                {drop.label}
              </motion.p>
            </AnimatePresence>

            <AnimatePresence mode="wait">
              {/* Phase 0: Big age reveal */}
              {drop.phase === "reveal" && (
                <motion.div
                  key="reveal"
                  initial={{ opacity: 0, scale: 0.5, filter: "blur(10px)" }}
                  animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                  exit={{ opacity: 0, scale: 0.95, filter: "blur(4px)" }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                  className="text-center"
                >
                  <span
                    className="font-[family-name:var(--font-mono)] font-light text-[clamp(4rem,14vw,9rem)]"
                    style={{ color: RED }}
                  >
                    {result.estimatedLifespan}
                  </span>
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="text-[clamp(18px,2.5vw,28px)] ml-1"
                    style={{ color: RED }}
                  >
                    歳
                  </motion.span>
                </motion.div>
              )}

              {/* Phase 1+: Seconds counter that drops */}
              {drop.phase !== "reveal" && (
                <motion.div
                  key="seconds"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="text-center"
                >
                  <span
                    className={`font-[family-name:var(--font-mono)] font-light tabular-nums text-[clamp(2.2rem,7vw,5rem)] transition-all duration-150 ${
                      drop.isDropping ? "drop-shake" : "countdown-flicker"
                    }`}
                    style={{ color: RED }}
                  >
                    {Math.max(0, drop.displaySeconds).toLocaleString()}
                  </span>
                  <p
                    className="text-[clamp(10px,1.1vw,14px)] mt-2 tracking-[0.2em] font-[family-name:var(--font-mono)]"
                    style={{ color: BLACK_SUB }}
                  >
                    秒
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Sub label (age info) */}
            <div className="h-8 mt-6 flex items-center justify-center">
              <AnimatePresence mode="wait">
                {drop.subLabel && (
                  <motion.p
                    key={drop.subLabel}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className="text-[clamp(11px,1.3vw,16px)] tracking-wide font-[family-name:var(--font-mono)]"
                    style={{ color: BLACK_SUB }}
                  >
                    {drop.subLabel}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {/* Stage 4: Full Detail */}
        {stage === "detail" && (
          <motion.div
            key="detail"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
            className="w-full max-w-2xl mx-auto pt-8"
          >
            {/* Kosukuma */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, duration: 0.6 }}
              className="flex justify-center mb-6"
            >
              <KosukumaIllustration size={140} />
            </motion.div>

            {/* Clickable lifespan tabs */}
            <div className="grid grid-cols-3 gap-2 mb-10">
              {lifespanTabs.map((tab, i) => {
                const isActive = countdownMode === tab.key;
                return (
                  <motion.button
                    key={tab.key}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + i * 0.12 }}
                    onClick={() => setCountdownMode(tab.key)}
                    className="text-center cursor-pointer py-3 rounded-sm transition-all duration-300"
                    style={{
                      backgroundColor: isActive ? "rgba(220,20,20,0.05)" : "transparent",
                      border: isActive ? `1px solid ${RED}` : "1px solid rgba(0,0,0,0.1)",
                    }}
                  >
                    <p className="text-[clamp(9px,1vw,13px)] tracking-[0.15em] mb-1.5" style={{
                      color: isActive ? BLACK : BLACK_SUB,
                    }}>
                      {tab.label}
                    </p>
                    <p
                      className="font-[family-name:var(--font-mono)] text-[clamp(1.25rem,2.5vw,2rem)] font-light transition-colors duration-300"
                      style={{
                        color: isActive ? RED : "rgba(220,20,20,0.3)",
                      }}
                    >
                      {tab.value}歳
                    </p>
                    {tab.sub && (
                      <p className="text-[clamp(7px,0.8vw,11px)] mt-0.5" style={{ color: BLACK_SUB }}>
                        {tab.sub}
                      </p>
                    )}
                  </motion.button>
                );
              })}
            </div>

            {/* Live countdown — number animates on tab switch, no fade */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mb-14"
            >
              <CountdownTimer seconds={countdownSeconds} label={countdownLabel} large />
            </motion.div>

            {/* Category breakdown */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
            >
              <CategoryBreakdown categories={result.categories} />
            </motion.div>

            {/* Impact summary */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
              className="mt-10 text-center py-6 border-t border-b"
              style={{ borderColor: "rgba(0,0,0,0.1)" }}
            >
              <p className="text-[clamp(10px,1.1vw,14px)] tracking-[0.2em] mb-2" style={{ color: BLACK_SUB }}>
                総合影響
              </p>
              <p
                className="font-[family-name:var(--font-mono)] text-[clamp(1.8rem,4vw,3rem)] font-light"
                style={{
                  color: result.totalImpact >= 0 ? "#0a8a50" : RED,
                }}
              >
                {result.totalImpact >= 0 ? "+" : ""}
                {result.totalImpact.toFixed(1)}年
              </p>
              <p className="text-[clamp(10px,1.1vw,14px)] mt-2" style={{ color: BLACK_SUB }}>
                平均寿命 {result.baseLifespan}歳 からの変動
              </p>
            </motion.div>

            {/* Actions */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5 }}
              className="mt-10 flex flex-col items-center gap-4 pb-8"
            >
              <button
                onClick={() => {
                  const text = `あと${result.remainingAwakeSeconds.toLocaleString()}秒。\n起きていられる時間: ${result.awakeLifespan}歳まで\n\nあと何秒、生きられる？\n#寿命診断\nhttps://nagaikisitaiyone.kosukuma.com`;
                  if (navigator.share) {
                    navigator.share({ title: "あと何秒、生きられる？", text });
                  } else {
                    navigator.clipboard.writeText(text);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }
                }}
                className="px-10 py-3 border transition-all duration-300 cursor-pointer hover:bg-red-50 active:scale-95"
                style={{
                  borderColor: RED,
                  borderRadius: "2px",
                }}
              >
                <span
                  className="font-[family-name:var(--font-mono)] text-[clamp(12px,1.2vw,16px)] tracking-[0.3em] uppercase"
                  style={{ color: BLACK }}
                >
                  {copied ? "コピーしました" : "シェアする"}
                </span>
              </button>

              <button onClick={onRestart} className="cursor-pointer active:scale-95 min-h-[44px] min-w-[44px] flex items-center justify-center px-4">
                <span className="text-[clamp(10px,1vw,14px)] tracking-[0.15em]" style={{ color: BLACK_SUB }}>
                  もう一度やる
                </span>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
