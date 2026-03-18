"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { questions, categories } from "@/data/questions";
import type { BasicInfo, Answers } from "@/lib/calculator";
import KosukumaSvg from "./KosukumaSvg";
import { setBackgroundProgress } from "./Background";

interface Props {
  basicInfo: BasicInfo;
  onComplete: (answers: Answers) => void;
}

const SCALE_STEPS = 7;
const BUTTON_SIZE = 40;

// Color gradient for scale buttons: maps position to color based on question direction
function getScaleColor(index: number, dir: 1 | -1, isSelected: boolean) {
  if (!isSelected) return { border: "rgba(255,255,255,0.3)", bg: "transparent", dot: "rgba(255,255,255,0.7)" };

  // For dir=1 (positive): left=bad(red), right=good(green-white)
  // For dir=-1 (negative): left=good, right=bad(red)
  const t = index / (SCALE_STEPS - 1);
  const danger = dir === 1 ? 1 - t : t;

  const r = Math.round(255);
  const g = Math.round(40 + (1 - danger) * 215);
  const b = Math.round(40 + (1 - danger) * 215);
  const alpha = 0.5 + danger * 0.3;

  return {
    border: `rgba(${r},${g},${b},${alpha})`,
    bg: `rgba(${r},${g},${b},${0.06 + danger * 0.06})`,
    dot: `rgba(${r},${g},${b},${0.7 + danger * 0.2})`,
  };
}

export default function QuestionScreen({ basicInfo, onComplete }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [sleepValue, setSleepValue] = useState(7);
  const [direction, setDirection] = useState(1);
  const transitioning = useRef(false);
  const advanceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const total = questions.length;
  const safeIndex = Math.min(currentIndex, total - 1);

  useEffect(() => {
    return () => {
      if (advanceTimeoutRef.current) clearTimeout(advanceTimeoutRef.current);
      setBackgroundProgress(0);
    };
  }, []);

  // Sync quiz progress to background heartbeat speed
  useEffect(() => {
    setBackgroundProgress(safeIndex / total);
  }, [safeIndex, total]);
  const question = questions[safeIndex];
  const progress = ((safeIndex) / total) * 100;

  const currentCategory = useMemo(() => {
    return categories.find(c => c.id === question.category);
  }, [question.category]);

  const kosukumaMood = useMemo(() => {
    if (currentIndex === 0) return "neutral" as const;
    const lastAnswer = answers[questions[currentIndex - 1]?.id];
    if (lastAnswer === undefined) return "neutral" as const;
    const lastQ = questions[currentIndex - 1];
    if (lastQ.type === "sleep") return "neutral" as const;
    const normalized = lastAnswer / (SCALE_STEPS - 1);
    const effective = lastQ.dir === 1 ? normalized : 1 - normalized;
    if (effective > 0.6) return "happy" as const;
    if (effective < 0.3) return "thinking" as const;
    return "neutral" as const;
  }, [currentIndex, answers]);

  const handleAnswer = useCallback(
    (value: number) => {
      if (transitioning.current) return;
      transitioning.current = true;

      const newAnswers = { ...answers, [question.id]: value };
      setAnswers(newAnswers);

      if (currentIndex < total - 1) {
        setDirection(1);
        advanceTimeoutRef.current = setTimeout(() => {
          setCurrentIndex((i) => Math.min(i + 1, total - 1));
          transitioning.current = false;
        }, 280);
        // Safety: force-unlock after 1s in case animation gets stuck
        setTimeout(() => { transitioning.current = false; }, 1000);
      } else {
        // Q36 — trigger result transition
        transitioning.current = false;
        onComplete(newAnswers);
      }
    },
    [answers, question, currentIndex, total, onComplete]
  );

  const handleBack = useCallback(() => {
    if (advanceTimeoutRef.current) {
      clearTimeout(advanceTimeoutRef.current);
      advanceTimeoutRef.current = null;
    }
    transitioning.current = false;
    if (currentIndex > 0) {
      setDirection(-1);
      setCurrentIndex((i) => i - 1);
    }
  }, [currentIndex]);

  const handleSleepSubmit = useCallback(() => {
    handleAnswer(sleepValue);
  }, [handleAnswer, sleepValue]);

  const variants = {
    enter: (dir: number) => ({ x: dir > 0 ? 50 : -50, opacity: 0, pointerEvents: "none" as const }),
    center: { x: 0, opacity: 1, pointerEvents: "auto" as const },
    exit: (dir: number) => ({ x: dir > 0 ? -50 : 50, opacity: 0, pointerEvents: "none" as const }),
  };

  // Progress bar color shifts from white to red as you approach the end
  const progressColor = `rgba(255,${Math.max(0, Math.round(255 - progress * 2.2))},${Math.max(0, Math.round(255 - progress * 2.4))},${0.35 + progress * 0.003})`;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col h-dvh px-5 pb-8 overflow-hidden"
    >

      {/* Progress gauge — fills up as questions are answered */}
      <div className="fixed top-0 left-0 right-0 z-20">
        <div className="h-[6px] w-full" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
          <motion.div
            className="h-full"
            style={{
              backgroundColor: progressColor,
              boxShadow: `0 0 8px ${progressColor}`,
            }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        </div>
        <div className="flex justify-end px-3 mt-1">
          <span
            className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.1em]"
            style={{ color: "rgba(255,255,255,0.5)" }}
          >
            {Math.round(progress)}%
          </span>
        </div>
      </div>

      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-20 flex items-center justify-between px-5 pt-5">
        {currentIndex > 0 ? (
          <button
            onClick={handleBack}
            aria-label="前の質問に戻る"
            className="cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center -ml-2 transition-opacity duration-200 hover:opacity-80"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 18L9 12L15 6" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        ) : <div />}
        <span
          className="font-[family-name:var(--font-mono)] text-[11px] tracking-[0.15em]"
          style={{ color: "rgba(255,255,255,0.55)" }}
        >
          {String(safeIndex + 1).padStart(2, "0")} / {total}
        </span>
      </div>

      {/* Content area */}
      <div className="flex-1 flex flex-col items-center justify-center">
        {/* Category + emoji with red halo for negative questions */}
        <div className="pb-2 text-center">
          <span
            className="text-xl"
            style={{
              filter: "none",
            }}
          >
            {currentCategory?.emoji}
          </span>
          <span
            className="ml-2 font-[family-name:var(--font-mono)] text-xs tracking-[0.25em] uppercase align-middle"
            style={{ color: "rgba(255,255,255,0.6)" }}
          >
            {question.category}
          </span>
        </div>

        {/* Kosukuma */}
        <div className="flex justify-center mt-2 mb-6">
          <motion.div
            key={kosukumaMood}
            initial={{ scale: 0.9, opacity: 0.5 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <KosukumaSvg size={80} mood={kosukumaMood} />
          </motion.div>
        </div>

        {/* Question + answers */}
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={question.id}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.18, ease: "easeInOut" }}
            onAnimationComplete={() => { transitioning.current = false; }}
            className="w-full max-w-sm text-center"
          >
            <p
              className="text-base font-light leading-relaxed tracking-wide mb-10"
              style={{
                color: "rgba(255,255,255,0.85)",
              }}
            >
              {question.text}
            </p>

            {/* Scale UI — death gradient buttons */}
            {question.type === "scale" && (
              <div className="flex flex-col items-center gap-5">
                {/* Scale labels */}
                <div className="flex justify-between w-full px-3">
                  <span className="text-[10px] max-w-[70px] text-left" style={{
                    color: "rgba(255,255,255,0.55)",
                  }}>
                    {question.lowLabel}
                  </span>
                  <span className="text-[10px] max-w-[70px] text-right" style={{
                    color: "rgba(255,255,255,0.55)",
                  }}>
                    {question.highLabel}
                  </span>
                </div>

                {/* 7 buttons — death gradient coloring */}
                <div className="flex gap-2 justify-center">
                  {Array.from({ length: SCALE_STEPS }, (_, i) => {
                    const isSelected = answers[question.id] === i;
                    const colors = getScaleColor(i, question.dir, isSelected);
                    return (
                      <motion.button
                        key={i}
                        whileTap={{ scale: 0.85 }}
                        onClick={() => handleAnswer(i)}
                        className="relative rounded-full border transition-all duration-200 cursor-pointer flex items-center justify-center scale-btn"
                        style={{
                          width: BUTTON_SIZE,
                          height: BUTTON_SIZE,
                          borderColor: isSelected ? colors.border : "rgba(255,255,255,0.3)",
                          backgroundColor: isSelected ? colors.bg : "transparent",
                          boxShadow: isSelected ? `0 0 10px ${colors.bg}` : "none",
                        }}
                      >
                        {isSelected && (
                          <motion.div
                            layoutId="scale-dot"
                            className="rounded-full"
                            style={{
                              width: BUTTON_SIZE * 0.4,
                              height: BUTTON_SIZE * 0.4,
                              backgroundColor: colors.dot,
                            }}
                          />
                        )}
                      </motion.button>
                    );
                  })}
                </div>

                {/* Numeric hint */}
                <div className="flex gap-2 justify-center">
                  {Array.from({ length: SCALE_STEPS }, (_, i) => (
                    <div
                      key={i}
                      className="text-center font-[family-name:var(--font-mono)]"
                      style={{
                        width: BUTTON_SIZE,
                        fontSize: 8,
                        color: answers[question.id] === i ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.35)",
                      }}
                    >
                      {i + 1}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sleep UI — red-themed slider */}
            {question.type === "sleep" && (
              <div className="flex flex-col items-center gap-6">
                <div className="flex items-end gap-2">
                  <motion.span
                    key={sleepValue}
                    initial={{ scale: 1.1, opacity: 0.7 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="font-[family-name:var(--font-mono)] text-4xl font-light"
                    style={{
                      color: sleepValue < 5 || sleepValue > 10
                        ? "rgba(255,60,60,0.85)"
                        : sleepValue >= 7 && sleepValue <= 8
                          ? "rgba(255,255,255,0.85)"
                          : "rgba(255,200,200,0.85)",
                    }}
                  >
                    {sleepValue}
                  </motion.span>
                  <span className="text-sm mb-1" style={{ color: "rgba(255,255,255,0.6)" }}>
                    時間
                  </span>
                </div>

                {/* Sleep quality hint */}
                <p className="text-[9px]" style={{
                  color: sleepValue < 5 || sleepValue > 10
                    ? "rgba(255,60,60,0.3)"
                    : sleepValue >= 7 && sleepValue <= 8
                      ? "rgba(130,220,180,0.25)"
                      : "rgba(255,255,255,0.15)",
                }}>
                  {sleepValue < 5 ? "寿命が縮む睡眠時間" :
                   sleepValue > 10 ? "過度な睡眠もリスクに" :
                   sleepValue >= 7 && sleepValue <= 8 ? "理想的な睡眠時間" :
                   ""}
                </p>

                <input
                  type="range"
                  min={3}
                  max={12}
                  step={0.5}
                  value={sleepValue}
                  onChange={(e) => setSleepValue(Number(e.target.value))}
                  className="w-64 sleep-slider"
                />

                <div className="flex justify-between w-64">
                  <span className="text-[10px]" style={{ color: "rgba(255,60,60,0.2)" }}>3h</span>
                  <span className="text-[10px]" style={{ color: "rgba(255,60,60,0.2)" }}>12h</span>
                </div>

                <button
                  onClick={handleSleepSubmit}
                  className="mt-2 px-10 py-3 border transition-all duration-300 cursor-pointer hover:bg-red-900/10 active:scale-95"
                  style={{
                    borderColor: "rgba(255,40,40,0.25)",
                    borderRadius: "2px",
                    boxShadow: "0 0 12px rgba(255,20,20,0.04)",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 0 20px rgba(255,20,20,0.25), 0 0 6px rgba(255,40,40,0.15)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 0 12px rgba(255,20,20,0.04)"; }}
                >
                  <span
                    className="font-[family-name:var(--font-mono)] text-xs tracking-[0.3em] uppercase"
                    style={{ color: "rgba(255,255,255,0.75)" }}
                  >
                    Next
                  </span>
                </button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
