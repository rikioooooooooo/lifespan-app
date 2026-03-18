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

type RevealStage = "loading" | "lifespan" | "healthy" | "awake" | "detail";
type CountdownMode = "lifespan" | "healthy" | "awake";

const BLACK = "#000000";
const RED = "#dc1414";
const BLACK_SUB = "rgba(0,0,0,0.7)";

function CountdownTimer({
  seconds: initialSeconds,
  label,
  large = false,
}: {
  seconds: number;
  label: string;
  large?: boolean;
}) {
  const [currentSeconds, setCurrentSeconds] = useState(initialSeconds);
  const endTimeRef = useRef(Date.now() + initialSeconds * 1000);

  useEffect(() => {
    setCurrentSeconds(initialSeconds);
    endTimeRef.current = Date.now() + initialSeconds * 1000;
  }, [initialSeconds]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSeconds(Math.max(0, Math.floor((endTimeRef.current - Date.now()) / 1000)));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="text-center">
      <p
        className="text-[clamp(10px,1.2vw,14px)] tracking-[0.25em] uppercase mb-4 font-[family-name:var(--font-mono)]"
        style={{ color: BLACK_SUB }}
      >
        {label}
      </p>
      <motion.span
        key={currentSeconds}
        initial={{ opacity: 0.7 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15 }}
        className={`font-[family-name:var(--font-mono)] font-light tabular-nums countdown-flicker ${
          large ? "text-[clamp(2rem,6vw,4.5rem)]" : "text-[clamp(1.6rem,5vw,3.5rem)]"
        }`}
        style={{ color: RED }}
      >
        {currentSeconds.toLocaleString()}
      </motion.span>
      <p
        className="text-[clamp(10px,1.1vw,14px)] mt-2 tracking-[0.2em] font-[family-name:var(--font-mono)]"
        style={{ color: BLACK_SUB }}
      >
        SECONDS
      </p>
    </div>
  );
}

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

export default function ResultScreen({ result, onRestart }: Props) {
  const [stage, setStage] = useState<RevealStage>("loading");
  const [countdownMode, setCountdownMode] = useState<CountdownMode>("lifespan");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const timers = [
      setTimeout(() => setStage("lifespan"), 3000),
      setTimeout(() => setStage("healthy"), 8000),
      setTimeout(() => setStage("awake"), 13000),
      setTimeout(() => setStage("detail"), 18000),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

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
      className="flex flex-col items-center min-h-screen px-6 py-12"
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
            skip →
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
                  ANALYZING
                </p>
              </motion.div>
              <EKGLine />
            </div>
          </motion.div>
        )}

        {/* Stage 1: Estimated Lifespan */}
        {stage === "lifespan" && (
          <motion.div
            key="lifespan"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2 }}
            className="flex-1 flex flex-col items-center justify-center"
          >
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="text-[clamp(14px,1.8vw,20px)] mb-10 tracking-wide"
              style={{ color: BLACK }}
            >
              あなたの推定寿命
            </motion.p>
            <motion.p
              initial={{ opacity: 0, scale: 0.5, filter: "blur(10px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              transition={{ delay: 1, duration: 1.5, ease: "easeOut" }}
              className="font-[family-name:var(--font-mono)] text-[clamp(4rem,14vw,9rem)] font-light"
              style={{ color: RED }}
            >
              {result.estimatedLifespan}
            </motion.p>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2 }}
              className="mt-3 text-[clamp(18px,2.5vw,28px)]"
              style={{ color: RED }}
            >
              歳
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2.8, duration: 0.8 }}
              className="mt-12"
            >
              <CountdownTimer seconds={result.remainingSeconds} label="残り時間" />
            </motion.div>
          </motion.div>
        )}

        {/* Stage 2: Healthy Lifespan */}
        {stage === "healthy" && (
          <motion.div
            key="healthy"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2 }}
            className="flex-1 flex flex-col items-center justify-center"
          >
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="text-[clamp(14px,1.8vw,20px)] mb-10 tracking-wide"
              style={{ color: BLACK }}
            >
              健康寿命
            </motion.p>
            <motion.p
              initial={{ opacity: 0, scale: 0.5, filter: "blur(10px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              transition={{ delay: 1, duration: 1.5, ease: "easeOut" }}
              className="font-[family-name:var(--font-mono)] text-[clamp(4rem,14vw,9rem)] font-light"
              style={{ color: RED }}
            >
              {result.healthyLifespan}
            </motion.p>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2 }}
              className="mt-3 text-[clamp(18px,2.5vw,28px)]"
              style={{ color: RED }}
            >
              歳
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2.8, duration: 0.8 }}
              className="mt-12"
            >
              <CountdownTimer seconds={result.remainingHealthySeconds} label="健康でいられる時間" />
            </motion.div>
          </motion.div>
        )}

        {/* Stage 3: Awake Lifespan */}
        {stage === "awake" && (
          <motion.div
            key="awake"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2 }}
            className="flex-1 flex flex-col items-center justify-center"
          >
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="text-[clamp(14px,1.8vw,20px)] mb-10 tracking-wide"
              style={{ color: BLACK }}
            >
              起きていられる時間
            </motion.p>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1, duration: 1.2 }}
              className="mt-4"
            >
              <CountdownTimer seconds={result.remainingAwakeSeconds} label="睡眠を除いた残り" large />
            </motion.div>
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

            {/* Live countdown */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mb-14"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={countdownMode}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3 }}
                >
                  <CountdownTimer seconds={countdownSeconds} label={countdownLabel} large />
                </motion.div>
              </AnimatePresence>
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
                  const text = `あと${result.remainingSeconds.toLocaleString()}秒。\n推定寿命: ${result.estimatedLifespan}歳\n\nあと何秒、生きられる？`;
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
                  {copied ? "Copied!" : "Share"}
                </span>
              </button>

              <button onClick={onRestart} className="cursor-pointer active:scale-95">
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
