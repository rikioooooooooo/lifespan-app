"use client";

import { motion } from "framer-motion";
import type { CategoryResult } from "@/lib/calculator";

interface Props {
  categories: CategoryResult[];
}

const categoryLabels: Record<string, string> = {
  body: "身体",
  mind: "精神",
  habit: "習慣",
  relation: "人間関係",
  work: "仕事",
  environment: "環境",
};

export default function CategoryBreakdown({ categories }: Props) {
  return (
    <div className="space-y-5">
      <p
        className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.25em] uppercase text-center mb-6"
        style={{ color: "rgba(255,255,255,0.2)" }}
      >
        Category Breakdown
      </p>

      {categories.map((cat, i) => {
        const isPositive = cat.impact >= 0;
        const barWidth = Math.min(Math.abs(cat.impact) / cat.maxImpact * 100, 100);

        return (
          <motion.div
            key={cat.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="space-y-1.5"
          >
            <div className="flex justify-between items-baseline">
              <div className="flex items-baseline gap-2">
                <span
                  className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.15em] uppercase"
                  style={{ color: "rgba(255,255,255,0.3)" }}
                >
                  {cat.label}
                </span>
                <span
                  className="text-[10px]"
                  style={{ color: "rgba(255,255,255,0.15)" }}
                >
                  {categoryLabels[cat.id]}
                </span>
              </div>
              <span
                className="font-[family-name:var(--font-mono)] text-xs"
                style={{
                  color: Math.abs(cat.impact) < 0.05
                    ? "rgba(255,255,255,0.3)"
                    : isPositive
                      ? "rgba(130,220,180,0.7)"
                      : "rgba(220,130,130,0.7)",
                }}
              >
                {Math.abs(cat.impact) < 0.05 ? "+" : isPositive ? "+" : ""}
                {Math.abs(cat.impact) < 0.05 ? "0.0" : cat.impact.toFixed(1)}年
              </span>
            </div>

            {/* Bar */}
            <div className="relative h-[3px] w-full" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
              <div className="absolute top-0 left-1/2 w-px h-full" style={{ backgroundColor: "rgba(255,255,255,0.15)" }} />
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${barWidth / 2}%` }}
                transition={{ delay: 0.3 + i * 0.1, duration: 0.6, ease: "easeOut" }}
                className="absolute top-0 h-full"
                style={{
                  left: isPositive ? "50%" : undefined,
                  right: isPositive ? undefined : "50%",
                  backgroundColor: isPositive ? "rgba(130,220,180,0.5)" : "rgba(220,130,130,0.5)",
                }}
              />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
