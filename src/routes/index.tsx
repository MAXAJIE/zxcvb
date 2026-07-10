import { createFileRoute, Link } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";
import { LanguageToggle } from "@/components/LanguageToggle";
import { sfx } from "@/lib/sfx";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  const { t, lang } = useI18n();
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute -left-16 top-20 size-64 rounded-full bg-primary/30 blur-3xl float-y" />
      <div aria-hidden className="pointer-events-none absolute -right-20 top-40 size-72 rounded-full bg-jungle/25 blur-3xl float-y" style={{ animationDelay: "1s" }} />
      <div aria-hidden className="pointer-events-none absolute bottom-0 left-1/3 size-80 rounded-full bg-indigo/25 blur-3xl float-y" style={{ animationDelay: "2s" }} />

      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-full bg-primary text-primary-foreground font-display text-xl shadow-sm wiggle">✿</div>
          <div>
            <p className="font-display text-xl leading-none">HeritageQuest</p>
            <p className="text-xs text-muted-foreground">{t("tagline")}</p>
          </div>
        </div>
        <LanguageToggle />
      </header>

      <main className="mx-auto max-w-3xl px-6 pb-16 pt-8 md:pt-16">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1 text-xs font-semibold uppercase tracking-widest text-accent-foreground pop-in">
          <span className="size-1.5 rounded-full bg-primary" /> Est. 2026
        </div>
        <h1 className="font-display text-5xl leading-tight text-ink md:text-6xl pop-in">
          {lang === "bm" ? "Setiap penemuan menyimpan sebuah kisah." : "Every discovery keeps a story."}
        </h1>
        <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg pop-in" style={{ animationDelay: "0.1s" }}>
          {t("landing_body")}
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-4 pop-in" style={{ animationDelay: "0.2s" }}>
          <Link
            to="/scan"
            onClick={() => sfx.pop()}
            className="bounce-soft inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 font-semibold text-primary-foreground shadow-md"
          >
            {t("landing_cta")}
            <span aria-hidden>→</span>
          </Link>
        </div>

        <div className="mt-16 grid gap-4 md:grid-cols-3">
          {[
            { emoji: "📷", bm: "Imbas", en: "Scan", desc_bm: "Kod QR pada label.", desc_en: "QR codes on labels." },
            { emoji: "✨", bm: "Terokai", en: "Discover", desc_bm: "Kisah setiap warisan.", desc_en: "The story behind each piece." },
            { emoji: "🏆", bm: "Kumpul", en: "Collect", desc_bm: "EXP, lencana & pencapaian.", desc_en: "EXP, badges & achievements." },
          ].map((s, i) => (
            <div key={i} className="paper-card p-5 pop-in" style={{ animationDelay: `${0.3 + i * 0.1}s` }}>
              <div className="text-3xl">{s.emoji}</div>
              <p className="mt-2 font-display text-lg">{lang === "bm" ? s.bm : s.en}</p>
              <p className="mt-1 text-sm text-muted-foreground">{lang === "bm" ? s.desc_bm : s.desc_en}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
