import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { BadgeMedallion } from "@/components/BadgeMedallion";
import { RARITY_STYLE, type Rarity } from "@/lib/museum";

export const Route = createFileRoute("/_authenticated/achievements")({
  component: AchievementsPage,
});

async function fetchAll() {
  const [{ data: badges }, { data: achievements }, { data: earnedBadges }, { data: earnedAch }] = await Promise.all([
    supabase.from("badges").select("*").order("sort_order"),
    supabase.from("achievements").select("*").order("sort_order"),
    supabase.from("user_badges").select("badge_id"),
    supabase.from("user_achievements").select("achievement_id"),
  ]);
  return {
    badges: badges ?? [],
    achievements: achievements ?? [],
    earnedBadgeIds: new Set((earnedBadges ?? []).map((b) => b.badge_id)),
    earnedAchIds: new Set((earnedAch ?? []).map((a) => a.achievement_id)),
  };
}

function AchievementsPage() {
  const { t, lang } = useI18n();
  const { data } = useQuery({ queryKey: ["achievements-full"], queryFn: fetchAll });
  if (!data) return <p className="text-sm text-muted-foreground">…</p>;

  const totalUnlocked = [...data.earnedAchIds].length + [...data.earnedBadgeIds].length;
  const total = data.achievements.length + data.badges.length;

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <header>
        <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">{t("nav_achievements")}</p>
        <h1 className="font-display text-3xl">{t("nav_achievements")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("ach_locked_hint")} · <span className="font-display text-ink">{totalUnlocked}/{total}</span></p>
      </header>

      <Section title={t("nav_achievements")}>
        <Grid>
          {data.achievements.map((a) => {
            const unlocked = data.earnedAchIds.has(a.id);
            return (
              <Cell key={a.id} rarity={(a.rarity ?? "common") as Rarity} unlocked={unlocked}
                    icon={a.icon} name={lang === "bm" ? a.name_bm : a.name_en}
                    desc={lang === "bm" ? a.description_bm : a.description_en} />
            );
          })}
        </Grid>
      </Section>

      <Section title={t("nav_badges")}>
        <Grid>
          {data.badges.map((b) => {
            const unlocked = data.earnedBadgeIds.has(b.id);
            return (
              <Cell key={b.id} rarity={(b.rarity ?? "common") as Rarity} unlocked={unlocked}
                    icon={b.icon || "🏅"} name={lang === "bm" ? b.name_bm : b.name_en}
                    desc={lang === "bm" ? b.description_bm : b.description_en} />
            );
          })}
        </Grid>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-4 font-display text-xl">{title}</h2>
      {children}
    </section>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">{children}</div>;
}

function Cell({ icon, name, desc, rarity, unlocked }: { icon: string; name: string; desc: string; rarity: Rarity; unlocked: boolean }) {
  const { t } = useI18n();
  return (
    <div className={`game-card flex flex-col items-center gap-2 p-4 ${!unlocked ? "opacity-90" : ""}`}>
      <BadgeMedallion icon={icon} label={unlocked ? name : "???"} rarity={rarity} locked={!unlocked} size="md" />
      <p className="text-center text-xs text-muted-foreground">{unlocked ? desc : t("ach_locked_hint")}</p>
      <span className="chip mt-auto" style={{ borderColor: RARITY_STYLE[rarity].ring, color: RARITY_STYLE[rarity].ring }}>
        {rarity}
      </span>
    </div>
  );
}
