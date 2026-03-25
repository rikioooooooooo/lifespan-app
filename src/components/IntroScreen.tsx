"use client";

import { motion } from "framer-motion";
import KosukumaAnimated from "./KosukumaAnimated";
import GlitchText from "./GlitchText";

interface Props {
  onStart: () => void;
}

export default function IntroScreen({ onStart }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
      className="flex flex-col items-center justify-center h-dvh px-6 overflow-hidden"
    >
      {/* Kosukuma with red shadow */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.8, ease: "easeOut" }}
        className="mb-6"
        style={{ filter: "drop-shadow(0 8px 24px rgba(255,20,20,0.08))" }}
      >
        <KosukumaAnimated size={140} animation="utouto" />
      </motion.div>

      {/* Title with glitch noise */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 1 }}
        className="text-center"
      >
        <GlitchText
          text="あと何秒、"
          className="font-[family-name:var(--font-mono)] text-[clamp(1.6rem,4.5vw,3rem)] font-light tracking-[0.15em] leading-tight"
          style={{ color: "rgba(255,255,255,0.9)" }}
        />
        <GlitchText
          text="生きられる？"
          className="font-[family-name:var(--font-mono)] text-[clamp(1.6rem,4.5vw,3rem)] font-light tracking-[0.15em] leading-tight mt-1"
          style={{ color: "rgba(255,255,255,0.9)" }}
        />
      </motion.div>

      {/* Subtitle — hint of mortality */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 1 }}
        className="mt-6 text-sm tracking-[0.15em] text-center leading-relaxed"
        style={{ color: "rgba(255,80,80,0.5)" }}
      >
        36の問いから、失われていく時間を可視化する。
      </motion.p>

      {/* Begin button — heartbeat animation */}
      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.8, duration: 0.6 }}
        onClick={onStart}
        className="mt-12 group relative cursor-pointer heartbeat"
      >
        <div
          className="px-14 py-4 border transition-all duration-500 group-hover:bg-red-900/10 group-hover:border-red-500/40 group-active:scale-95"
          style={{
            borderColor: "rgba(255,40,40,0.25)",
            borderRadius: "2px",
            boxShadow: "0 0 20px rgba(255,20,20,0.05)",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 0 24px rgba(255,20,20,0.25), 0 0 8px rgba(255,40,40,0.15)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 0 20px rgba(255,20,20,0.05)"; }}
        >
          <span
            className="font-[family-name:var(--font-mono)] text-sm tracking-[0.3em] uppercase"
            style={{ color: "rgba(255,255,255,0.7)" }}
          >
            Begin
          </span>
        </div>
      </motion.button>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.2, duration: 1 }}
        className="absolute bottom-8 text-center"
      >
        <p className="text-[10px] tracking-[0.15em]" style={{ color: "rgba(255,255,255,0.45)" }}>
          所要時間：約3分 ─ 全36問
        </p>
      </motion.div>
    </motion.div>
  );
}
