export type QuestionType = "scale" | "sleep";

export interface Question {
  id: number;
  category: Category;
  text: string;
  dir: 1 | -1; // 1 = positive impact, -1 = negative impact
  weight: number;
  type: QuestionType;
  lowLabel?: string;  // left label for scale
  highLabel?: string; // right label for scale
}

export type Category = "body" | "mind" | "habit" | "relation" | "work" | "environment";

export interface CategoryDef {
  id: Category;
  label: string;
  icon: string;
  maxImpact: number;
}

export const categories: CategoryDef[] = [
  { id: "body", label: "BODY", icon: "/icons/body.png", maxImpact: 4.5 },
  { id: "mind", label: "MIND", icon: "/icons/mind.png", maxImpact: 4 },
  { id: "habit", label: "HABIT", icon: "/icons/habit.png", maxImpact: 6 },
  { id: "relation", label: "RELATION", icon: "/icons/relation.png", maxImpact: 4 },
  { id: "work", label: "WORK", icon: "/icons/work.png", maxImpact: 3.5 },
  { id: "environment", label: "ENVIRONMENT", icon: "/icons/environment.png", maxImpact: 3.5 },
];

export const questions: Question[] = [
  // BODY
  { id: 1, category: "body", text: "意識的に身体を動かしている", dir: 1, weight: 1.5, type: "scale", lowLabel: "まったく", highLabel: "毎日" },
  { id: 2, category: "body", text: "自分の体力に自信がある", dir: 1, weight: 1, type: "scale", lowLabel: "ない", highLabel: "ある" },
  { id: 3, category: "body", text: "健康診断の結果を確認している", dir: 1, weight: 1.1, type: "scale", lowLabel: "していない", highLabel: "毎年" },
  { id: 4, category: "body", text: "慢性的な痛みや不調がある", dir: -1, weight: 1.3, type: "scale", lowLabel: "ない", highLabel: "常にある" },
  { id: 5, category: "body", text: "栄養バランスを意識している", dir: 1, weight: 1.2, type: "scale", lowLabel: "まったく", highLabel: "とても" },
  { id: 6, category: "body", text: "体重が標準から外れている", dir: -1, weight: 1.4, type: "scale", lowLabel: "標準", highLabel: "大きく外れている" },

  // MIND
  { id: 7, category: "mind", text: "自分のことが好きだ", dir: 1, weight: 1.3, type: "scale", lowLabel: "嫌い", highLabel: "好き" },
  { id: 8, category: "mind", text: "将来への不安がある", dir: -1, weight: 1.1, type: "scale", lowLabel: "ない", highLabel: "常にある" },
  { id: 9, category: "mind", text: "感情を話せる相手がいる", dir: 1, weight: 1.4, type: "scale", lowLabel: "いない", highLabel: "何人もいる" },
  { id: 10, category: "mind", text: "ストレスが身体に出る", dir: -1, weight: 1.2, type: "scale", lowLabel: "出ない", highLabel: "よく出る" },
  { id: 11, category: "mind", text: "没頭できる時間がある", dir: 1, weight: 1, type: "scale", lowLabel: "ない", highLabel: "毎日ある" },
  { id: 12, category: "mind", text: "理由のない憂鬱を感じる", dir: -1, weight: 1.3, type: "scale", lowLabel: "ない", highLabel: "よくある" },

  // HABIT
  { id: 13, category: "habit", text: "タバコを吸っている", dir: -1, weight: 2, type: "scale", lowLabel: "吸わない", highLabel: "毎日吸う" },
  { id: 14, category: "habit", text: "お酒を飲んでいる", dir: -1, weight: 1.4, type: "scale", lowLabel: "飲まない", highLabel: "毎日飲む" },
  { id: 15, category: "habit", text: "平均何時間寝ていますか？", dir: 1, weight: 1.5, type: "sleep" },
  { id: 16, category: "habit", text: "スマホの使用時間が長い", dir: -1, weight: 0.8, type: "scale", lowLabel: "短い", highLabel: "1日5時間超" },
  { id: 17, category: "habit", text: "加工食品をよく食べる", dir: -1, weight: 1.2, type: "scale", lowLabel: "食べない", highLabel: "毎食" },
  { id: 18, category: "habit", text: "水をしっかり飲んでいる", dir: 1, weight: 0.9, type: "scale", lowLabel: "あまり", highLabel: "1.5L以上" },

  // RELATION
  { id: 19, category: "relation", text: "信頼できる友人がいる", dir: 1, weight: 1.5, type: "scale", lowLabel: "いない", highLabel: "たくさんいる" },
  { id: 20, category: "relation", text: "家族との関係に満足している", dir: 1, weight: 1.3, type: "scale", lowLabel: "不満", highLabel: "とても満足" },
  { id: 21, category: "relation", text: "孤独を感じることがある", dir: -1, weight: 1.6, type: "scale", lowLabel: "ない", highLabel: "常に感じる" },
  { id: 22, category: "relation", text: "困ったときに頼れる人がいる", dir: 1, weight: 1.4, type: "scale", lowLabel: "いない", highLabel: "何人もいる" },
  { id: 23, category: "relation", text: "コミュニティに所属している", dir: 1, weight: 1, type: "scale", lowLabel: "していない", highLabel: "複数" },
  { id: 24, category: "relation", text: "人間関係にストレスを感じる", dir: -1, weight: 1.1, type: "scale", lowLabel: "ない", highLabel: "常にある" },

  // WORK
  { id: 25, category: "work", text: "仕事に意味を感じている", dir: 1, weight: 1.3, type: "scale", lowLabel: "感じない", highLabel: "とても感じる" },
  { id: 26, category: "work", text: "労働時間が長い", dir: -1, weight: 1.5, type: "scale", lowLabel: "適正", highLabel: "週50時間超" },
  { id: 27, category: "work", text: "職場の人間関係は良好だ", dir: 1, weight: 1.1, type: "scale", lowLabel: "悪い", highLabel: "とても良い" },
  { id: 28, category: "work", text: "仕事が頭から離れない", dir: -1, weight: 1.2, type: "scale", lowLabel: "切替できる", highLabel: "常に考えている" },
  { id: 29, category: "work", text: "自分の裁量で仕事を決められる", dir: 1, weight: 1, type: "scale", lowLabel: "決められない", highLabel: "自由に決められる" },
  { id: 30, category: "work", text: "通勤時間が長い", dir: -1, weight: 0.9, type: "scale", lowLabel: "短い/在宅", highLabel: "1時間超" },

  // ENVIRONMENT
  { id: 31, category: "environment", text: "家族に長寿の人が多い", dir: 1, weight: 1.6, type: "scale", lowLabel: "いない", highLabel: "多い" },
  { id: 32, category: "environment", text: "経済的な不安がある", dir: -1, weight: 1.3, type: "scale", lowLabel: "ない", highLabel: "常にある" },
  { id: 33, category: "environment", text: "自然に触れる機会がある", dir: 1, weight: 0.9, type: "scale", lowLabel: "ない", highLabel: "毎日" },
  { id: 34, category: "environment", text: "生きがいや目標がある", dir: 1, weight: 1.5, type: "scale", lowLabel: "ない", highLabel: "明確にある" },
  { id: 35, category: "environment", text: "空気の綺麗な場所に住んでいる", dir: 1, weight: 1, type: "scale", lowLabel: "汚い", highLabel: "とても綺麗" },
  { id: 36, category: "environment", text: "定期的に笑う機会がある", dir: 1, weight: 1.1, type: "scale", lowLabel: "ない", highLabel: "毎日笑う" },
];
