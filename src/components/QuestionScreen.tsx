"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { questions, categories } from "@/data/questions";
import type { BasicInfo, Answers } from "@/lib/calculator";
import KosukumaAnimated from "./KosukumaAnimated";
import { setBackgroundProgress } from "./Background";

interface Props {
  basicInfo: BasicInfo;
  onComplete: (answers: Answers) => void;
}

const SCALE_STEPS = 7;
const BUTTON_SIZE = 40;

function getScaleColor(index: number, dir: 1 | -1, isSelected: boolean) {
  if (!isSelected) return { border: "rgba(255,255,255,0.3)", bg: "transparent", dot: "rgba(255,255,255,0.7)" };

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
  const [answers, setAnswers] = useState<Answers>(() => {
    const initial: Answers = {};
    for (const q of questions) {
      if (q.type === "sleep") initial[q.id] = 7;
    }
    return initial;
  });
  const [sleepValue, setSleepValue] = useState(7);
  const questionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const total = questions.length;
  const answeredCount = Object.keys(answers).length;
  const progress = (answeredCount / total) * 100;
  const allAnswered = answeredCount >= total;

  useEffect(() => {
    setBackgroundProgress(answeredCount / total);
  }, [answeredCount, total]);

  useEffect(() => {
    return () => { setBackgroundProgress(0); };
  }, []);

  // Group questions by category
  const grouped = useMemo(() => {
    const groups: { category: typeof categories[0]; questions: typeof questions }[] = [];
    for (const cat of categories) {
      const qs = questions.filter(q => q.category === cat.id);
      if (qs.length > 0) groups.push({ category: cat, questions: qs });
    }
    return groups;
  }, []);

  const scrollToNext = useCallback((currentQuestionId: number) => {
    const currentIdx = questions.findIndex(q => q.id === currentQuestionId);
    const nextIdx = currentIdx + 1;
    if (nextIdx < total && questionRefs.current[nextIdx]) {
      questionRefs.current[nextIdx]?.scrollIntoView({ behavior: "smooth", block: "center" });
    } else if (nextIdx >= total) {
      const submitBtn = document.getElementById("submit-section");
      submitBtn?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [total]);

  const handleAnswer = useCallback(
    (questionId: number, value: number) => {
      setAnswers(prev => {
        const isNew = prev[questionId] === undefined;
        const next = { ...prev, [questionId]: value };
        if (isNew) setTimeout(() => scrollToNext(questionId), 200);
        return next;
      });
    },
    [scrollToNext]
  );

  const handleSubmit = useCallback(() => {
    onComplete(answers);
  }, [answers, onComplete]);

  const progressColor = `rgba(255,${Math.max(0, Math.round(255 - progress * 2.2))},${Math.max(0, Math.round(255 - progress * 2.4))},${0.35 + progress * 0.003})`;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col h-dvh"
    >
      {/* Fixed progress header */}
      <div className="fixed top-0 left-0 right-0 z-20" style={{ paddingTop: "env(safe-area-inset-top)" }}>
        <div className="flex items-center justify-between px-5 py-3">
          <span
            className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.15em]"
            style={{ color: "rgba(255,255,255,0.35)" }}
          >
            診断中
          </span>
          <span
            className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.1em]"
            style={{ color: "rgba(255,255,255,0.5)" }}
          >
            {answeredCount}/{total}
          </span>
        </div>
        <div className="h-px w-full" style={{ backgroundColor: "rgba(255,255,255,0.06)" }}>
          <motion.div
            className="h-full"
            style={{
              backgroundColor: progressColor,
              boxShadow: `0 0 6px ${progressColor}`,
            }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Scrollable question list */}
      <div ref={containerRef} className="flex-1 overflow-y-auto pt-16 pb-32 px-6">
        {grouped.map((group, gi) => (
          <div key={group.category.id} className="mb-20">
            {/* Category header — centered */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: gi * 0.08, duration: 0.5 }}
              className="flex flex-col items-center gap-2 mb-10 mt-4"
            >
              <span className="text-lg">{group.category.emoji}</span>
              <span
                className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.3em] uppercase"
                style={{ color: "rgba(255,255,255,0.4)" }}
              >
                {group.category.label}
              </span>
              <div className="w-8 h-px mt-1" style={{ backgroundColor: "rgba(255,255,255,0.12)" }} />
            </motion.div>

            {/* Questions in this category */}
            {group.questions.map((question, qi) => {
              const globalIndex = questions.findIndex(q => q.id === question.id);
              const isAnswered = answers[question.id] !== undefined;

              return (
                <motion.div
                  key={question.id}
                  ref={el => { questionRefs.current[globalIndex] = el; }}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: gi * 0.08 + qi * 0.04, duration: 0.4 }}
                  className="mb-14 transition-opacity duration-300"
                  style={{ opacity: isAnswered ? 0.5 : 1 }}
                >
                  {/* Question number + text — centered vertical stack */}
                  <div className="flex flex-col items-center text-center mb-5">
                    <span
                      className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.2em] mb-2"
                      style={{ color: "rgba(255,255,255,0.25)" }}
                    >
                      Q{String(question.id).padStart(2, "0")}
                    </span>
                    <p
                      className="text-[15px] font-light leading-relaxed tracking-wide max-w-[320px]"
                      style={{ color: "rgba(255,255,255,0.85)" }}
                    >
                      {question.text}
                    </p>
                  </div>

                  {/* Scale UI — centered */}
                  {question.type === "scale" && (
                    <div className="flex flex-col items-center gap-2.5">
                      <div className="flex justify-between px-1" style={{ width: `${SCALE_STEPS * BUTTON_SIZE + (SCALE_STEPS - 1) * 8}px` }}>
                        <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.45)" }}>
                          {question.lowLabel}
                        </span>
                        <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.45)" }}>
                          {question.highLabel}
                        </span>
                      </div>
                      <div className="flex gap-2 justify-center">
                        {Array.from({ length: SCALE_STEPS }, (_, i) => {
                          const isSelected = answers[question.id] === i;
                          const colors = getScaleColor(i, question.dir, isSelected);
                          return (
                            <motion.button
                              key={i}
                              whileTap={{ scale: 0.85 }}
                              onClick={() => handleAnswer(question.id, i)}
                              className="relative rounded-full border transition-all duration-200 cursor-pointer flex items-center justify-center"
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
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
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

                  {/* Sleep UI — centered */}
                  {question.type === "sleep" && (
                    <div className="flex flex-col items-center gap-4">
                      <div className="flex items-end gap-2">
                        <motion.span
                          key={sleepValue}
                          initial={{ scale: 1.1, opacity: 0.7 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="font-[family-name:var(--font-mono)] text-3xl font-light"
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
                        <span className="text-sm mb-1" style={{ color: "rgba(255,255,255,0.6)" }}>時間</span>
                      </div>

                      <p className="text-[9px]" style={{
                        color: sleepValue < 5 || sleepValue > 10
                          ? "rgba(255,60,60,0.7)"
                          : sleepValue >= 7 && sleepValue <= 8
                            ? "rgba(130,220,180,0.6)"
                            : "rgba(255,255,255,0.4)",
                      }}>
                        {sleepValue < 5 ? "寿命が縮む睡眠時間" :
                         sleepValue > 10 ? "過度な睡眠もリスクに" :
                         sleepValue >= 7 && sleepValue <= 8 ? "理想的な睡眠時間" : ""}
                      </p>

                      <input
                        type="range"
                        min={3}
                        max={12}
                        step={0.5}
                        value={sleepValue}
                        onChange={(e) => {
                          const v = Number(e.target.value);
                          setSleepValue(v);
                          handleAnswer(question.id, v);
                        }}
                        className="w-56 sleep-slider"
                      />

                      <div className="flex justify-between w-56">
                        <span className="text-[10px]" style={{ color: "rgba(255,60,60,0.5)" }}>3時間</span>
                        <span className="text-[10px]" style={{ color: "rgba(255,60,60,0.5)" }}>12時間</span>
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        ))}

        {/* Bottom section */}
        <div id="submit-section" className="flex flex-col items-center py-20">
          <KosukumaAnimated size={72} animation="random" />
          {!allAnswered && (
            <p
              className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.2em] mt-6"
              style={{ color: "rgba(255,255,255,0.3)" }}
            >
              残り {total - answeredCount} 問
            </p>
          )}
        </div>
      </div>
      {/* Fixed bottom CTA — appears when all answered */}
      {allAnswered && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="fixed bottom-0 left-0 right-0 z-30 flex flex-col items-center pb-10 pt-8"
          style={{
            background: "linear-gradient(to top, rgba(0,0,0,0.95) 40%, rgba(0,0,0,0) 100%)",
            paddingBottom: "max(2.5rem, env(safe-area-inset-bottom))",
          }}
        >
          <motion.button
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSubmit}
            className="px-16 py-5 border cursor-pointer transition-all duration-500 hover:bg-red-900/10"
            style={{
              borderColor: "rgba(255,40,40,0.5)",
              borderRadius: "2px",
              boxShadow: "0 0 30px rgba(255,20,20,0.15), 0 0 60px rgba(255,20,20,0.05)",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 0 40px rgba(255,20,20,0.3), 0 0 80px rgba(255,20,20,0.1)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 0 30px rgba(255,20,20,0.15), 0 0 60px rgba(255,20,20,0.05)"; }}
          >
            <span
              className="font-[family-name:var(--font-mono)] text-base tracking-[0.3em] uppercase"
              style={{ color: "rgba(255,255,255,0.9)" }}
            >
              結果を見る
            </span>
          </motion.button>
        </motion.div>
      )}
    </motion.div>
  );
}
