// Shared constants — safe on client & server.
export const LEVEL_THRESHOLDS = [0, 100, 250, 450, 650] as const;
export const MAX_LEVEL = LEVEL_THRESHOLDS.length; // 5
export const EXP_PER_SCAN = 30;
export const POINTS_PER_LEVEL = 5;
export const TOTAL_ARTIFACTS = 12;

export type Rarity = "common" | "rare" | "epic" | "legendary";

export const RARITY_STYLE: Record<Rarity, { ring: string; grad: string; label_bm: string; label_en: string; glow: string }> = {
  common:    { ring: "oklch(0.72 0.09 165)", grad: "linear-gradient(135deg, oklch(0.94 0.05 165), oklch(0.88 0.09 165))", label_bm: "Biasa",    label_en: "Common",    glow: "oklch(0.72 0.09 165 / 0.35)" },
  rare:      { ring: "oklch(0.7  0.13 260)", grad: "linear-gradient(135deg, oklch(0.92 0.06 260), oklch(0.82 0.14 265))", label_bm: "Jarang",   label_en: "Rare",      glow: "oklch(0.7  0.14 265 / 0.45)" },
  epic:      { ring: "oklch(0.65 0.18 320)", grad: "linear-gradient(135deg, oklch(0.9  0.09 320), oklch(0.78 0.18 320))", label_bm: "Epik",     label_en: "Epic",      glow: "oklch(0.65 0.18 320 / 0.5)"  },
  legendary: { ring: "oklch(0.75 0.16 70)",  grad: "linear-gradient(135deg, oklch(0.94 0.09 70),  oklch(0.82 0.17 55))",  label_bm: "Legenda",  label_en: "Legendary", glow: "oklch(0.78 0.17 60 / 0.6)"   },
};

export function levelForExp(exp: number): number {
  let lvl = 1;
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (exp >= LEVEL_THRESHOLDS[i]) lvl = i + 1;
  }
  return lvl;
}

export function expToNextLevel(exp: number): { next: number | null; current: number } {
  const lvl = levelForExp(exp);
  if (lvl >= MAX_LEVEL) return { next: null, current: LEVEL_THRESHOLDS[MAX_LEVEL - 1] };
  return { next: LEVEL_THRESHOLDS[lvl], current: LEVEL_THRESHOLDS[lvl - 1] };
}

export type CategoryKey = "weapons" | "regalia" | "music" | "crafts";

export const CATEGORY_ORDER: CategoryKey[] = ["weapons", "regalia", "music", "crafts"];

export const CATEGORY_META: Record<CategoryKey, { emoji: string; color: string; bg: string }> = {
  weapons: { emoji: "⚔️", color: "oklch(0.55 0.16 25)",  bg: "oklch(0.94 0.06 25)" },
  regalia: { emoji: "👑", color: "oklch(0.6  0.15 60)",  bg: "oklch(0.94 0.07 70)" },
  music:   { emoji: "🎵", color: "oklch(0.55 0.13 265)", bg: "oklch(0.94 0.05 265)" },
  crafts:  { emoji: "🧵", color: "oklch(0.55 0.13 165)", bg: "oklch(0.94 0.06 165)" },
};

// Fixed map layout (viewBox 0 0 100 100). Zones are 4 quadrants of the floor.
export const ZONE_LAYOUT: Record<CategoryKey, { x: number; y: number; w: number; h: number; label_bm: string; label_en: string }> = {
  weapons: { x: 4,  y: 6,  w: 44, h: 42, label_bm: "Dewan Senjata",     label_en: "Weapons Hall"  },
  regalia: { x: 52, y: 6,  w: 44, h: 42, label_bm: "Balai Diraja",       label_en: "Royal Gallery" },
  music:   { x: 4,  y: 52, w: 44, h: 42, label_bm: "Dewan Muzik",        label_en: "Music Hall"    },
  crafts:  { x: 52, y: 52, w: 44, h: 42, label_bm: "Studio Kraftangan",  label_en: "Crafts Studio" },
};

export const PIN_POSITIONS: Record<string, { x: number; y: number }> = {
  "keris-panjang":         { x: 14, y: 20 },
  "meriam-melaka":         { x: 26, y: 36 },
  "terabai":               { x: 38, y: 20 },
  "tengkolok":             { x: 62, y: 20 },
  "baju-kurung-diraja":    { x: 74, y: 36 },
  "set-perak-diraja":      { x: 86, y: 20 },
  "gong-gamelan":          { x: 14, y: 66 },
  "rebana-ubi":            { x: 26, y: 82 },
  "seruling-tradisional":  { x: 38, y: 66 },
  "alat-tenun-songket":    { x: 62, y: 66 },
  "wau-bulan":             { x: 74, y: 82 },
  "canting-batik":         { x: 86, y: 66 },
};

// Parse whatever the QR encodes into an artifact id.
// Accepts raw id "keris-panjang", url ".../artifact/keris-panjang", or JSON {id}.
export function parseArtifactCode(raw: string): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  // URL form
  const m = trimmed.match(/artifact\/([a-z0-9-]+)/i);
  if (m) return m[1].toLowerCase();
  // JSON form
  if (trimmed.startsWith("{")) {
    try { const o = JSON.parse(trimmed); if (o && typeof o.id === "string") return o.id.toLowerCase(); } catch { /* noop */ }
  }
  // Bare id
  if (/^[a-z0-9-]{3,64}$/i.test(trimmed)) return trimmed.toLowerCase();
  return null;
}
