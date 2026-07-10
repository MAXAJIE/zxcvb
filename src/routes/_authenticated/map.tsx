import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { CATEGORY_ORDER, CATEGORY_META, PIN_POSITIONS, ZONE_LAYOUT, TOTAL_ARTIFACTS, type CategoryKey } from "@/lib/museum";

export const Route = createFileRoute("/_authenticated/map")({
  component: MapPage,
});

async function fetchMap() {
  const [{ data: artifacts }, { data: scanned }] = await Promise.all([
    supabase.from("artifacts").select("id,category,name_bm,name_en,sort_order,image_url").order("sort_order"),
    supabase.from("user_artifact_progress").select("artifact_id"),
  ]);
  const set = new Set((scanned ?? []).map((r) => r.artifact_id));
  return { artifacts: artifacts ?? [], scannedSet: set };
}

function MapPage() {
  const { t, lang } = useI18n();
  const { data } = useQuery({ queryKey: ["map"], queryFn: fetchMap });
  const artifacts = data?.artifacts ?? [];
  const scannedSet = data?.scannedSet ?? new Set<string>();
  const totalScanned = scannedSet.size;
  const pct = Math.round((totalScanned / TOTAL_ARTIFACTS) * 100);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <section className="game-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">{t("tagline")}</p>
            <h1 className="font-display text-2xl">{t("nav_map")}</h1>
          </div>
          <div className="text-right">
            <p className="font-display text-2xl text-primary">{totalScanned}<span className="text-muted-foreground text-sm">/{TOTAL_ARTIFACTS}</span></p>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{t("discovered_count")}</p>
          </div>
        </div>
        <div className="mb-3 h-2 overflow-hidden rounded-full border border-border bg-muted">
          <div className="h-full bg-gradient-to-r from-primary to-gold transition-all" style={{ width: `${pct}%` }} />
        </div>
        <div className="relative overflow-hidden rounded-2xl border-2 border-border bg-parchment">
          <svg viewBox="0 0 100 100" className="block h-auto w-full">
            {CATEGORY_ORDER.map((cat) => {
              const z = ZONE_LAYOUT[cat];
              const meta = CATEGORY_META[cat];
              const items = artifacts.filter((a) => a.category === cat);
              const done = items.filter((a) => scannedSet.has(a.id)).length;
              const zonePct = items.length ? done / items.length : 0;
              return (
                <g key={cat}>
                  <rect
                    x={z.x} y={z.y} width={z.w} height={z.h} rx={3}
                    fill={meta.bg}
                    stroke={meta.color}
                    strokeOpacity={0.55}
                    strokeWidth={0.4}
                  />
                  {/* fill wash proportional to progress */}
                  <rect
                    x={z.x} y={z.y + z.h * (1 - zonePct)} width={z.w} height={z.h * zonePct} rx={3}
                    fill={meta.color} fillOpacity={0.12}
                  />
                  <text x={z.x + 2} y={z.y + 4.2} fontSize={2.6} fill={meta.color} fontFamily="Fredoka, sans-serif" fontWeight={600}>
                    {lang === "bm" ? z.label_bm : z.label_en}
                  </text>
                  <text x={z.x + z.w - 2} y={z.y + 4.2} fontSize={2.4} textAnchor="end" fill={meta.color} fontFamily="Fredoka, sans-serif">
                    {done}/{items.length}
                  </text>
                </g>
              );
            })}
            <line x1={50} y1={6} x2={50} y2={94} stroke="oklch(0.5 0.05 40 / 0.2)" strokeWidth={0.25} strokeDasharray="0.6 0.6" />
            <line x1={4} y1={50} x2={96} y2={50} stroke="oklch(0.5 0.05 40 / 0.2)" strokeWidth={0.25} strokeDasharray="0.6 0.6" />
            {artifacts.map((a) => {
              const p = PIN_POSITIONS[a.id];
              if (!p) return null;
              const isScanned = scannedSet.has(a.id);
              const meta = CATEGORY_META[a.category as CategoryKey];
              return (
                <g key={a.id}>
                  {isScanned ? (
                    <>
                      <circle cx={p.x} cy={p.y} r={2.6} fill={meta.color} stroke="oklch(1 0 0)" strokeWidth={0.5} />
                      <circle cx={p.x} cy={p.y} r={0.9} fill="oklch(1 0 0)" />
                    </>
                  ) : (
                    <>
                      <circle cx={p.x} cy={p.y} r={2.6} fill="oklch(0.94 0.01 80)" stroke="oklch(0.6 0.03 260 / 0.5)" strokeWidth={0.3} strokeDasharray="0.5 0.5" />
                      <text x={p.x} y={p.y + 1} fontSize={2.4} textAnchor="middle" fill="oklch(0.6 0.03 260)" fontFamily="Fredoka">?</text>
                    </>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">{t("scan_hint")}</p>
      </section>

      <section className="space-y-4">
        {CATEGORY_ORDER.map((cat) => {
          const items = artifacts.filter((a) => a.category === cat);
          const scannedCount = items.filter((a) => scannedSet.has(a.id)).length;
          const meta = CATEGORY_META[cat];
          return (
            <div key={cat} className="game-card p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="grid size-8 place-items-center rounded-full text-lg" style={{ background: meta.bg, color: meta.color }}>{meta.emoji}</span>
                  <h3 className="font-display text-lg leading-none">{t(`category_${cat}` as `category_${CategoryKey}`)}</h3>
                </div>
                <span className="chip">{scannedCount}/{items.length}</span>
              </div>
              <ul className="grid grid-cols-3 gap-2">
                {items.map((a) => {
                  const done = scannedSet.has(a.id);
                  return (
                    <li key={a.id} className="relative">
                      <div className={`aspect-square overflow-hidden rounded-2xl border-2 ${done ? "border-primary/40" : "border-dashed border-border"} bg-accent/40`}>
                        {done && a.image_url ? (
                          <img src={a.image_url} alt={lang === "bm" ? a.name_bm : a.name_en} className="h-full w-full object-cover" loading="lazy" width={256} height={256} />
                        ) : (
                          <div className="grid h-full w-full place-items-center text-muted-foreground">
                            <Lock className="size-6" />
                          </div>
                        )}
                      </div>
                      <p className={`mt-1 truncate text-center text-[11px] font-semibold ${done ? "text-ink" : "text-muted-foreground"}`}>
                        {done ? (lang === "bm" ? a.name_bm : a.name_en) : "???"}
                      </p>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </section>
    </div>
  );
}
