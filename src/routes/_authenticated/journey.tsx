import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Clock, Sparkles, Scroll } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { CATEGORY_META, type CategoryKey } from "@/lib/museum";

export const Route = createFileRoute("/_authenticated/journey")({
  component: JourneyPage,
});

async function fetchJourney() {
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) return [];
  const { data } = await supabase
    .from("user_artifact_progress")
    .select("artifact_id, scanned_at, artifacts(id, name_bm, name_en, category, image_url)")
    .eq("user_id", uid)
    .order("scanned_at", { ascending: false });
  return data ?? [];
}

function formatWhen(iso: string, lang: "bm" | "en"): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return lang === "bm" ? "baru sahaja" : "just now";
  if (mins < 60) return lang === "bm" ? `${mins} min lalu` : `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return lang === "bm" ? `${hrs} jam lalu` : `${hrs}h ago`;
  return d.toLocaleString(lang === "bm" ? "ms-MY" : "en-MY", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function JourneyPage() {
  const { t, lang } = useI18n();
  const { data, isLoading } = useQuery({ queryKey: ["journey"], queryFn: fetchJourney });

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <header className="flex items-center gap-3">
        <Link
          to="/profile"
          className="bounce-soft grid size-10 place-items-center rounded-full border-2 border-border bg-card shadow-sm"
          aria-label={t("back")}
        >
          <ArrowLeft className="size-4" />
        </Link>
        <div>
          <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
            {t("journey_kicker")}
          </p>
          <h1 className="font-display text-3xl leading-tight">{t("journey_title")}</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">{t("journey_sub")}</p>
        </div>
      </header>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">…</p>
      ) : !data || data.length === 0 ? (
        <div className="game-card grid place-items-center gap-3 p-10 text-center">
          <Scroll className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">{t("no_artifacts")}</p>
          <Link
            to="/scan"
            className="bounce-soft rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground"
          >
            {t("nav_scan")}
          </Link>
        </div>
      ) : (
        <ol className="space-y-3">
          {data.map((row, i) => {
            const art = (row as { artifacts?: { id: string; name_bm: string; name_en: string; category: string; image_url: string | null } | null }).artifacts;
            if (!art) return null;
            const cat = art.category as CategoryKey;
            const meta = CATEGORY_META[cat];
            const nm = lang === "bm" ? art.name_bm : art.name_en;
            const isLatest = i === 0;
            return (
              <li
                key={`${row.artifact_id}-${row.scanned_at}`}
                className={`game-card relative flex items-center gap-4 p-3 transition-transform hover:-translate-y-0.5 ${
                  isLatest ? "ring-2 ring-primary/50" : ""
                }`}
              >
                <div
                  className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-2xl text-3xl"
                  style={{ background: meta.bg }}
                >
                  {art.image_url ? (
                    <img src={art.image_url} alt={nm} className="h-full w-full object-contain p-1.5" />
                  ) : (
                    <span>{meta.emoji}</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="rounded-full px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest"
                      style={{ background: meta.bg, color: meta.color }}
                    >
                      {meta.emoji} {t(`category_${cat}` as never)}
                    </span>
                    {isLatest && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-primary">
                        <Sparkles className="size-2.5" /> {t("journey_latest")}
                      </span>
                    )}
                  </div>
                  <h3 className="mt-0.5 truncate font-display text-lg leading-tight">{nm}</h3>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="size-3" />
                    {formatWhen(row.scanned_at, lang)}
                    <span className="text-muted-foreground/60">·</span>
                    <span className="tabular-nums">
                      {new Date(row.scanned_at).toLocaleDateString(lang === "bm" ? "ms-MY" : "en-MY", {
                        year: "numeric",
                        month: "short",
                        day: "2-digit",
                      })}
                    </span>
                  </p>
                </div>
                <div className="hidden shrink-0 text-right font-mono text-[10px] uppercase tracking-widest text-muted-foreground sm:block">
                  #{data.length - i}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
