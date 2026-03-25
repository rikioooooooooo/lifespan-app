"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { BasicInfo } from "@/lib/calculator";
import KosukumaAnimated from "./KosukumaAnimated";

interface Props {
  onSubmit: (info: BasicInfo) => void;
}

export default function BasicInfoScreen({ onSubmit }: Props) {
  const [gender, setGender] = useState<"male" | "female" | "other" | null>(null);
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
      className="flex flex-col items-center justify-center h-dvh px-6 overflow-hidden"
    >
      {/* Kosukuma */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="mb-8"
      >
        <KosukumaAnimated size={56} animation={canProceed ? "dance" : "gorogoro"} />
      </motion.div>

      {/* Section label */}
      <motion.p
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.5 }}
        className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.3em] uppercase mb-8"
        style={{ color: "rgba(255,255,255,0.55)" }}
      >
        あなたについて
      </motion.p>

      {/* Gender — red accent on selection */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="flex gap-3 mb-10"
      >
        {(["male", "female", "other"] as const).map((g) => {
          const label = g === "male" ? "男性" : g === "female" ? "女性" : "どちらでもない";
          const isSelected = gender === g;
          return (
            <button
              key={g}
              onClick={() => setGender(g)}
              aria-label={`${label}を選択`}
              className="relative px-6 py-3.5 border transition-all duration-300 cursor-pointer active:scale-95 focus:outline-none gender-btn"
              style={{
                borderColor: isSelected ? "rgba(255,40,40,0.4)" : "rgba(255,255,255,0.1)",
                backgroundColor: isSelected ? "rgba(255,20,20,0.06)" : "transparent",
                borderRadius: "2px",
                boxShadow: isSelected ? "0 0 16px rgba(255,20,20,0.08), inset 0 0 12px rgba(255,20,20,0.03)" : "none",
              }}
            >
              <span
                className="text-sm tracking-[0.1em] whitespace-nowrap"
                style={{ color: isSelected ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.55)" }}
              >
                {label}
              </span>
            </button>
          );
        })}
      </motion.div>

      {/* Age — red glow on focus */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45, duration: 0.5 }}
        className="flex flex-col items-center gap-3 mb-12"
      >
        <label htmlFor="age-input" className="text-xs tracking-[0.15em]" style={{ color: "rgba(255,255,255,0.6)" }}>
          年齢
        </label>
        <input
          id="age-input"
          type="number"
          inputMode="numeric"
          min={10}
          max={120}
          value={age}
          onChange={(e) => setAge(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && canProceed) handleSubmit(); }}
          placeholder="25"
          className="w-28 text-center bg-transparent border-b py-3 text-3xl font-[family-name:var(--font-mono)] font-light outline-none transition-all duration-300 focus:shadow-[0_4px_16px_rgba(255,20,20,0.1)] placeholder:text-white/15"
          style={{
            color: "rgba(255,255,255,0.85)",
            borderColor: age ? "rgba(255,40,40,0.3)" : "rgba(255,255,255,0.15)",
          }}
        />
        {/* Average lifespan hint */}
        {age && Number(age) >= 10 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-[9px] mt-1"
            style={{ color: "rgba(255,60,60,0.2)" }}
          >
            平均余命から逆算します
          </motion.p>
        )}
      </motion.div>

      {/* Submit — red tinted */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: canProceed ? 1 : 0.4 }}
        transition={{ duration: 0.3 }}
        onClick={handleSubmit}
        disabled={!canProceed}
        className="px-12 py-3.5 border transition-all duration-300 cursor-pointer disabled:cursor-default active:scale-95 gender-btn"
        style={{
          borderColor: canProceed ? "rgba(255,40,40,0.3)" : "rgba(255,255,255,0.08)",
          borderRadius: "2px",
          boxShadow: canProceed ? "0 0 16px rgba(255,20,20,0.06)" : "none",
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
