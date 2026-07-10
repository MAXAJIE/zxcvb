import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { EXP_PER_SCAN, POINTS_PER_LEVEL, TOTAL_ARTIFACTS, levelForExp } from "@/lib/museum";

// ---------- Types ----------

export interface ScanResult {
  alreadyScanned: boolean;
  expGained: number;
  totalExp: number;
  level: number;
  levelUps: number;
  pointsGained: number;
  totalPoints: number;
  newBadges: string[];
  newQuests: string[];
  newAchievements: string[];
  uniqueQuest: null | {
    kind: "activeCorrect" | "activeCorrectComplete" | "activeWrongFail";
    templateId: string;
    correctScans: number;
    targetCount: number;
    bonusExp?: number;
    penaltyExp?: number;
  };
  offeredUniqueQuest: null | {
    templateId: string;
    name_bm: string;
    name_en: string;
    description_bm: string;
    description_en: string;
    target_category: string;
    target_count: number;
    reward_multiplier: number;
    penalty_exp: number;
  };
  artifact: {
    id: string;
    category: string;
    name_bm: string;
    name_en: string;
    description_bm: string;
    description_en: string;
    era_bm: string;
    era_en: string;
    origin_bm: string;
    origin_en: string;
    material_bm: string;
    material_en: string;
    image_url: string | null;
    sort_order: number;
  };
}

// ---------- scanArtifact ----------

const scanInput = z.object({ artifactId: z.string().min(1) });

export const scanArtifact = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => scanInput.parse(d))
  .handler(async ({ data, context }): Promise<ScanResult> => {
    const { supabase, userId } = context;

    const { data: artifact, error: aErr } = await supabase
      .from("artifacts")
      .select("id, category, name_bm, name_en, description_bm, description_en, era_bm, era_en, origin_bm, origin_en, material_bm, material_en, image_url, sort_order")
      .eq("id", data.artifactId)
      .maybeSingle();
    if (aErr) throw new Error(aErr.message);
    if (!artifact) throw new Error("ARTIFACT_NOT_FOUND");

    const [
      { data: prog },
      { data: prior },
      { data: earnedBadges },
      { data: doneQuests },
      { data: earnedAchievements },
      { data: uqTemplatesAll },
      { data: userUq },
    ] = await Promise.all([
      supabase.from("user_progress").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("user_artifact_progress").select("artifact_id").eq("user_id", userId),
      supabase.from("user_badges").select("badge_id").eq("user_id", userId),
      supabase.from("user_quests").select("quest_id").eq("user_id", userId),
      supabase.from("user_achievements").select("achievement_id").eq("user_id", userId),
      supabase.from("unique_quest_templates").select("*"),
      supabase.from("user_unique_quests").select("*").eq("user_id", userId),
    ]);

    const scannedIds = new Set((prior ?? []).map((r) => r.artifact_id));
    const alreadyScanned = scannedIds.has(artifact.id);
    const oldExp = prog?.total_exp ?? 0;
    const oldLevel = prog?.current_level ?? 1;
    const oldPoints = prog?.discount_points ?? 0;

    // Idempotent short circuit.
    if (alreadyScanned) {
      return {
        alreadyScanned: true,
        expGained: 0,
        totalExp: oldExp,
        level: oldLevel,
        levelUps: 0,
        pointsGained: 0,
        totalPoints: oldPoints,
        newBadges: [],
        newQuests: [],
        newAchievements: [],
        uniqueQuest: null,
        offeredUniqueQuest: null,
        artifact,
      };
    }

    // --- Active unique quest branch ---
    const activeUq = (userUq ?? []).find((u) => u.status === "active");
    const activeTemplate = activeUq ? (uqTemplatesAll ?? []).find((t) => t.id === activeUq.template_id) : null;

    let expEarned = EXP_PER_SCAN;
    const newBadges: string[] = [];
    const newAchievements: string[] = [];
    let uqSummary: ScanResult["uniqueQuest"] = null;

    if (activeUq && activeTemplate) {
      if (artifact.category === activeTemplate.target_category && artifact.id !== activeTemplate.trigger_artifact_id) {
        // Correct
        const bonus = EXP_PER_SCAN * activeTemplate.reward_multiplier;
        expEarned = bonus;
        const nextCorrect = (activeUq.correct_scans ?? 0) + 1;
        const complete = nextCorrect >= activeTemplate.target_count;
        await supabase.from("user_unique_quests").update({
          correct_scans: nextCorrect,
          status: complete ? "completed" : "active",
          updated_at: new Date().toISOString(),
        }).eq("user_id", userId).eq("template_id", activeTemplate.id);
        if (complete && activeTemplate.badge_id) newBadges.push(activeTemplate.badge_id);
        uqSummary = {
          kind: complete ? "activeCorrectComplete" : "activeCorrect",
          templateId: activeTemplate.id,
          correctScans: nextCorrect,
          targetCount: activeTemplate.target_count,
          bonusExp: bonus,
        };
      } else if (artifact.id !== activeTemplate.trigger_artifact_id) {
        // Wrong category — fail
        expEarned = -activeTemplate.penalty_exp;
        await supabase.from("user_unique_quests").update({
          status: "failed",
          updated_at: new Date().toISOString(),
        }).eq("user_id", userId).eq("template_id", activeTemplate.id);
        uqSummary = {
          kind: "activeWrongFail",
          templateId: activeTemplate.id,
          correctScans: activeUq.correct_scans ?? 0,
          targetCount: activeTemplate.target_count,
          penaltyExp: activeTemplate.penalty_exp,
        };
      }
      // If artifact is the trigger itself while active (shouldn't happen since trigger already scanned), fall through to normal.
    }

    // Insert scan record
    const { error: insErr } = await supabase
      .from("user_artifact_progress")
      .insert({ user_id: userId, artifact_id: artifact.id, exp_earned: expEarned });
    if (insErr) throw new Error(insErr.message);
    scannedIds.add(artifact.id);

    // --- Category & grand quests (normal) ---
    const newQuests: string[] = [];
    const doneQuestIds = new Set((doneQuests ?? []).map((q) => q.quest_id));
    const { data: catArtifacts } = await supabase.from("artifacts").select("id").eq("category", artifact.category);
    const catIds = (catArtifacts ?? []).map((a) => a.id);
    const catComplete = catIds.length > 0 && catIds.every((id) => scannedIds.has(id));
    const catQuestId = `quest-${artifact.category}`;
    if (catComplete && !doneQuestIds.has(catQuestId)) {
      newQuests.push(catQuestId);
      expEarned += 50;
    }
    if (scannedIds.size === TOTAL_ARTIFACTS && !doneQuestIds.has("quest-grand")) {
      newQuests.push("quest-grand");
      expEarned += 100;
    }
    if (newQuests.length) {
      await supabase.from("user_quests").insert(newQuests.map((quest_id) => ({ user_id: userId, quest_id })));
    }

    // --- Level & points ---
    const newExp = Math.max(0, oldExp + expEarned);
    const newLevel = levelForExp(newExp);
    const levelUps = Math.max(0, newLevel - oldLevel);
    const pointsGained = levelUps * POINTS_PER_LEVEL;
    const newPoints = oldPoints + pointsGained;

    await supabase.from("user_progress").update({
      total_exp: newExp,
      current_level: newLevel,
      discount_points: newPoints,
      updated_at: new Date().toISOString(),
    }).eq("user_id", userId);

    // --- Badges ---
    const earnedBadgeIds = new Set((earnedBadges ?? []).map((b) => b.badge_id));
    const scanCount = scannedIds.size;
    if (!earnedBadgeIds.has("penemu-pertama")) newBadges.push("penemu-pertama");
    if (!earnedBadgeIds.has("ahli-kuest") && (newQuests.some((q) => q.startsWith("quest-") && q !== "quest-grand") || [...doneQuestIds].some((q) => q.startsWith("quest-") && q !== "quest-grand"))) {
      newBadges.push("ahli-kuest");
    }
    if (scanCount >= 8 && !earnedBadgeIds.has("separuh-jalan")) newBadges.push("separuh-jalan");
    if (scanCount === TOTAL_ARTIFACTS && !earnedBadgeIds.has("peneroka-muzium")) newBadges.push("peneroka-muzium");
    // dedupe
    const badgesToInsert = [...new Set(newBadges)].filter((b) => !earnedBadgeIds.has(b));
    if (badgesToInsert.length) {
      await supabase.from("user_badges").insert(badgesToInsert.map((badge_id) => ({ user_id: userId, badge_id })));
    }

    // --- Achievements ---
    const uqDoneCount = (userUq ?? []).filter((u) => u.status === "completed").length + (uqSummary?.kind === "activeCorrectComplete" ? 1 : 0);
    const earnedAchIds = new Set((earnedAchievements ?? []).map((a) => a.achievement_id));
    const { data: allAch } = await supabase.from("achievements").select("*");
    for (const a of allAch ?? []) {
      if (earnedAchIds.has(a.id)) continue;
      let ok = false;
      if (a.requirement_key === "scans") ok = scanCount >= a.requirement_value;
      else if (a.requirement_key === "level") ok = newLevel >= a.requirement_value;
      else if (a.requirement_key === "unique_quests") ok = uqDoneCount >= a.requirement_value;
      if (ok) newAchievements.push(a.id);
    }
    if (newAchievements.length) {
      await supabase.from("user_achievements").insert(newAchievements.map((achievement_id) => ({ user_id: userId, achievement_id })));
    }

    // --- Offered unique quest? ---
    let offered: ScanResult["offeredUniqueQuest"] = null;
    const alreadyHasActive = !!(userUq ?? []).find((u) => u.status === "active");
    const wasAnyActive = alreadyHasActive || !!activeUq;
    if (!wasAnyActive && uqSummary === null) {
      const tmpl = (uqTemplatesAll ?? []).find((t) => t.trigger_artifact_id === artifact.id);
      if (tmpl) {
        const already = (userUq ?? []).find((u) => u.template_id === tmpl.id);
        if (!already) {
          offered = {
            templateId: tmpl.id,
            name_bm: tmpl.name_bm,
            name_en: tmpl.name_en,
            description_bm: tmpl.description_bm,
            description_en: tmpl.description_en,
            target_category: tmpl.target_category,
            target_count: tmpl.target_count,
            reward_multiplier: tmpl.reward_multiplier,
            penalty_exp: tmpl.penalty_exp,
          };
        }
      }
    }

    return {
      alreadyScanned: false,
      expGained: expEarned,
      totalExp: newExp,
      level: newLevel,
      levelUps,
      pointsGained,
      totalPoints: newPoints,
      newBadges: badgesToInsert,
      newQuests,
      newAchievements,
      uniqueQuest: uqSummary,
      offeredUniqueQuest: offered,
      artifact,
    };
  });

// ---------- Unique quest accept/decline ----------

const uqInput = z.object({ templateId: z.string().min(1) });

export const acceptUniqueQuest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => uqInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: mine } = await supabase.from("user_unique_quests").select("*").eq("user_id", userId);
    if ((mine ?? []).some((r) => r.status === "active")) {
      return { ok: false as const, reason: "another_active" as const };
    }
    const existing = (mine ?? []).find((r) => r.template_id === data.templateId);
    if (existing) return { ok: false as const, reason: "already_seen" as const };
    const { error } = await supabase.from("user_unique_quests").insert({
      user_id: userId,
      template_id: data.templateId,
      status: "active",
      correct_scans: 0,
    });
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const declineUniqueQuest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => uqInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const existing = await supabase.from("user_unique_quests").select("*").eq("user_id", userId).eq("template_id", data.templateId).maybeSingle();
    if (existing.data) return { ok: true as const };
    const { error } = await supabase.from("user_unique_quests").insert({
      user_id: userId,
      template_id: data.templateId,
      status: "declined",
      correct_scans: 0,
    });
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

// ---------- redeemSouvenir (kept from before) ----------

const redeemInput = z.object({ souvenirId: z.string().min(1) });

export const redeemSouvenir = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => redeemInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: souv, error: sErr } = await supabase
      .from("souvenirs")
      .select("id, cost_points")
      .eq("id", data.souvenirId)
      .maybeSingle();
    if (sErr) throw new Error(sErr.message);
    if (!souv) throw new Error("Souvenir not found");

    const { data: prog, error: pErr } = await supabase
      .from("user_progress")
      .select("discount_points")
      .eq("user_id", userId)
      .maybeSingle();
    if (pErr) throw new Error(pErr.message);
    const balance = prog?.discount_points ?? 0;
    if (balance < souv.cost_points) {
      return { ok: false as const, reason: "insufficient", balance };
    }
    const newBalance = balance - souv.cost_points;
    const { error: uErr } = await supabase
      .from("user_progress")
      .update({ discount_points: newBalance, updated_at: new Date().toISOString() })
      .eq("user_id", userId);
    if (uErr) throw new Error(uErr.message);
    const { error: rErr } = await supabase
      .from("redemptions")
      .insert({ user_id: userId, souvenir_id: souv.id, points_spent: souv.cost_points });
    if (rErr) throw new Error(rErr.message);
    return { ok: true as const, balance: newBalance };
  });
