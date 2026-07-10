import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ArrowLeft, Check, Sparkles, Flag, Award, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { scanArtifact } from "@/lib/museum.functions";
import { EXP_PER_SCAN } from "@/lib/museum";
import { sfx } from "@/lib/sfx";

export const Route = createFileRoute("/_authenticated/artifact/$id")({
  component: ArtifactPage,
});

async function fetchArtifact(id: string) {
  const [{ data: artifact }, { data: mine }] = await Promise.all([
    supabase.from("artifacts").select("*").eq("id", id).maybeSingle(),
    supabase.from("user_artifact_progress").select("artifact_id, scanned_at, exp_earned").eq("artifact_id", id).maybeSingle(),
  ]);
  return { artifact, mine };
}

interface ScanResult {
  alreadyScanned: boolean;
  expGained: number;
  totalExp: number;
  level: number;
  levelUps: number;
  pointsGained: number;
  totalPoints: number;
  newBadges: string[];
  newQuests: string[];
}

function ArtifactPage() {
  const { id } = Route.useParams();
  const { t, lang } = useI18n();
  const qc = useQueryClient();
  const router = useRouter();
  const scanFn = useServerFn(scanArtifact);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);

  const { data, isLoading } = useQuery({ queryKey: ["artifact", id], queryFn: () => fetchArtifact(id) });
  const artifact = data?.artifact;
  const alreadyClaimed = !!data?.mine;

  async function claim() {
    setBusy(true);
    try {
      const res = (await scanFn({ data: { artifactId: id } })) as ScanResult;
      setResult(res);
      if (res.levelUps > 0) sfx.levelUp(); else sfx.success();
      if (res.newBadges.length > 0) setTimeout(() => sfx.coin(), 400);
      qc.invalidateQueries();
      router.invalidate();
    } finally { setBusy(false); }
  }

  if (isLoading) return <p className="text-sm text-muted-foreground">…</p>;
  if (!artifact) return <p className="text-sm">Not found.</p>;

  const name = lang === "bm" ? artifact.name_bm : artifact.name_en;
  const desc = lang === "bm" ? artifact.description_bm : artifact.description_en;
  const era = lang === "bm" ? artifact.era_bm : artifact.era_en;
  const origin = lang === "bm" ? artifact.origin_bm : artifact.origin_en;
  const material = lang === "bm" ? artifact.material_bm : artifact.material_en;

  return (
    <div className="mx-auto max-w-3xl">
      <Link to="/map" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-ink">
        <ArrowLeft className="size-4" /> {t("back")}
      </Link>

      <article className="paper-card overflow-hidden">
        {/* Cute rounded header */}
        <div className="relative border-b border-border bg-gradient-to-br from-accent to-secondary px-6 py-8">
          <div className="absolute inset-x-4 top-4 flex justify-between text-[10px] uppercase tracking-[0.35em] text-muted-foreground">
            <span>{t("tagline")}</span>
            <span>№ {artifact.sort_order.toString().padStart(3, "0")}</span>
          </div>
          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.3em] text-primary">
            {t(`category_${artifact.category}` as never)}
          </p>
          <h1 className="mt-2 font-display text-4xl leading-tight text-ink">{name}</h1>
        </div>

        <div className="grid gap-6 p-6 md:grid-cols-3">
          <dl className="space-y-3 text-sm md:col-span-1">
            <div>
              <dt className="text-[10px] uppercase tracking-widest text-muted-foreground">{t("era")}</dt>
              <dd className="font-display text-base">{era}</dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase tracking-widest text-muted-foreground">{t("origin")}</dt>
              <dd className="font-display text-base">{origin}</dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase tracking-widest text-muted-foreground">{t("material")}</dt>
              <dd className="font-display text-base">{material}</dd>
            </div>
          </dl>
          <p className="text-base leading-relaxed text-foreground/90 md:col-span-2">{desc}</p>
        </div>

        <div className="border-t border-border bg-accent/40 p-6">
          {alreadyClaimed && !result ? (
            <div className="flex items-center gap-2 text-sm text-jungle">
              <Check className="size-4" />
              {t("already_claimed")} · +{data?.mine?.exp_earned ?? EXP_PER_SCAN} EXP
            </div>
          ) : result ? (
            <RewardSummary result={result} />
          ) : (
            <button
              onClick={claim}
              disabled={busy}
              className="bounce-soft inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-md disabled:opacity-60"
            >
              <Sparkles className="size-4" />
              {busy ? "…" : t("claim_exp")}
            </button>
          )}
        </div>
      </article>
    </div>
  );
}

function RewardSummary({ result }: { result: ScanResult }) {
  const { t, lang } = useI18n();
  return (
    <div className="space-y-3 pop-in">
      <p className="font-display text-3xl text-primary">+{result.expGained} {t("exp")} ✨</p>
      {result.levelUps > 0 && (
        <div className="flex items-center gap-2 text-sm">
          <TrendingUp className="size-4 text-gold" />
          {t("level_up")} → Lv. {result.level} (+{result.pointsGained} {t("points")})
        </div>
      )}
      {result.newQuests.length > 0 && (
        <div className="flex items-center gap-2 text-sm">
          <Flag className="size-4 text-jungle" />
          {t("quest_done")}: {result.newQuests.length}
        </div>
      )}
      {result.newBadges.length > 0 && (
        <div className="flex items-center gap-2 text-sm">
          <Award className="size-4 text-primary" />
          {t("new_badge")}: {result.newBadges.length}
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        {lang === "bm" ? "Rekod telah disimpan. Kembali ke peta." : "Recorded. Head back to the map."}
      </p>
    </div>
  );
}
