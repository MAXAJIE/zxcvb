-- Traditional Toys unique quest — mirrors uq-weapons/regalia/music/crafts pattern.
-- Trigger on 'congkak' (first toy by sort_order). Scan 2 more toys in a row for
-- 3× EXP + a rare badge; scanning any other category during the quest deducts
-- 20 EXP and fails it.

INSERT INTO public.unique_quest_templates (
  id, name_bm, name_en, description_bm, description_en,
  trigger_artifact_id, target_category, target_count,
  reward_multiplier, penalty_exp, badge_id, sort_order
) VALUES (
  'uq-toys',
  'Semangat Bermain',
  'Spirit of Play',
  'Selepas menemui mainan tradisional pertama, imbas 2 mainan lain berturut-turut untuk 3× EXP dan lencana rare. Imbas kategori lain semasa aktif akan tolak 20 EXP dan gagalkan kuest.',
  'After your first traditional toy, scan 2 more toys in a row for 3× EXP and a rare badge. Scanning a different category deducts 20 EXP and fails the quest.',
  'congkak', 'toys', 2, 3, 20, 'unique-explorer-toys', 5
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.badges (id, name_bm, name_en, description_bm, description_en, icon, sort_order, rarity) VALUES
('unique-explorer-toys', 'Peneroka Unik: Mainan', 'Unique Explorer: Toys',
 'Menamatkan Semangat Bermain.', 'Completed the Spirit of Play.',
 '🪀', 104, 'rare')
ON CONFLICT (id) DO UPDATE SET rarity = EXCLUDED.rarity;

-- Rescale the "complete all Unique Quests" achievement from 4 → 5 now that
-- toys has its own unique quest.
UPDATE public.achievements
SET requirement_value = 5
WHERE id = 'ach-uq-all' AND requirement_key = 'unique_quests';
