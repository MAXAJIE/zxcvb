import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { artifactImageUrl } from "@/lib/artifact-images";
import { TOTAL_ARTIFACTS } from "@/lib/museum";

export const Route = createFileRoute("/_authenticated/journal")({
  component: JournalPage,
});

async function fetchJournal() {
  const [
    { data: prog },
    { data: scans },
    { data: artifacts },
    { data: badges },
    { data: earnedBadges },
    { data: quests },
    { data: doneQuests },
  ] = await Promise.all([
    supabase.from("user_progress").select("*").maybeSingle(),
    supabase.from("user_artifact_progress").select("*").order("scanned_at"),
    supabase.from("artifacts").select("*"),
    supabase.from("badges").select("*").order("sort_order"),
    supabase.from("user_badges").select("badge_id"),
    supabase.from("quests").select("*").order("sort_order"),
    supabase.from("user_quests").select("quest_id"),
  ]);
  const artMap = new Map((artifacts ?? []).map((a) => [a.id, a]));
  const badgeSet = new Set((earnedBadges ?? []).map((b) => b.badge_id));
  const questSet = new Set((doneQuests ?? []).map((q) => q.quest_id));
  return {
    prog,
    scans: scans ?? [],
    artMap,
    badges: (badges ?? []).filter((b) => badgeSet.has(b.id)),
    quests: (quests ?? []).filter((q) => questSet.has(q.id)),
  };
}

function JournalPage() {
  const { t, lang } = useI18n();
  const { data } = useQuery({ queryKey: ["journal"], queryFn: fetchJournal });

  if (!data) return null;

  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-6">
        <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
          {t("journal_title")}
        </p>
        <h1 className="font-display text-4xl">{t("journal_title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("journal_sub")}</p>
      </header>

      <section className="paper-card mb-6 grid grid-cols-3 gap-4 p-5">
        <Stat label={t("total_exp")} value={String(data.prog?.total_exp ?? 0)} />
        <Stat label={t("level")} value={String(data.prog?.current_level ?? 1)} />
        <Stat label={t("points")} value={String(data.prog?.discount_points ?? 0)} />
      </section>

      <section className="paper-card p-5">
        <div className="ornament-rule mb-4 text-xs uppercase tracking-[0.25em] text-muted-foreground">
          <span>
            {lang === "bm" ? "Artifak Ditemui" : "Artifacts Discovered"} · {data.scans.length}/
            {TOTAL_ARTIFACTS}
          </span>
        </div>
        {data.scans.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("no_artifacts")}</p>
        ) : (
          <ol className="space-y-3">
            {data.scans.map((s, i) => {
              const a = data.artMap.get(s.artifact_id);
              if (!a) return null;
              const name = lang === "bm" ? a.name_bm : a.name_en;
              const imageUrl = artifactImageUrl(a.id, a.image_url);
              return (
                <li key={s.artifact_id} className="flex gap-3">
                  <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full border border-border text-xs font-display">
                    {i + 1}
                  </span>
                  {imageUrl && (
                    <img
                      src={imageUrl}
                      alt={name}
                      className="size-16 shrink-0 rounded-2xl border border-border bg-accent/40 object-contain p-1.5"
                      loading="lazy"
                    />
                  )}
                  <div className="flex-1">
                    <p className="font-display text-base">{name}</p>
                    <p className="text-xs text-muted-foreground">
                      {lang === "bm" ? a.era_bm : a.era_en} ·{" "}
                      {lang === "bm" ? a.origin_bm : a.origin_en}
                    </p>
                    <p className="mt-1 line-clamp-2 text-sm text-foreground/80">
                      {lang === "bm" ? a.description_bm : a.description_en}
                    </p>
                  </div>
                  <span className="shrink-0 self-start text-xs text-primary">+{s.exp_earned}</span>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      {data.quests.length > 0 && (
        <section className="paper-card mt-6 p-5">
          <div className="ornament-rule mb-3 text-xs uppercase tracking-[0.25em] text-muted-foreground">
            <span>{t("nav_quests")}</span>
          </div>
          <ul className="space-y-1 text-sm">
            {data.quests.map((q) => (
              <li key={q.id}>
                · {lang === "bm" ? q.name_bm : q.name_en}{" "}
                <span className="text-primary">+{q.exp_reward}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {data.badges.length > 0 && (
        <section className="paper-card mt-6 p-5">
          <div className="ornament-rule mb-3 text-xs uppercase tracking-[0.25em] text-muted-foreground">
            <span>{t("nav_badges")}</span>
          </div>
          <ul className="flex flex-wrap gap-2">
            {data.badges.map((b) => (
              <li key={b.id} className="rounded-full bg-accent px-3 py-1 text-xs">
                {lang === "bm" ? b.name_bm : b.name_en}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="font-display text-2xl text-ink">{value}</p>
    </div>
  );
}
