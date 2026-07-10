import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Award, Sparkles, Trophy, Gift, Scroll, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { ExpBar } from "@/components/ExpBar";
import { BadgeMedallion } from "@/components/BadgeMedallion";
import { TOTAL_ARTIFACTS, type Rarity } from "@/lib/museum";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { sfx } from "@/lib/sfx";

export const Route = createFileRoute("/_authenticated/profile")({
  component: ProfilePage,
});

async function fetchProfile() {
  const { data: authData } = await supabase.auth.getUser();
  const uid = authData.user?.id;
  const [{ data: profile }, { data: prog }, { data: scanned }, { data: earnedBadges }, { data: earnedAch }, { data: allBadges }, { data: allAch }] = await Promise.all([
    supabase.from("profiles").select("username").eq("id", uid ?? "").maybeSingle(),
    supabase.from("user_progress").select("*").eq("user_id", uid ?? "").maybeSingle(),
    supabase.from("user_artifact_progress").select("artifact_id"),
    supabase.from("user_badges").select("badge_id, earned_at"),
    supabase.from("user_achievements").select("achievement_id, earned_at"),
    supabase.from("badges").select("*").order("sort_order"),
    supabase.from("achievements").select("*").order("sort_order"),
  ]);
  const earnedBadgeIds = new Set((earnedBadges ?? []).map((b) => b.badge_id));
  const earnedAchIds = new Set((earnedAch ?? []).map((a) => a.achievement_id));
  return {
    email: authData.user?.email ?? "",
    username: profile?.username ?? "explorer",
    exp: prog?.total_exp ?? 0,
    level: prog?.current_level ?? 1,
    points: prog?.discount_points ?? 0,
    scanCount: (scanned ?? []).length,
    badges: (allBadges ?? []).filter((b) => earnedBadgeIds.has(b.id)),
    achievements: (allAch ?? []).filter((a) => earnedAchIds.has(a.id)),
    totalBadges: (allBadges ?? []).length,
    totalAch: (allAch ?? []).length,
  };
}

function ProfilePage() {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const { data } = useQuery({ queryKey: ["profile"], queryFn: fetchProfile });
  if (!data) return <p className="text-sm text-muted-foreground">…</p>;

  function openJourney() {
    sfx.pop();
    setTimeout(() => sfx.tap(), 90);
    void navigate({ to: "/journey" });
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <section className="game-card overflow-hidden p-6">
        <div className="flex items-center gap-4">
          <div className="grid size-16 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary to-gold text-2xl text-primary-foreground shadow-lg">
            {data.username.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{t("profile_greeting")}</p>
            <h1 className="truncate font-display text-2xl leading-tight">{data.username}</h1>
            <p className="truncate text-xs text-muted-foreground">{data.email}</p>
          </div>
        </div>
        <div className="mt-5">
          <ExpBar exp={data.exp} />
        </div>
        <div className="mt-5 grid grid-cols-3 gap-2 text-center">
          <Stat icon={<Sparkles className="size-4" />} label={t("discovered_count")} value={`${data.scanCount}/${TOTAL_ARTIFACTS}`} />
          <Stat icon={<Award className="size-4" />}    label={t("badges_count")}      value={`${data.badges.length}/${data.totalBadges}`} />
          <Stat icon={<Trophy className="size-4" />}   label={t("ach_count")}         value={`${data.achievements.length}/${data.totalAch}`} />
        </div>
        <div className="mt-4 flex items-center justify-between rounded-2xl border-2 border-dashed border-gold/60 bg-gold/10 px-4 py-2">
          <div className="flex items-center gap-2">
            <Gift className="size-4 text-gold-foreground" />
            <span className="text-sm">{t("balance")}: <span className="font-display text-lg text-gold-foreground">{data.points}</span> {t("points")}</span>
          </div>
          <Link to="/rewards" className="bounce-soft rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground">{t("nav_rewards")}</Link>
        </div>

        {/* Journey CTA — hover reveals a detail card; click plays sfx and navigates. */}
        <HoverCard openDelay={120} closeDelay={80}>
          <HoverCardTrigger asChild>
            <button
              type="button"
              onClick={openJourney}
              onMouseEnter={() => sfx.tap()}
              className="group mt-3 flex w-full items-center gap-3 rounded-2xl border-2 border-border bg-gradient-to-br from-accent/60 to-secondary/50 px-4 py-3 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-lg active:scale-[0.98]"
              aria-label={t("journey_btn")}
            >
              <span className="grid size-11 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground shadow-sm transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110">
                <Scroll className="size-5" />
              </span>
              <span className="min-w-0 flex-1">
                <p className="font-display text-base leading-tight">{t("journey_btn")}</p>
                <p className="truncate text-xs text-muted-foreground">{t("journey_sub")}</p>
              </span>
              <ArrowRight className="size-4 text-muted-foreground transition-transform duration-200 group-hover:translate-x-1 group-hover:text-primary" />
            </button>
          </HoverCardTrigger>
          <HoverCardContent side="top" align="center" className="w-72 border-2 border-border bg-card">
            <div className="flex items-start gap-2">
              <Scroll className="mt-0.5 size-4 text-primary" />
              <div>
                <p className="font-display text-sm">{t("journey_hover_title")}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t("journey_hover_body")}</p>
              </div>
            </div>
          </HoverCardContent>
        </HoverCard>
      </section>

      <section className="game-card p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg">{t("profile_earned_badges")}</h2>
          <Link to="/achievements" className="text-xs text-muted-foreground hover:text-primary">{t("view_all")} →</Link>
        </div>
        {data.badges.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("none_yet")}</p>
        ) : (
          <div className="grid grid-cols-3 gap-4 sm:grid-cols-4">
            {data.badges.map((b) => (
              <BadgeMedallion key={b.id} icon={b.icon || "🏅"} label={lang === "bm" ? b.name_bm : b.name_en} rarity={(b.rarity ?? "common") as Rarity} size="md" />
            ))}
          </div>
        )}
      </section>

      <section className="game-card p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg">{t("profile_earned_ach")}</h2>
          <Link to="/achievements" className="text-xs text-muted-foreground hover:text-primary">{t("view_all")} →</Link>
        </div>
        {data.achievements.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("none_yet")}</p>
        ) : (
          <div className="grid grid-cols-3 gap-4 sm:grid-cols-4">
            {data.achievements.map((a) => (
              <BadgeMedallion key={a.id} icon={a.icon} label={lang === "bm" ? a.name_bm : a.name_en} rarity={(a.rarity ?? "common") as Rarity} size="md" />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border-2 border-border bg-card p-3">
      <div className="flex items-center justify-center gap-1 text-muted-foreground">{icon}<span className="text-[10px] uppercase tracking-widest">{label}</span></div>
      <p className="mt-1 font-display text-lg tabular-nums">{value}</p>
    </div>
  );
}
