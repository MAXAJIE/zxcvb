import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Gift, Mail, Ticket, Percent, Shirt, Magnet, Check, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n, type StringKey } from "@/lib/i18n";
import { redeemSouvenir } from "@/lib/museum.functions";
import { sfx } from "@/lib/sfx";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";

export const Route = createFileRoute("/_authenticated/rewards")({
  component: RewardsPage,
});

const ICONS: Record<string, typeof Gift> = {
  gift: Gift, mail: Mail, ticket: Ticket, percent: Percent, shirt: Shirt, magnet: Magnet,
};

// Per-souvenir hover-card copy key. Falls back to a generic hint if unknown.
const HOVER_KEY: Record<string, StringKey> = {
  "gift-card":   "reward_hover_gift_card",
  "discount-15": "reward_hover_disc15",
  "discount-30": "reward_hover_disc30",
  "poskad":      "reward_hover_poskad",
  "magnet":      "reward_hover_magnet",
  "baju-t":      "reward_hover_tshirt",
};

async function fetchRewards() {
  const [{ data: souvenirs }, { data: prog }, { data: reds }] = await Promise.all([
    supabase.from("souvenirs").select("*").order("sort_order"),
    supabase.from("user_progress").select("discount_points").maybeSingle(),
    supabase.from("redemptions").select("souvenir_id, redeemed_at").order("redeemed_at", { ascending: false }),
  ]);
  return { souvenirs: souvenirs ?? [], balance: prog?.discount_points ?? 0, redemptions: reds ?? [] };
}

function RewardsPage() {
  const { t, lang } = useI18n();
  const qc = useQueryClient();
  const redeem = useServerFn(redeemSouvenir);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [flash, setFlash] = useState<{ id: string; kind: "ok" | "err" } | null>(null);

  const { data } = useQuery({ queryKey: ["rewards"], queryFn: fetchRewards });

  async function onRedeem(id: string) {
    setBusyId(id); setFlash(null);
    try {
      const res = await redeem({ data: { souvenirId: id } });
      setFlash({ id, kind: res.ok ? "ok" : "err" });
      if (res.ok) sfx.coin(); else sfx.error();
      qc.invalidateQueries();
    } finally { setBusyId(null); setTimeout(() => setFlash(null), 2500); }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <header className="mb-6 flex items-end justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">{t("nav_rewards")}</p>
          <h1 className="font-display text-3xl">{t("nav_rewards")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("rewards_intro")}</p>
        </div>
        <div className="paper-card px-5 py-3 text-right">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{t("balance")}</p>
          <p className="font-display text-3xl text-primary">{data?.balance ?? 0}</p>
        </div>
      </header>

      <ul className="grid gap-4 sm:grid-cols-2">
        {(data?.souvenirs ?? []).map((s) => {
          const Icon = ICONS[s.icon] ?? Gift;
          const affordable = (data?.balance ?? 0) >= s.cost_points;
          const isBusy = busyId === s.id;
          const hoverKey = HOVER_KEY[s.id];
          return (
            <li key={s.id} className="paper-card group flex items-center gap-4 p-5 transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-lg">
              <div className="grid size-14 shrink-0 place-items-center rounded-full bg-accent text-accent-foreground transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-105">
                <Icon className="size-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-display text-lg">{lang === "bm" ? s.name_bm : s.name_en}</h3>
                  {hoverKey && (
                    <HoverCard openDelay={80} closeDelay={80}>
                      <HoverCardTrigger asChild>
                        <button
                          type="button"
                          aria-label="details"
                          onMouseEnter={() => sfx.tap()}
                          className="grid size-5 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                        >
                          <Info className="size-3.5" />
                        </button>
                      </HoverCardTrigger>
                      <HoverCardContent side="top" align="start" className="w-64 border-2 border-border bg-card">
                        <div className="flex items-start gap-2">
                          <Icon className="mt-0.5 size-4 text-primary" />
                          <p className="text-xs leading-relaxed text-foreground/85">
                            {t(hoverKey)}
                          </p>
                        </div>
                      </HoverCardContent>
                    </HoverCard>
                  )}
                </div>
                <p className="mt-0.5 text-sm text-muted-foreground">{s.cost_points} {t("points")}</p>
                {flash?.id === s.id && flash.kind === "ok" && (
                  <p className="mt-1 text-xs text-jungle">{t("redeemed")}</p>
                )}
                {flash?.id === s.id && flash.kind === "err" && (
                  <p className="mt-1 text-xs text-destructive">{t("insufficient")}</p>
                )}
              </div>
              <button
                disabled={!affordable || isBusy}
                onClick={() => onRedeem(s.id)}
                className="bounce-soft rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-40"
              >
                {isBusy ? "…" : t("redeem")}
              </button>
            </li>
          );
        })}
      </ul>

      {data && data.redemptions.length > 0 && (
        <section className="mt-10">
          <h2 className="font-display text-lg">{lang === "bm" ? "Sejarah Tebusan" : "Redemption History"}</h2>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            {data.redemptions.slice(0, 10).map((r, i) => {
              const s = data.souvenirs.find((x) => x.id === r.souvenir_id);
              return (
                <li key={i} className="flex items-center gap-2">
                  <Check className="size-3 text-jungle" />
                  {s ? (lang === "bm" ? s.name_bm : s.name_en) : r.souvenir_id}
                  <span className="text-xs">· {new Date(r.redeemed_at).toLocaleString()}</span>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
