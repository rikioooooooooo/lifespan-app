"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { BasicInfo } from "@/lib/calculator";
import KosukumaSvg from "./KosukumaSvg";

interface Props {
  onSubmit: (info: BasicInfo) => void;
}

export default function BasicInfoScreen({ onSubmit }: Props) {
  const [gender, setGender] = useState<"male" | "female" | null>(null);
  const [age, setAge] = useState("");

  const canProceed = gender !== null && age !== "" && Number(age) >= 10 && Number(age) <= 120;

  const handleSubmit = () => {
    if (!canProceed || !gender) return;
    onSubmit({ age: Number(age), gender });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
      className="flex flex-col items-center justify-center min-h-screen px-6"
    >
      {/* Kosukuma */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="mb-8"
      >
        <KosukumaSvg size={56} mood={canProceed ? "happy" : "neutral"} />
      </motion.div>

      {/* Section label */}
      <motion.p
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.5 }}
        className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.3em] uppercase mb-8"
        style={{ color: "rgba(255,255,255,0.25)" }}
      >
        あなたについて
      </motion.p>

      {/* Gender */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="flex gap-3 mb-10"
      >
        {(["male", "female"] as const).map((g) => (
          <button
            key={g}
            onClick={() => setGender(g)}
            className="relative px-8 py-3.5 border transition-all duration-300 cursor-pointer active:scale-95"
            style={{
              borderColor: gender === g ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.1)",
              backgroundColor: gender === g ? "rgba(255,255,255,0.06)" : "transparent",
              borderRadius: "2px",
            }}
          >
            <span
              className="text-sm tracking-[0.1em]"
              style={{ color: gender === g ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.3)" }}
            >
              {g === "male" ? "男性" : "女性"}
            </span>
          </button>
        ))}
      </motion.div>

      {/* Age */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45, duration: 0.5 }}
        className="flex flex-col items-center gap-3 mb-12"
      >
        <label className="text-xs tracking-[0.15em]" style={{ color: "rgba(255,255,255,0.3)" }}>
          年齢
        </label>
        <input
          type="number"
          inputMode="numeric"
          min={10}
          max={120}
          value={age}
          onChange={(e) => setAge(e.target.value)}
          placeholder="25"
          className="w-28 text-center bg-transparent border-b py-3 text-3xl font-[family-name:var(--font-mono)] font-light outline-none transition-colors duration-300 focus:border-white/40"
          style={{
            color: "rgba(255,255,255,0.85)",
            borderColor: "rgba(255,255,255,0.15)",
          }}
        />
      </motion.div>

      {/* Submit */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: canProceed ? 1 : 0.4 }}
        transition={{ duration: 0.3 }}
        onClick={handleSubmit}
        disabled={!canProceed}
        className="px-12 py-3.5 border transition-all duration-300 cursor-pointer disabled:cursor-default active:scale-95"
        style={{
          borderColor: canProceed ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.08)",
          borderRadius: "2px",
        }}
      >
        <span
          className="font-[family-name:var(--font-mono)] text-sm tracking-[0.3em] uppercase"
          style={{ color: canProceed ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.2)" }}
        >
          Next
        </span>
      </motion.button>
    </motion.div>
  );
}
