import { expToNextLevel, MAX_LEVEL, LEVEL_THRESHOLDS, levelForExp } from "@/lib/museum";

interface Props { exp: number; compact?: boolean }

/**
 * Chunky segmented XP bar with 5 level pips.
 * Each pip lights up once its level threshold is reached; the currently
 * filling pip animates a partial fill.
 */
export function ExpBar({ exp, compact = false }: Props) {
  const level = levelForExp(exp);
  const { next, current } = expToNextLevel(exp);
  const currentSegPct = next == null ? 100 : Math.min(100, Math.round(((exp - current) / (next - current)) * 100));

  return (
    <div className={compact ? "space-y-1" : "space-y-1.5"}>
      <div className="flex items-baseline justify-between">
        <span className="font-display text-sm text-ink">Lv. {level}<span className="text-muted-foreground text-xs"> / {MAX_LEVEL}</span></span>
        <span className="text-[11px] text-muted-foreground tabular-nums">{next == null ? `${exp} EXP · MAX` : `${exp} / ${next} EXP`}</span>
      </div>
      <div className="flex gap-1">
        {Array.from({ length: MAX_LEVEL }, (_, i) => {
          const segLevel = i + 1;
          const reached = level > segLevel;
          const isCurrent = level === segLevel;
          const pct = reached ? 100 : isCurrent ? currentSegPct : 0;
          const isLast = i === MAX_LEVEL - 1;
          return (
            <div
              key={i}
              className={`relative h-3 flex-1 overflow-hidden rounded-full border-2 border-border bg-muted ${isLast ? "shadow-[inset_0_0_0_1px_var(--color-gold)]" : ""}`}
              title={`Lv. ${segLevel}: ${LEVEL_THRESHOLDS[i]}+ EXP`}
            >
              <div
                className="h-full transition-all duration-500"
                style={{
                  width: `${pct}%`,
                  background: isLast
                    ? "linear-gradient(90deg, oklch(0.86 0.14 60), oklch(0.78 0.17 55))"
                    : "linear-gradient(90deg, oklch(0.78 0.14 25), oklch(0.86 0.13 70))",
                  boxShadow: pct > 0 ? "0 0 12px -3px oklch(0.78 0.14 25 / 0.6)" : "none",
                }}
              />
              {pct > 0 && pct < 100 && (
                <div className="pointer-events-none absolute inset-0 opacity-40" style={{
                  background: "repeating-linear-gradient(45deg, transparent 0 6px, oklch(1 0 0 / 0.4) 6px 8px)",
                }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
