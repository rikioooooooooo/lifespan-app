"use client";

import { useState, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { questions, categories } from "@/data/questions";
import type { BasicInfo, Answers } from "@/lib/calculator";
import KosukumaSvg from "./KosukumaSvg";

interface Props {
  basicInfo: BasicInfo;
  onComplete: (answers: Answers) => void;
}

const SCALE_STEPS = 7; // 0〜6
const BUTTON_SIZE = 38; // uniform size for all scale buttons

export default function QuestionScreen({ basicInfo, onComplete }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [sleepValue, setSleepValue] = useState(7);
  const [direction, setDirection] = useState(1);
  const transitioning = useRef(false);

  const total = questions.length;
  const safeIndex = Math.min(currentIndex, total - 1);
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
        setTimeout(() => {
          setCurrentIndex((i) => Math.min(i + 1, total - 1));
          transitioning.current = false;
        }, 400);
      } else {
        onComplete(newAnswers);
      }
    },
    [answers, question, currentIndex, total, onComplete]
  );

  const handleBack = useCallback(() => {
    if (currentIndex > 0) {
      setDirection(-1);
      setCurrentIndex((i) => i - 1);
    }
  }, [currentIndex]);

  const handleSleepSubmit = useCallback(() => {
    handleAnswer(sleepValue);
  }, [handleAnswer, sleepValue]);

  const variants = {
    enter: (dir: number) => ({ x: dir > 0 ? 50 : -50, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -50 : 50, opacity: 0 }),
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col min-h-screen px-5"
    >
      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 z-20 h-[3px]" style={{ backgroundColor: "rgba(255,255,255,0.05)" }}>
        <motion.div
          className="h-full"
          style={{ backgroundColor: "rgba(255,255,255,0.3)" }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </div>

      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-20 flex items-center justify-between px-5 pt-5">
        {currentIndex > 0 ? (
          <button
            onClick={handleBack}
            className="cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center -ml-2"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 18L9 12L15 6" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        ) : <div />}
        <span
          className="font-[family-name:var(--font-mono)] text-[11px] tracking-[0.15em]"
          style={{ color: "rgba(255,255,255,0.2)" }}
        >
          {String(safeIndex + 1).padStart(2, "0")} / {total}
        </span>
      </div>

      {/* Content area — vertically centered as a group */}
      <div className="flex-1 flex flex-col items-center justify-center">
        {/* Category + emoji */}
        <div className="pb-2 text-center">
          <span className="text-lg">{currentCategory?.emoji}</span>
          <span
            className="ml-2 font-[family-name:var(--font-mono)] text-[10px] tracking-[0.3em] uppercase align-middle"
            style={{ color: "rgba(255,255,255,0.2)" }}
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
            transition={{ duration: 0.25, ease: "easeInOut" }}
            onAnimationComplete={() => { transitioning.current = false; }}
            className="w-full max-w-sm text-center"
          >
            <p
              className="text-base font-light leading-relaxed tracking-wide mb-10"
              style={{ color: "rgba(255,255,255,0.85)" }}
            >
              {question.text}
            </p>

            {/* Scale UI */}
            {question.type === "scale" && (
              <div className="flex flex-col items-center gap-5">
                {/* Scale labels */}
                <div className="flex justify-between w-full px-3">
                  <span className="text-[10px] max-w-[70px] text-left" style={{ color: "rgba(255,255,255,0.25)" }}>
                    {question.lowLabel}
                  </span>
                  <span className="text-[10px] max-w-[70px] text-right" style={{ color: "rgba(255,255,255,0.25)" }}>
                    {question.highLabel}
                  </span>
                </div>

                {/* 7 buttons — uniform size */}
                <div className="flex gap-3 justify-center">
                  {Array.from({ length: SCALE_STEPS }, (_, i) => {
                    const isSelected = answers[question.id] === i;
                    return (
                      <motion.button
                        key={i}
                        whileTap={{ scale: 0.85 }}
                        onClick={() => handleAnswer(i)}
                        className="relative rounded-full border transition-all duration-200 cursor-pointer flex items-center justify-center"
                        style={{
                          width: BUTTON_SIZE,
                          height: BUTTON_SIZE,
                          borderColor: isSelected
                            ? "rgba(255,255,255,0.6)"
                            : "rgba(255,255,255,0.15)",
                          backgroundColor: isSelected
                            ? "rgba(255,255,255,0.12)"
                            : "transparent",
                        }}
                      >
                        {isSelected && (
                          <motion.div
                            layoutId="scale-dot"
                            className="rounded-full"
                            style={{
                              width: BUTTON_SIZE * 0.4,
                              height: BUTTON_SIZE * 0.4,
                              backgroundColor: "rgba(255,255,255,0.7)",
                            }}
                          />
                        )}
                      </motion.button>
                    );
                  })}
                </div>

                {/* Numeric hint */}
                <div className="flex gap-3 justify-center">
                  {Array.from({ length: SCALE_STEPS }, (_, i) => (
                    <div
                      key={i}
                      className="text-center font-[family-name:var(--font-mono)]"
                      style={{
                        width: BUTTON_SIZE,
                        fontSize: 8,
                        color: answers[question.id] === i ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.1)",
                      }}
                    >
                      {i + 1}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sleep UI */}
            {question.type === "sleep" && (
              <div className="flex flex-col items-center gap-6">
                <div className="flex items-end gap-2">
                  <span
                    className="font-[family-name:var(--font-mono)] text-4xl font-light"
                    style={{ color: "rgba(255,255,255,0.85)" }}
                  >
                    {sleepValue}
                  </span>
                  <span className="text-sm mb-1" style={{ color: "rgba(255,255,255,0.3)" }}>
                    時間
                  </span>
                </div>

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
                  <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.15)" }}>3h</span>
                  <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.15)" }}>12h</span>
                </div>

                <button
                  onClick={handleSleepSubmit}
                  className="mt-2 px-10 py-3 border transition-all duration-300 cursor-pointer hover:bg-white/5"
                  style={{ borderColor: "rgba(255,255,255,0.2)", borderRadius: "2px" }}
                >
                  <span
                    className="font-[family-name:var(--font-mono)] text-xs tracking-[0.3em] uppercase"
                    style={{ color: "rgba(255,255,255,0.5)" }}
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
