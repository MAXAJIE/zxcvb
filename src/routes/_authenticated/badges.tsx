import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Sparkles, Flag, TrendingUp, Crown, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/badges")({
  component: BadgesPage,
});

const ICONS: Record<string, typeof Sparkles> = {
  sparkles: Sparkles,
  flag: Flag,
  "trending-up": TrendingUp,
  crown: Crown,
};

async function fetchBadges() {
  const [{ data: badges }, { data: earned }] = await Promise.all([
    supabase.from("badges").select("*").order("sort_order"),
    supabase.from("user_badges").select("badge_id, earned_at"),
  ]);
  const earnedMap = new Map((earned ?? []).map((b) => [b.badge_id, b.earned_at]));
  return { badges: badges ?? [], earnedMap };
}

function BadgesPage() {
  const { t, lang } = useI18n();
  const { data } = useQuery({ queryKey: ["badges"], queryFn: fetchBadges });
  const badges = data?.badges ?? [];
  return (
    <div className="mx-auto max-w-4xl">
      <header className="mb-6">
        <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">{t("nav_badges")}</p>
        <h1 className="font-display text-3xl">{t("nav_badges")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("badges_intro")}</p>
      </header>
      <ul className="grid gap-4 sm:grid-cols-2">
        {badges.map((b) => {
          const earnedAt = data?.earnedMap.get(b.id);
          const earned = !!earnedAt;
          const Icon = ICONS[b.icon] ?? Sparkles;
          return (
            <li key={b.id} className={`paper-card flex items-center gap-4 p-5 ${earned ? "" : "opacity-60"}`}>
              <div className={`grid size-14 shrink-0 place-items-center rounded-full ${earned ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                {earned ? <Icon className="size-6" /> : <Lock className="size-5" />}
              </div>
              <div>
                <h3 className="font-display text-lg">{lang === "bm" ? b.name_bm : b.name_en}</h3>
                <p className="text-sm text-muted-foreground">{lang === "bm" ? b.description_bm : b.description_en}</p>
                <p className="mt-1 text-[10px] uppercase tracking-widest text-muted-foreground">
                  {earned ? `${t("earned")} · ${new Date(earnedAt!).toLocaleDateString()}` : t("locked")}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
