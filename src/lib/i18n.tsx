import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "bm" | "en";

const STRINGS = {
  appName: { bm: "HeritageQuest", en: "HeritageQuest" },
  tagline: { bm: "Warisan Terungkai", en: "Heritage Unfolded" },
  museum: { bm: "Koleksi Warisan", en: "The Collection" },
  nav_scan: { bm: "Imbas", en: "Scan" },
  nav_map: { bm: "Peta", en: "Map" },
  nav_quests: { bm: "Kuest", en: "Quests" },
  nav_profile: { bm: "Profil", en: "Profile" },
  nav_badges: { bm: "Lencana", en: "Badges" },
  nav_rewards: { bm: "Ganjaran", en: "Rewards" },
  nav_journal: { bm: "Jurnal", en: "Journal" },
  nav_achievements: { bm: "Pencapaian", en: "Achievements" },
  signout: { bm: "Log Keluar", en: "Sign out" },
  signin: { bm: "Log Masuk", en: "Sign in" },
  signup: { bm: "Daftar Akaun", en: "Create account" },
  email: { bm: "E-mel", en: "Email" },
  password: { bm: "Kata Laluan", en: "Password" },
  username: { bm: "Nama Pengguna", en: "Username" },
  auth_welcome: { bm: "Hai, pengembara!", en: "Hi, explorer!" },
  auth_sub: { bm: "Log masuk untuk menyambung perjalanan anda.", en: "Sign in to keep exploring." },
  auth_new_here: { bm: "Baru di sini? Daftar akaun.", en: "New here? Create an account." },
  auth_have_acct: { bm: "Sudah ada akaun? Log masuk.", en: "Have an account? Sign in." },
  level: { bm: "Tahap", en: "Level" },
  exp: { bm: "EXP", en: "EXP" },
  points: { bm: "Mata", en: "Points" },
  progress: { bm: "Kemajuan", en: "Progress" },
  artifacts_found: { bm: "penemuan", en: "found" },
  category_weapons: { bm: "Senjata Tradisional", en: "Traditional Weapons" },
  category_regalia: { bm: "Pakaian & Perhiasan Diraja", en: "Royal Regalia" },
  category_music: { bm: "Alat Muzik Tradisional", en: "Traditional Music" },
  category_crafts: { bm: "Kraftangan Warisan", en: "Heritage Crafts" },
  scanned: { bm: "Sudah dikesan", en: "Discovered" },
  unscanned: { bm: "Belum dikesan", en: "Not yet discovered" },
  claim_exp: { bm: "Tuntut +30 EXP", en: "Claim +30 EXP" },
  already_claimed: { bm: "Sudah dituntut", en: "Already claimed" },
  era: { bm: "Era", en: "Era" },
  origin: { bm: "Asal", en: "Origin" },
  material: { bm: "Bahan", en: "Material" },
  back: { bm: "Kembali", en: "Back" },
  close: { bm: "Tutup", en: "Close" },
  redeem: { bm: "Tebus", en: "Redeem" },
  redeemed: { bm: "Berjaya ditebus!", en: "Redeemed!" },
  insufficient: { bm: "Mata tidak mencukupi", en: "Not enough points" },
  earned: { bm: "Diperoleh", en: "Earned" },
  locked: { bm: "Belum dibuka", en: "Locked" },
  unlocked: { bm: "Dibuka", en: "Unlocked" },
  quest_completed: { bm: "Kuest tamat", en: "Quest completed" },
  quest_ongoing: { bm: "Sedang berlangsung", en: "In progress" },
  quest_normal: { bm: "Kuest Kategori", en: "Category Quests" },
  quest_unique: { bm: "Kuest Unik", en: "Unique Quests" },
  quest_unique_intro: { bm: "Kuest rahsia muncul selepas imbasan tertentu. Terima cabaran untuk 3× EXP dan lencana rare.", en: "Secret quests appear after certain scans. Accept for 3× EXP and a rare badge." },
  quest_active: { bm: "Aktif", en: "Active" },
  quest_failed: { bm: "Gagal", en: "Failed" },
  quest_declined: { bm: "Ditolak", en: "Declined" },
  journal_title: { bm: "Jurnal Pembelajaran", en: "Learning Journal" },
  journal_sub: { bm: "Kenangan digital lawatan anda.", en: "A digital keepsake of your visit." },
  no_artifacts: { bm: "Belum ada penemuan lagi.", en: "No discoveries yet." },
  scan_hint: { bm: "Ketik butang imbas dan halakan kamera ke kod QR.", en: "Tap scan and point your camera at a QR code." },
  visit_summary: { bm: "Ringkasan Lawatan", en: "Visit Summary" },
  total_exp: { bm: "Jumlah EXP", en: "Total EXP" },
  rewards_intro: { bm: "Tebus mata anda di kedai cenderamata.", en: "Redeem your points at the gift shop." },
  balance: { bm: "Baki", en: "Balance" },
  quests_intro: { bm: "Kesan artifak untuk menamatkan kuest dan memperoleh EXP bonus.", en: "Discover artifacts to complete quests and earn bonus EXP." },
  badges_intro: { bm: "Pencapaian anda sepanjang perjalanan.", en: "Your achievements along the journey." },
  landing_cta: { bm: "Mulakan Pengembaraan", en: "Begin Your Journey" },
  landing_body: {
    bm: "Ubah lawatan anda menjadi perjalanan permainan — imbas, terokai dan kumpul ganjaran warisan.",
    en: "Turn your visit into a game — scan, explore, and collect heritage rewards.",
  },
  level_up: { bm: "Naik tahap!", en: "Level up!" },
  new_badge: { bm: "Lencana baharu!", en: "New badge!" },
  new_achievement: { bm: "Pencapaian baharu!", en: "New achievement!" },
  quest_done: { bm: "Kuest selesai!", en: "Quest completed!" },
  exp_gained: { bm: "EXP diperoleh", en: "EXP gained" },
  scan_title: { bm: "Imbas Kod QR", en: "Scan a QR Code" },
  scan_start: { bm: "Mula Imbas", en: "Start Camera" },
  scan_stop: { bm: "Berhenti", en: "Stop" },
  scan_permission: { bm: "Benarkan akses kamera untuk mula imbas.", en: "Allow camera access to start scanning." },
  scan_manual: { bm: "Atau masukkan ID artifak secara manual", en: "Or type an artifact ID manually" },
  scan_manual_placeholder: { bm: "cth: keris-panjang", en: "e.g. keris-panjang" },
  scan_go: { bm: "Sahkan", en: "Confirm" },
  scan_invalid: { bm: "Kod tidak dikenali.", en: "Unrecognized code." },
  scan_not_found: { bm: "Artifak tidak ditemui.", en: "Artifact not found." },
  uq_offer_title: { bm: "Cabaran Unik Muncul!", en: "A Unique Challenge Appears!" },
  uq_offer_intro: { bm: "Anda telah membuka kuest rahsia. Terima untuk memulakan.", en: "You have unlocked a secret quest. Accept to begin." },
  uq_warn: { bm: "⚠︎ Semasa aktif, imbas kategori berbeza akan tolak 20 EXP dan gagalkan kuest.", en: "⚠︎ While active, scanning a different category deducts 20 EXP and fails the quest." },
  uq_accept: { bm: "Terima", en: "Accept" },
  uq_decline: { bm: "Tolak", en: "Decline" },
  uq_reward: { bm: "Ganjaran", en: "Reward" },
  uq_penalty: { bm: "Penalti", en: "Penalty" },
  uq_progress: { bm: "Kemajuan", en: "Progress" },
  uq_active_hint: { bm: "Kuest unik aktif — imbas artifak", en: "Unique quest active — scan an artifact of type" },
  uq_correct_bonus: { bm: "Bonus kuest unik", en: "Unique quest bonus" },
  uq_wrong_penalty: { bm: "Kuest unik gagal", en: "Unique quest failed" },
  profile_greeting: { bm: "Selamat datang kembali", en: "Welcome back" },
  profile_stats: { bm: "Statistik", en: "Stats" },
  profile_earned_badges: { bm: "Lencana Diperoleh", en: "Earned Badges" },
  profile_earned_ach: { bm: "Pencapaian Dibuka", en: "Unlocked Achievements" },
  view_all: { bm: "Lihat semua", en: "View all" },
  none_yet: { bm: "Belum ada.", en: "None yet." },
  ach_locked_hint: { bm: "Terus meneroka untuk membukanya.", en: "Keep exploring to unlock." },
  discovered_count: { bm: "Ditemui", en: "Discovered" },
  badges_count: { bm: "Lencana", en: "Badges" },
  ach_count: { bm: "Pencapaian", en: "Achievements" },
  journey_title: { bm: "Perjalanan Saya", en: "My Journey" },
  journey_kicker: { bm: "Log Pengembara", en: "Explorer Log" },
  journey_sub: { bm: "Semak semula setiap artifak yang telah anda temui.", en: "Revisit every artifact you have discovered." },
  journey_latest: { bm: "Terbaru", en: "Latest" },
  journey_btn: { bm: "Perjalanan", en: "Journey" },
  journey_hover_title: { bm: "Log Pengembara", en: "Explorer Log" },
  journey_hover_body: { bm: "Buka jurnal cenderamata anda — setiap artifak yang diimbas, disusun dari terbaru ke terlama dengan cap masa dunia sebenar.", en: "Open your keepsake journal — every artifact you've scanned, newest on top, with real-world timestamps." },
  reward_hover_gift_card: { bm: "Tebus buku mewarna, gantungan kunci dan lain-lain di kedai muzium dengan kad ini.", en: "Redeem coloring books, keychains and more at the museum store with this card." },
  reward_hover_disc15: { bm: "Diskaun 15% untuk pembelian di kedai. Nilai maksimum RM20.", en: "15% off any purchase at the museum store. Maximum value RM20." },
  reward_hover_disc30: { bm: "Diskaun 30% untuk pembelian di kedai. Nilai maksimum RM50.", en: "30% off any purchase at the museum store. Maximum value RM50." },
  reward_hover_poskad: { bm: "Poskad kolektor bergambar warisan Malaysia.", en: "Collectible postcard featuring Malaysian heritage." },
  reward_hover_magnet: { bm: "Magnet peti sejuk mini bertema muzium.", en: "Mini museum-themed fridge magnet." },
  reward_hover_tshirt: { bm: "Baju-T edisi HeritageQuest, katun premium.", en: "Limited HeritageQuest tee, premium cotton." },
} as const;

export type StringKey = keyof typeof STRINGS;

interface I18nCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (k: StringKey) => string;
}

const Ctx = createContext<I18nCtx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("bm");
  useEffect(() => {
    const stored = typeof window !== "undefined" ? (localStorage.getItem("mq_lang") as Lang | null) : null;
    if (stored === "bm" || stored === "en") setLangState(stored);
  }, []);
  const setLang = (l: Lang) => {
    setLangState(l);
    if (typeof window !== "undefined") localStorage.setItem("mq_lang", l);
  };
  const t = (k: StringKey) => STRINGS[k][lang];
  return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>;
}

export function useI18n() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useI18n must be inside I18nProvider");
  return c;
}
