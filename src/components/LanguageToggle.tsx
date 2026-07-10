import { useI18n, type Lang } from "@/lib/i18n";

export function LanguageToggle() {
  const { lang, setLang } = useI18n();
  const btn = (l: Lang, label: string) => (
    <button
      key={l}
      type="button"
      onClick={() => setLang(l)}
      className={`px-3 py-1 text-xs font-medium transition ${
        lang === l ? "bg-ink text-parchment" : "text-muted-foreground hover:text-ink"
      }`}
      aria-pressed={lang === l}
    >
      {label}
    </button>
  );
  return (
    <div className="inline-flex overflow-hidden rounded-full border border-border bg-card">
      {btn("bm", "BM")}
      {btn("en", "EN")}
    </div>
  );
}
