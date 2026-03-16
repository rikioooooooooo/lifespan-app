"use client";

import { useState, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import Background from "@/components/Background";
import IntroScreen from "@/components/IntroScreen";
import BasicInfoScreen from "@/components/BasicInfoScreen";
import QuestionScreen from "@/components/QuestionScreen";
import ResultScreen from "@/components/ResultScreen";
import { calculate, type BasicInfo, type Answers, type LifespanResult } from "@/lib/calculator";

type Screen = "intro" | "basicInfo" | "questions" | "result";

export default function Home() {
  const [screen, setScreen] = useState<Screen>("intro");
  const [basicInfo, setBasicInfo] = useState<BasicInfo | null>(null);
  const [answers, setAnswers] = useState<Answers>({});
  const [result, setResult] = useState<LifespanResult | null>(null);

  const handleStart = useCallback(() => {
    setScreen("basicInfo");
  }, []);

  const handleBasicInfo = useCallback((info: BasicInfo) => {
    setBasicInfo(info);
    setScreen("questions");
  }, []);

  const handleQuestionsComplete = useCallback(
    (allAnswers: Answers) => {
      setAnswers(allAnswers);
      if (basicInfo) {
        const r = calculate(basicInfo, allAnswers);
        setResult(r);
        setScreen("result");
      }
    },
    [basicInfo]
  );

  const handleRestart = useCallback(() => {
    setScreen("intro");
    setBasicInfo(null);
    setAnswers({});
    setResult(null);
  }, []);

  return (
    <main className="relative min-h-screen overflow-hidden">
      <Background />
      <div className="relative z-10 min-h-screen">
        <AnimatePresence mode="wait">
          {screen === "intro" && <IntroScreen key="intro" onStart={handleStart} />}
          {screen === "basicInfo" && <BasicInfoScreen key="basic" onSubmit={handleBasicInfo} />}
          {screen === "questions" && (
            <QuestionScreen key="questions" basicInfo={basicInfo!} onComplete={handleQuestionsComplete} />
          )}
          {screen === "result" && result && (
            <ResultScreen key="result" result={result} onRestart={handleRestart} />
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
