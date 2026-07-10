// Shared constants — safe on client & server.
export const LEVEL_THRESHOLDS = [0, 100, 250, 450, 650] as const;
export const MAX_LEVEL = LEVEL_THRESHOLDS.length; // 5
export const EXP_PER_SCAN = 30;
export const POINTS_PER_LEVEL = 5;
export const TOTAL_ARTIFACTS = 15;

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

export type CategoryKey = "weapons" | "regalia" | "music" | "crafts" | "toys";

export const CATEGORY_ORDER: CategoryKey[] = ["weapons", "regalia", "music", "crafts", "toys"];

export const CATEGORY_META: Record<CategoryKey, { emoji: string; color: string; bg: string }> = {
  weapons: { emoji: "⚔️", color: "oklch(0.55 0.16 25)",  bg: "oklch(0.94 0.06 25)" },
  regalia: { emoji: "👑", color: "oklch(0.6  0.15 60)",  bg: "oklch(0.94 0.07 70)" },
  music:   { emoji: "🎵", color: "oklch(0.55 0.13 265)", bg: "oklch(0.94 0.05 265)" },
  crafts:  { emoji: "🧵", color: "oklch(0.55 0.13 165)", bg: "oklch(0.94 0.06 165)" },
  toys:    { emoji: "🪀", color: "oklch(0.55 0.15 330)", bg: "oklch(0.94 0.06 330)" },
};

// Fixed map layout (viewBox 0 0 100 100). Zones are 4 quadrants of the floor.
export const ZONE_LAYOUT: Record<CategoryKey, { x: number; y: number; w: number; h: number; label_bm: string; label_en: string }> = {
  weapons: { x: 4,  y: 4,  w: 44, h: 26, label_bm: "Dewan Senjata",     label_en: "Weapons Hall"  },
  regalia: { x: 52, y: 4,  w: 44, h: 26, label_bm: "Balai Diraja",       label_en: "Royal Gallery" },
  music:   { x: 4,  y: 34, w: 44, h: 26, label_bm: "Dewan Muzik",        label_en: "Music Hall"    },
  crafts:  { x: 52, y: 34, w: 44, h: 26, label_bm: "Studio Kraftangan",  label_en: "Crafts Studio" },
  toys:    { x: 4,  y: 64, w: 92, h: 30, label_bm: "Ruang Mainan Tradisional", label_en: "Traditional Toys Corner" },
};

export const PIN_POSITIONS: Record<string, { x: number; y: number }> = {
  "keris-panjang":         { x: 14, y: 12 },
  "meriam-melaka":         { x: 26, y: 24 },
  "terabai":               { x: 38, y: 12 },
  "tengkolok":             { x: 62, y: 12 },
  "baju-kurung-diraja":    { x: 74, y: 24 },
  "set-perak-diraja":      { x: 86, y: 12 },
  "gong-gamelan":          { x: 14, y: 42 },
  "rebana-ubi":            { x: 26, y: 54 },
  "seruling-tradisional":  { x: 38, y: 42 },
  "alat-tenun-songket":    { x: 62, y: 42 },
  "wau-bulan":             { x: 74, y: 54 },
  "canting-batik":         { x: 86, y: 42 },
  "congkak":               { x: 20, y: 80 },
  "diabolo-cina":          { x: 50, y: 80 },
  "catur-cina":            { x: 80, y: 80 },
};

// Preset URL template — QR codes only need to contain "{slug}|{SN}"
// (e.g. "keris-panjang|SN001") or a full URL that ends in
// "/artifacts/{slug}|{SN}". Both forms parse to the artifact slug.
export const ARTIFACT_URL_PREFIX = "/artifacts/";

// Parse whatever the QR encodes into an artifact id (slug).
// Accepts:
//   - bare slug:              "keris-panjang"
//   - slug + serial number:   "keris-panjang|SN001"
//   - preset URL:             "https://any.host/artifacts/keris-panjang|SN001"
//   - legacy artifact URL:    "https://any.host/artifact/keris-panjang"
//   - JSON payload:           '{"id":"keris-panjang","sn":"SN001"}'
export function parseArtifactCode(raw: string): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();

  // JSON form
  if (trimmed.startsWith("{")) {
    try {
      const o = JSON.parse(trimmed);
      if (o && typeof o.id === "string") return o.id.toLowerCase();
      if (o && typeof o.slug === "string") return o.slug.toLowerCase();
    } catch { /* noop */ }
  }

  // Preset URL "/artifacts/{code}" (plural) — code may include a "|SN" tail.
  const presetMatch = trimmed.match(/\/artifacts\/([^/?#\s]+)/i);
  if (presetMatch) {
    const slug = presetMatch[1].split("|")[0];
    if (/^[a-z0-9-]{3,64}$/i.test(slug)) return slug.toLowerCase();
  }

  // Legacy singular "/artifact/{slug}" URL
  const legacyMatch = trimmed.match(/\/artifact\/([a-z0-9-]+)/i);
  if (legacyMatch) return legacyMatch[1].toLowerCase();

  // Pipe form "slug|SN001"
  if (trimmed.includes("|")) {
    const slug = trimmed.split("|")[0].trim();
    if (/^[a-z0-9-]{3,64}$/i.test(slug)) return slug.toLowerCase();
  }

  // Bare id
  if (/^[a-z0-9-]{3,64}$/i.test(trimmed)) return trimmed.toLowerCase();
  return null;
}
