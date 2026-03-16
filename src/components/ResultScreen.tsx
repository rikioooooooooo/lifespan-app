"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { LifespanResult } from "@/lib/calculator";
import { formatSeconds } from "@/lib/calculator";
import CategoryBreakdown from "@/components/CategoryBreakdown";
import KosukumaSvg from "./KosukumaSvg";

interface Props {
  result: LifespanResult;
  onRestart: () => void;
}

type RevealStage = "loading" | "lifespan" | "healthy" | "awake" | "detail";

function CountdownTimer({ seconds: initialSeconds, label }: { seconds: number; label: string }) {
  const [currentSeconds, setCurrentSeconds] = useState(initialSeconds);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSeconds((s) => Math.max(s - 1, 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const { years, days, hours, minutes, seconds } = formatSeconds(currentSeconds);

  const units = [
    { value: years, label: "年" },
    { value: days, label: "日" },
    { value: hours, label: "時" },
    { value: minutes, label: "分" },
    { value: seconds, label: "秒" },
  ];

  return (
    <div className="text-center">
      <p
        className="text-[10px] tracking-[0.25em] uppercase mb-4 font-[family-name:var(--font-mono)]"
        style={{ color: "rgba(255,255,255,0.25)" }}
      >
        {label}
      </p>
      <div className="flex items-baseline justify-center gap-1">
        {units.map((u, i) => (
          <div key={i} className="flex items-baseline">
            <span
              className="font-[family-name:var(--font-mono)] text-[clamp(1.5rem,4vw,2.8rem)] font-extralight tabular-nums"
              style={{ color: "rgba(255,255,255,0.9)" }}
            >
              {String(u.value).padStart(u.label === "年" ? 1 : 2, "0")}
            </span>
            <span
              className="text-[10px] ml-0.5 mr-2"
              style={{ color: "rgba(255,255,255,0.25)" }}
            >
              {u.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ResultScreen({ result, onRestart }: Props) {
  const [stage, setStage] = useState<RevealStage>("loading");

  useEffect(() => {
    const timers = [
      setTimeout(() => setStage("lifespan"), 2000),
      setTimeout(() => setStage("healthy"), 5000),
      setTimeout(() => setStage("awake"), 8000),
      setTimeout(() => setStage("detail"), 11000),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  const skipToDetail = useCallback(() => {
    setStage("detail");
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
      className="flex flex-col items-center min-h-screen px-6 py-12"
    >
      {/* Skip button during reveal */}
      {stage !== "detail" && stage !== "loading" && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={skipToDetail}
          className="fixed bottom-8 z-20 cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
        >
          <span className="text-[10px] tracking-[0.2em]" style={{ color: "rgba(255,255,255,0.2)" }}>
            skip →
          </span>
        </motion.button>
      )}

      <AnimatePresence mode="wait">
        {/* Loading */}
        {stage === "loading" && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="flex-1 flex items-center justify-center"
          >
            <div className="text-center flex flex-col items-center gap-6">
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              >
                <KosukumaSvg size={80} mood="thinking" />
              </motion.div>
              <motion.div
                animate={{ opacity: [0.2, 0.6, 0.2] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <p
                  className="font-[family-name:var(--font-mono)] text-xs tracking-[0.3em]"
                  style={{ color: "rgba(255,255,255,0.3)" }}
                >
                  CALCULATING
                </p>
              </motion.div>
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
            transition={{ duration: 0.8 }}
            className="flex-1 flex flex-col items-center justify-center"
          >
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-sm mb-8 tracking-wide"
              style={{ color: "rgba(255,255,255,0.4)" }}
            >
              あなたの推定寿命
            </motion.p>
            <motion.p
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="font-[family-name:var(--font-mono)] text-6xl font-extralight"
              style={{ color: "rgba(255,255,255,0.9)" }}
            >
              {result.estimatedLifespan}
            </motion.p>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="mt-2 text-sm"
              style={{ color: "rgba(255,255,255,0.25)" }}
            >
              歳
            </motion.p>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5 }}
              className="mt-10"
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
            transition={{ duration: 0.8 }}
            className="flex-1 flex flex-col items-center justify-center"
          >
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-sm mb-8 tracking-wide"
              style={{ color: "rgba(255,255,255,0.4)" }}
            >
              健康寿命
            </motion.p>
            <motion.p
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="font-[family-name:var(--font-mono)] text-6xl font-extralight"
              style={{ color: "rgba(255,255,255,0.9)" }}
            >
              {result.healthyLifespan}
            </motion.p>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="mt-2 text-sm"
              style={{ color: "rgba(255,255,255,0.25)" }}
            >
              歳
            </motion.p>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5 }}
              className="mt-10"
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
            transition={{ duration: 0.8 }}
            className="flex-1 flex flex-col items-center justify-center"
          >
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-sm mb-8 tracking-wide"
              style={{ color: "rgba(255,255,255,0.4)" }}
            >
              睡眠を除いた残り時間
            </motion.p>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="mt-4"
            >
              <CountdownTimer seconds={result.remainingAwakeSeconds} label="起きていられる時間" />
            </motion.div>
          </motion.div>
        )}

        {/* Stage 4: Full Detail */}
        {stage === "detail" && (
          <motion.div
            key="detail"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="w-full max-w-lg mx-auto pt-8"
          >
            {/* Kosukuma reaction */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="flex justify-center mb-6"
            >
              <KosukumaSvg size={72} mood={result.totalImpact >= 0 ? "happy" : "surprised"} />
            </motion.div>

            {/* Summary numbers */}
            <div className="grid grid-cols-3 gap-4 mb-12">
              {[
                { label: "推定寿命", value: `${result.estimatedLifespan}歳` },
                { label: "健康寿命", value: `${result.healthyLifespan}歳` },
                { label: "起床寿命", value: `${result.awakeLifespan}歳` },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.15 }}
                  className="text-center"
                >
                  <p className="text-[9px] tracking-[0.2em] mb-2" style={{ color: "rgba(255,255,255,0.2)" }}>
                    {item.label}
                  </p>
                  <p
                    className="font-[family-name:var(--font-mono)] text-xl font-extralight"
                    style={{ color: "rgba(255,255,255,0.8)" }}
                  >
                    {item.value}
                  </p>
                </motion.div>
              ))}
            </div>

            {/* Live countdown */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mb-14"
            >
              <CountdownTimer seconds={result.remainingSeconds} label="あなたの残り時間" />
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
              style={{ borderColor: "rgba(255,255,255,0.06)" }}
            >
              <p className="text-[10px] tracking-[0.2em] mb-2" style={{ color: "rgba(255,255,255,0.2)" }}>
                総合影響
              </p>
              <p
                className="font-[family-name:var(--font-mono)] text-2xl font-extralight"
                style={{
                  color: result.totalImpact >= 0 ? "rgba(130,220,180,0.8)" : "rgba(220,130,130,0.8)",
                }}
              >
                {result.totalImpact >= 0 ? "+" : ""}
                {result.totalImpact.toFixed(1)}年
              </p>
              <p className="text-[10px] mt-2" style={{ color: "rgba(255,255,255,0.15)" }}>
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
              {/* Share */}
              <button
                onClick={() => {
                  const text = `あと${formatSeconds(result.remainingSeconds).years}年${formatSeconds(result.remainingSeconds).days}日。\n推定寿命: ${result.estimatedLifespan}歳\n\nあと何秒、生きられる？`;
                  if (navigator.share) {
                    navigator.share({ title: "あと何秒、生きられる？", text });
                  } else {
                    navigator.clipboard.writeText(text);
                  }
                }}
                className="px-10 py-3 border transition-all duration-300 cursor-pointer hover:bg-white/5"
                style={{ borderColor: "rgba(255,255,255,0.2)", borderRadius: "2px" }}
              >
                <span
                  className="font-[family-name:var(--font-mono)] text-xs tracking-[0.3em] uppercase"
                  style={{ color: "rgba(255,255,255,0.5)" }}
                >
                  Share
                </span>
              </button>

              {/* Restart */}
              <button
                onClick={onRestart}
                className="cursor-pointer"
              >
                <span className="text-[10px] tracking-[0.15em]" style={{ color: "rgba(255,255,255,0.15)" }}>
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
