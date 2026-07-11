import type { Tables } from "@/integrations/supabase/types";

export type ArtifactQuizArtifact = Pick<
  Tables<"artifacts">,
  | "id"
  | "category"
  | "name_bm"
  | "name_en"
  | "origin_bm"
  | "origin_en"
  | "material_bm"
  | "material_en"
>;

type Localized = {
  bm: string;
  en: string;
};

export interface ArtifactQuizQuestion {
  id: string;
  prompt: Localized;
  options: Localized[];
  correctIndex: number;
}

const CATEGORY_OPTIONS: Array<{ key: string; label: Localized }> = [
  { key: "weapons", label: { bm: "Senjata Tradisional", en: "Traditional Weapons" } },
  { key: "regalia", label: { bm: "Pakaian & Perhiasan Diraja", en: "Royal Regalia" } },
  { key: "music", label: { bm: "Alat Muzik Tradisional", en: "Traditional Music" } },
  { key: "crafts", label: { bm: "Kraftangan Warisan", en: "Heritage Crafts" } },
  { key: "toys", label: { bm: "Mainan Tradisional", en: "Traditional Toys" } },
];

const ORIGIN_OPTIONS: Localized[] = [
  { bm: "Kesultanan Melayu", en: "Malay Sultanates" },
  { bm: "Melaka", en: "Malacca" },
  { bm: "Sarawak", en: "Sarawak" },
  { bm: "Semenanjung Tanah Melayu", en: "Malay Peninsula" },
  { bm: "Istana Melayu", en: "Malay palaces" },
  { bm: "Kelantan dan Terengganu", en: "Kelantan and Terengganu" },
  { bm: "Pahang dan Terengganu", en: "Pahang and Terengganu" },
  { bm: "Kelantan", en: "Kelantan" },
  { bm: "Terengganu dan Kelantan", en: "Terengganu and Kelantan" },
  { bm: "China; komuniti Cina Malaysia", en: "China; Malaysian Chinese community" },
];

const MATERIAL_OPTIONS: Localized[] = [
  { bm: "Besi tempaan dan kayu", en: "Forged iron and wood" },
  { bm: "Tembaga", en: "Bronze" },
  { bm: "Kayu keras dan cat asli", en: "Hardwood and natural pigments" },
  { bm: "Kain songket", en: "Songket cloth" },
  { bm: "Sutera, songket, benang emas", en: "Silk, songket, gold thread" },
  { bm: "Perak tulen", en: "Pure silver" },
  { bm: "Perunggu", en: "Bronze" },
  { bm: "Kayu keras dan kulit lembu", en: "Hardwood and cow hide" },
  { bm: "Buluh", en: "Bamboo" },
  { bm: "Kayu, benang sutera dan benang emas", en: "Wood, silk thread and gold thread" },
  { bm: "Buluh dan kertas berwarna", en: "Bamboo and coloured paper" },
  { bm: "Tembaga dan kayu", en: "Copper and wood" },
  { bm: "Kayu keras, guli atau biji getah", en: "Hardwood, marbles or rubber seeds" },
  { bm: "Buluh, kayu dan tali", en: "Bamboo, wood and string" },
  { bm: "Kayu dan dakwat", en: "Wood and ink" },
];

function hashSeed(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function buildLocalizedOptions(correct: Localized, pool: Localized[], seed: string): Localized[] {
  const distractors = pool.filter((option) => option.en !== correct.en);
  const unique: Localized[] = [];
  for (let i = 0; i < distractors.length; i += 1) {
    const candidate = distractors[(hashSeed(`${seed}-${i}`) + i) % distractors.length];
    if (!unique.some((option) => option.en === candidate.en)) unique.push(candidate);
    if (unique.length === 3) break;
  }

  const combined = [correct, ...unique];
  const rotate = hashSeed(`${seed}-rotate`) % combined.length;
  return combined.map((_, index) => combined[(index + rotate) % combined.length]);
}

function buildCategoryOptions(category: string, seed: string): Localized[] {
  const correct = CATEGORY_OPTIONS.find((option) => option.key === category)?.label ?? CATEGORY_OPTIONS[0].label;
  return buildLocalizedOptions(
    correct,
    CATEGORY_OPTIONS.map((option) => option.label),
    seed,
  );
}

export function buildArtifactQuiz(artifact: ArtifactQuizArtifact): ArtifactQuizQuestion[] {
  const categoryOptions = buildCategoryOptions(artifact.category, `${artifact.id}-category`);
  const originCorrect = { bm: artifact.origin_bm, en: artifact.origin_en };
  const originOptions = buildLocalizedOptions(originCorrect, ORIGIN_OPTIONS, `${artifact.id}-origin`);
  const materialCorrect = { bm: artifact.material_bm, en: artifact.material_en };
  const materialOptions = buildLocalizedOptions(materialCorrect, MATERIAL_OPTIONS, `${artifact.id}-material`);

  return [
    {
      id: `${artifact.id}-category`,
      prompt: {
        bm: `${artifact.name_bm} tergolong dalam kategori yang mana?`,
        en: `Which category does ${artifact.name_en} belong to?`,
      },
      options: categoryOptions,
      correctIndex: categoryOptions.findIndex((option) => option.en === CATEGORY_OPTIONS.find((item) => item.key === artifact.category)?.label.en),
    },
    {
      id: `${artifact.id}-origin`,
      prompt: {
        bm: `Apakah asal yang disenaraikan untuk ${artifact.name_bm}?`,
        en: `Which origin is listed for ${artifact.name_en}?`,
      },
      options: originOptions,
      correctIndex: originOptions.findIndex((option) => option.en === artifact.origin_en),
    },
    {
      id: `${artifact.id}-material`,
      prompt: {
        bm: `Apakah bahan ${artifact.name_bm}?`,
        en: `What material is ${artifact.name_en} made from?`,
      },
      options: materialOptions,
      correctIndex: materialOptions.findIndex((option) => option.en === artifact.material_en),
    },
  ];
}
