import { questions, categories, type Category } from "@/data/questions";

export interface BasicInfo {
  age: number;
  gender: "male" | "female";
}

export interface Answers {
  [questionId: number]: number; // 0-6 for scale, hours for sleep
}

export interface CategoryResult {
  id: Category;
  label: string;
  impact: number;
  maxImpact: number;
  ratio: number;
}

export interface LifespanResult {
  estimatedLifespan: number;
  healthyLifespan: number;
  awakeLifespan: number;
  baseLifespan: number;
  totalImpact: number;
  categories: CategoryResult[];
  sleepHours: number;
  age: number;
  gender: "male" | "female";
  remainingSeconds: number;
  remainingHealthySeconds: number;
  remainingAwakeSeconds: number;
}

function getAgeCorrection(age: number): number {
  if (age <= 20) return 1.2;
  if (age <= 35) return 1.0;
  if (age <= 50) return 0.85;
  if (age <= 65) return 0.7;
  return 0.5;
}

function getSleepScore(hours: number): number {
  if (hours >= 7 && hours <= 8) return 1.0;
  if (hours >= 6 && hours < 7) return 0.7;
  if (hours >= 8 && hours <= 9) return 0.8;
  if (hours >= 5 && hours < 6) return 0.4;
  if (hours > 9 && hours <= 10) return 0.5;
  if (hours < 5) return 0.1;
  return 0.3;
}

const SCALE_MAX = 6; // 0-6 scale (7 steps)

export function calculate(info: BasicInfo, answers: Answers): LifespanResult {
  const baseLifespan = info.gender === "male" ? 81.5 : 87.6;
  const ageCorrection = getAgeCorrection(info.age);

  const categoryResults: CategoryResult[] = categories.map((cat) => {
    const catQuestions = questions.filter((q) => q.category === cat.id);
    let totalWeightedScore = 0;
    let totalWeight = 0;

    for (const q of catQuestions) {
      const answer = answers[q.id];
      if (answer === undefined) continue;

      let score: number;
      if (q.type === "sleep") {
        score = getSleepScore(answer);
      } else {
        // scale: normalize 0-6 to 0-1
        score = answer / SCALE_MAX;
      }

      const effectiveScore = q.dir === 1 ? score : 1 - score;
      totalWeightedScore += effectiveScore * q.weight;
      totalWeight += q.weight;
    }

    const normalizedScore = totalWeight > 0 ? totalWeightedScore / totalWeight : 0.5;
    const impact = (normalizedScore * 2 - 1) * cat.maxImpact * ageCorrection;

    return {
      id: cat.id,
      label: cat.label,
      impact: Math.round(impact * 100) / 100,
      maxImpact: cat.maxImpact,
      ratio: normalizedScore,
    };
  });

  const totalImpact = categoryResults.reduce((sum, c) => sum + c.impact, 0);
  const estimatedLifespan = Math.round((baseLifespan + totalImpact) * 10) / 10;
  const healthyLifespan = Math.round((estimatedLifespan - 9.5) * 10) / 10;
  const sleepHours = answers[15] ?? 7;
  const remainingYears = Math.max(estimatedLifespan - info.age, 0);
  const awakeRatio = (24 - sleepHours) / 24;
  const awakeRemainingYears = remainingYears * awakeRatio;
  const awakeLifespan = Math.round((info.age + awakeRemainingYears) * 10) / 10;

  const now = new Date();
  const birthYear = now.getFullYear() - info.age;
  const birthDate = new Date(birthYear, now.getMonth(), now.getDate());

  const estimatedDeathDate = new Date(birthDate.getTime() + estimatedLifespan * 365.25 * 24 * 60 * 60 * 1000);
  const healthyEndDate = new Date(birthDate.getTime() + healthyLifespan * 365.25 * 24 * 60 * 60 * 1000);
  const awakeEndDate = new Date(birthDate.getTime() + awakeLifespan * 365.25 * 24 * 60 * 60 * 1000);

  const remainingSeconds = Math.max(Math.floor((estimatedDeathDate.getTime() - now.getTime()) / 1000), 0);
  const remainingHealthySeconds = Math.max(Math.floor((healthyEndDate.getTime() - now.getTime()) / 1000), 0);
  const remainingAwakeSeconds = Math.max(Math.floor((awakeEndDate.getTime() - now.getTime()) / 1000), 0);

  return {
    estimatedLifespan,
    healthyLifespan,
    awakeLifespan,
    baseLifespan,
    totalImpact,
    categories: categoryResults,
    sleepHours,
    age: info.age,
    gender: info.gender,
    remainingSeconds,
    remainingHealthySeconds,
    remainingAwakeSeconds,
  };
}

export function formatSeconds(totalSeconds: number): { years: number; days: number; hours: number; minutes: number; seconds: number } {
  const years = Math.floor(totalSeconds / (365.25 * 24 * 3600));
  let remaining = totalSeconds - years * Math.floor(365.25 * 24 * 3600);
  const days = Math.floor(remaining / (24 * 3600));
  remaining -= days * 24 * 3600;
  const hours = Math.floor(remaining / 3600);
  remaining -= hours * 3600;
  const minutes = Math.floor(remaining / 60);
  const seconds = remaining - minutes * 60;
  return { years, days, hours, minutes, seconds };
}
