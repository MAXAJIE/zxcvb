import { useEffect, useState } from "react";
import {
  Sparkles,
  TrendingUp,
  Award,
  Flag,
  AlertTriangle,
  Landmark,
  MapPin,
  Layers,
  ScrollText,
  FileText,
  Image as ImageIcon,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { CATEGORY_META, type CategoryKey } from "@/lib/museum";
import type { ScanResult } from "@/lib/museum.functions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";

interface Props {
  result: ScanResult;
  onClose: () => void;
}

// Rebuilt to match the reference "last-phase recommendation card" pop-up:
// shadcn Dialog wrapping a header, a Carousel image gallery with an
// index counter, a tag row, a structured specs grid, a description block,
// an AI-remarks-style story block, and a reward strip footer.
// Theme + color palette intentionally left untouched.
export function ArtifactModal({ result, onClose }: Props) {
  const { t, lang } = useI18n();
  const a = result.artifact;
  const cat = a.category as CategoryKey;
  const meta = CATEGORY_META[cat];

  const name = lang === "bm" ? a.name_bm : a.name_en;
  const desc = lang === "bm" ? a.description_bm : a.description_en;
  const era = lang === "bm" ? a.era_bm : a.era_en;
  const origin = lang === "bm" ? a.origin_bm : a.origin_en;
  const material = lang === "bm" ? a.material_bm : a.material_en;

  // Single canonical image for now — kept in a gallery array so the
  // Carousel structure matches the reference and can grow to N images
  // without changing the render code.
  const gallery: string[] = a.image_url ? [a.image_url] : [];
  const total = gallery.length;

  const [api, setApi] = useState<CarouselApi | null>(null);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!api) return;
    const update = () => setIndex(api.selectedScrollSnap());
    update();
    api.on("select", update);
    const autoplay = total > 1 ? setInterval(() => api.scrollNext(), 3200) : null;
    return () => {
      api.off("select", update);
      if (autoplay) clearInterval(autoplay);
    };
  }, [api, total]);

  const uq = result.uniqueQuest;

  const specs: { label: string; value: string; icon: React.ReactNode }[] = [];
  if (era)      specs.push({ label: t("era"),      value: era,      icon: <ScrollText className="h-3.5 w-3.5" /> });
  if (origin)   specs.push({ label: t("origin"),   value: origin,   icon: <MapPin className="h-3.5 w-3.5" /> });
  if (material) specs.push({ label: t("material"), value: material, icon: <Layers className="h-3.5 w-3.5" /> });

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto rounded-[28px] border-2 border-border bg-card">
        <DialogHeader>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em]"
              style={{ borderColor: meta.color, color: meta.color }}
            >
              {meta.emoji} {t(`category_${cat}` as never)}
            </span>
          </div>
          <DialogTitle className="pr-8 text-2xl font-semibold tracking-tight">
            {name}
          </DialogTitle>
          <DialogDescription className="flex flex-wrap items-center gap-3 pt-1 text-sm">
            <span className="flex items-center gap-1">
              <Landmark className="h-3.5 w-3.5" /> {origin || t("museum")}
            </span>
            {era && (
              <span className="tabular-nums font-medium text-foreground">
                {era}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {/* Gallery */}
        {total > 0 ? (
          <div className="space-y-2">
            <Carousel setApi={setApi} opts={{ loop: true }} className="w-full">
              <CarouselContent>
                {gallery.map((src, i) => (
                  <CarouselItem key={`${src}-${i}`}>
                    <div
                      className="grid aspect-[16/10] w-full place-items-center overflow-hidden rounded-xl"
                      style={{ background: meta.bg }}
                    >
                      <img
                        src={src}
                        alt={`${name} – ${i + 1}`}
                        className="h-full w-full object-contain p-6 drop-shadow-xl"
                        loading="lazy"
                      />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              {total > 1 && (
                <>
                  <CarouselPrevious className="left-2 z-10 bg-background/80 backdrop-blur" />
                  <CarouselNext className="right-2 z-10 bg-background/80 backdrop-blur" />
                </>
              )}
            </Carousel>
            <div className="flex items-center justify-between gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              <span className="flex items-center gap-1">
                <ImageIcon className="h-3 w-3" />
                {name}
              </span>
              <span>
                {index + 1} / {total}
              </span>
            </div>
          </div>
        ) : (
          <div
            className="grid aspect-[16/10] place-items-center rounded-xl text-6xl"
            style={{ background: meta.bg }}
          >
            {meta.emoji}
          </div>
        )}

        {/* Specs */}
        {specs.length > 0 && (
          <div className="rounded-xl border border-border bg-secondary/40 p-4">
            <div className="mb-2 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-primary">
              <FileText className="h-3 w-3" /> {t("visit_summary")}
            </div>
            <dl className="grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
              {specs.map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between gap-3 border-b border-border/40 py-1 last:border-0 sm:border-0 sm:py-0"
                >
                  <dt className="flex items-center gap-1.5 text-muted-foreground">
                    {row.icon}
                    <span>{row.label}</span>
                  </dt>
                  <dd className="font-medium text-foreground">{row.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}

        {/* Story / description */}
        <div className="rounded-xl border border-border bg-accent/50 p-4">
          <div className="mb-1 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-primary">
            <Sparkles className="h-3 w-3" /> {name}
          </div>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/85">
            {desc}
          </p>
        </div>

        {/* Reward strip */}
        <div className="rounded-xl border-2 border-border bg-card p-4">
          {result.alreadyScanned ? (
            <p className="text-sm text-muted-foreground">{t("already_claimed")}</p>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p
                  className={`font-display text-3xl ${
                    result.expGained < 0 ? "text-destructive" : "text-primary"
                  }`}
                >
                  {result.expGained >= 0 ? "+" : ""}
                  {result.expGained} EXP {result.expGained >= 0 ? "✨" : "💥"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("total_exp")}:{" "}
                  <span className="font-display text-ink">
                    {result.totalExp}
                  </span>
                </p>
              </div>
              {uq?.kind === "activeCorrect" && (
                <p className="flex items-center gap-2 text-sm text-jungle">
                  <Sparkles className="size-4" /> {t("uq_correct_bonus")} ·{" "}
                  {uq.correctScans}/{uq.targetCount}
                </p>
              )}
              {uq?.kind === "activeCorrectComplete" && (
                <p className="flex items-center gap-2 text-sm text-jungle">
                  <Flag className="size-4" /> {t("quest_done")}!
                </p>
              )}
              {uq?.kind === "activeWrongFail" && (
                <p className="flex items-center gap-2 text-sm text-destructive">
                  <AlertTriangle className="size-4" /> {t("uq_wrong_penalty")}
                </p>
              )}
              {result.levelUps > 0 && (
                <p className="flex items-center gap-2 text-sm">
                  <TrendingUp className="size-4 text-gold" /> {t("level_up")} →
                  Lv. {result.level} (+{result.pointsGained} {t("points")})
                </p>
              )}
              {result.newBadges.length > 0 && (
                <p className="flex items-center gap-2 text-sm">
                  <Award className="size-4 text-primary" /> {t("new_badge")}:{" "}
                  {result.newBadges.length}
                </p>
              )}
              {result.newAchievements.length > 0 && (
                <p className="flex items-center gap-2 text-sm">
                  <Sparkles className="size-4 text-indigo" />{" "}
                  {t("new_achievement")}: {result.newAchievements.length}
                </p>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
