"use client";

import { motion } from "framer-motion";
import KosukumaSvg from "./KosukumaSvg";

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
      className="flex flex-col items-center justify-center min-h-screen px-6"
    >
      {/* Kosukuma */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.8, ease: "easeOut" }}
        className="mb-6"
      >
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          <KosukumaSvg size={100} mood="neutral" />
        </motion.div>
      </motion.div>

      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 1 }}
        className="text-center"
      >
        <h1
          className="font-[family-name:var(--font-mono)] text-[clamp(1.6rem,4.5vw,3rem)] font-light tracking-[0.15em] leading-tight"
          style={{ color: "rgba(255,255,255,0.9)" }}
        >
          あと何秒、
        </h1>
        <h1
          className="font-[family-name:var(--font-mono)] text-[clamp(1.6rem,4.5vw,3rem)] font-light tracking-[0.15em] leading-tight mt-1"
          style={{ color: "rgba(255,255,255,0.9)" }}
        >
          生きられる？
        </h1>
      </motion.div>

      {/* Subtitle */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 1 }}
        className="mt-6 text-sm tracking-[0.15em] text-center leading-relaxed"
        style={{ color: "rgba(255,255,255,0.35)" }}
      >
        36の問いから、あなたの残り時間を算出する。
      </motion.p>

      {/* Begin button */}
      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.8, duration: 0.6 }}
        onClick={onStart}
        className="mt-12 group relative cursor-pointer"
      >
        <div
          className="px-14 py-4 border transition-all duration-500 group-hover:bg-white/5 group-active:scale-95"
          style={{
            borderColor: "rgba(255,255,255,0.2)",
            borderRadius: "2px",
          }}
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
        <p className="text-[10px] tracking-[0.15em]" style={{ color: "rgba(255,255,255,0.15)" }}>
          所要時間：約3分 ─ 全36問
        </p>
      </motion.div>
    </motion.div>
  );
}
