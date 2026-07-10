import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Flag, Check, Lock, Sparkles, AlertTriangle, Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { CATEGORY_META, type CategoryKey } from "@/lib/museum";

export const Route = createFileRoute("/_authenticated/quests")({
  component: QuestsPage,
});

async function fetchQuests() {
  const [
    { data: quests },
    { data: done },
    { data: scanned },
    { data: artifacts },
    { data: uqTmpls },
    { data: userUq },
  ] = await Promise.all([
    supabase.from("quests").select("*").order("sort_order"),
    supabase.from("user_quests").select("quest_id"),
    supabase.from("user_artifact_progress").select("artifact_id"),
    supabase.from("artifacts").select("id,category,name_bm,name_en"),
    supabase.from("unique_quest_templates").select("*").order("sort_order"),
    supabase.from("user_unique_quests").select("*"),
  ]);
  const doneSet = new Set((done ?? []).map((q) => q.quest_id));
  const scannedSet = new Set((scanned ?? []).map((s) => s.artifact_id));
  const byCat: Record<string, string[]> = {};
  for (const a of artifacts ?? []) (byCat[a.category] ??= []).push(a.id);
  const uqByTmpl = new Map((userUq ?? []).map((u) => [u.template_id, u]));
  return { quests: quests ?? [], doneSet, scannedSet, byCat, uqTmpls: uqTmpls ?? [], uqByTmpl };
}

function QuestsPage() {
  const { t, lang } = useI18n();
  const { data } = useQuery({ queryKey: ["quests"], queryFn: fetchQuests });
  const quests = data?.quests ?? [];
  const uqTmpls = data?.uqTmpls ?? [];

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header>
        <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
          {t("nav_quests")}
        </p>
        <h1 className="font-display text-3xl">{t("nav_quests")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("quests_intro")}</p>
      </header>

      <section>
        <div className="mb-3 flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-full bg-gradient-to-br from-gold to-primary text-white shadow-md wiggle">
            <Sparkles className="size-4" />
          </span>
          <div>
            <h2 className="font-display text-xl">{t("quest_unique")}</h2>
            <p className="text-xs text-muted-foreground">{t("quest_unique_intro")}</p>
          </div>
        </div>
        <ul className="grid gap-3 sm:grid-cols-2">
          {uqTmpls.map((tmpl) => {
            const state = data?.uqByTmpl.get(tmpl.id);
            const status = state?.status ?? "unseen";
            const triggerScanned = data?.scannedSet.has(tmpl.trigger_artifact_id);
            const cat = tmpl.target_category as CategoryKey;
            const meta = CATEGORY_META[cat];
            const badgeText =
              status === "completed"
                ? t("quest_completed")
                : status === "active"
                  ? t("quest_active")
                  : status === "failed"
                    ? t("quest_failed")
                    : status === "declined"
                      ? t("quest_declined")
                      : triggerScanned
                        ? "-"
                        : t("locked");
            const badgeColor =
              status === "completed"
                ? "text-jungle border-jungle/40 bg-jungle/10"
                : status === "active"
                  ? "text-gold-foreground border-gold bg-gold/30"
                  : status === "failed"
                    ? "text-destructive border-destructive/40 bg-destructive/10"
                    : "text-muted-foreground";
            const locked = !triggerScanned && status === "unseen";
            return (
              <li
                key={tmpl.id}
                className={`game-card relative overflow-hidden p-4 ${status === "active" ? "border-gold" : ""}`}
              >
                {locked && (
                  <div className="absolute inset-0 z-10 grid place-items-center bg-card/85 backdrop-blur-sm">
                    <div className="text-center">
                      <Lock className="mx-auto size-6 text-muted-foreground" />
                      <p className="mt-1 text-xs text-muted-foreground">{t("locked")}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="grid size-10 place-items-center rounded-full text-lg"
                      style={{ background: meta.bg, color: meta.color }}
                    >
                      {meta.emoji}
                    </span>
                    <div>
                      <h3 className="font-display text-base leading-tight">
                        {lang === "bm" ? tmpl.name_bm : tmpl.name_en}
                      </h3>
                      <span className={`chip mt-1 ${badgeColor}`}>{badgeText}</span>
                    </div>
                  </div>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  {lang === "bm" ? tmpl.description_bm : tmpl.description_en}
                </p>
                <div className="mt-3 flex items-center gap-3">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-gold transition-all"
                      style={{
                        width: `${Math.min(100, ((state?.correct_scans ?? 0) / tmpl.target_count) * 100)}%`,
                      }}
                    />
                  </div>
                  <span className="tabular-nums text-[11px] text-muted-foreground">
                    {state?.correct_scans ?? 0}/{tmpl.target_count}
                  </span>
                </div>
                <div className="mt-3 flex gap-2 text-[11px]">
                  <span className="chip border-jungle/40 text-jungle">
                    <Sparkles className="size-3" /> x{tmpl.reward_multiplier} EXP
                  </span>
                  <span className="chip border-destructive/40 text-destructive">
                    <AlertTriangle className="size-3" /> -{tmpl.penalty_exp} EXP
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section>
        <div className="mb-3 flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-full bg-jungle text-white shadow-sm">
            <Flag className="size-4" />
          </span>
          <h2 className="font-display text-xl">{t("quest_normal")}</h2>
        </div>
        <ul className="space-y-3">
          {quests.map((q) => {
            const done = data?.doneSet.has(q.id) ?? false;
            const targetIds =
              q.type === "grand"
                ? Object.values(data?.byCat ?? {}).flat()
                : (data?.byCat[q.category ?? ""] ?? []);
            const progress = targetIds.filter((id) => data?.scannedSet.has(id)).length;
            const total = targetIds.length || 1;
            const pct = Math.round((progress / total) * 100);
            const cat = q.category as CategoryKey | null;
            const meta = cat && CATEGORY_META[cat] ? CATEGORY_META[cat] : null;
            return (
              <li
                key={q.id}
                className={`game-card p-4 ${q.type === "grand" ? "stamp-border" : ""}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2">
                    <span
                      className="grid size-10 place-items-center rounded-full text-lg"
                      style={
                        meta
                          ? { background: meta.bg, color: meta.color }
                          : { background: "oklch(0.94 0.06 70)", color: "oklch(0.6 0.15 60)" }
                      }
                    >
                      {q.type === "grand" ? (
                        <Trophy className="size-5" />
                      ) : (
                        (meta?.emoji ?? "target")
                      )}
                    </span>
                    <div>
                      <h3 className="font-display text-lg leading-tight">
                        {lang === "bm" ? q.name_bm : q.name_en}
                      </h3>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {lang === "bm" ? q.description_bm : q.description_en}
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-display text-lg text-primary">+{q.exp_reward}</p>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      EXP
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full bg-gradient-to-r from-jungle to-gold"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="tabular-nums text-xs text-muted-foreground">
                    {progress}/{total}
                  </span>
                  {done && (
                    <span className="inline-flex items-center gap-1 text-xs text-jungle">
                      <Check className="size-3" /> {t("quest_completed")}
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
