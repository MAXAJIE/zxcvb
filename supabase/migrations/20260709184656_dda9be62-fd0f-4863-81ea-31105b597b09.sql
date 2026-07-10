-- Badge rarity
ALTER TABLE public.badges ADD COLUMN IF NOT EXISTS rarity text NOT NULL DEFAULT 'common';

-- Artifact image
ALTER TABLE public.artifacts ADD COLUMN IF NOT EXISTS image_url text;

-- Achievements catalog
CREATE TABLE IF NOT EXISTS public.achievements (
  id text PRIMARY KEY,
  name_bm text NOT NULL,
  name_en text NOT NULL,
  description_bm text NOT NULL,
  description_en text NOT NULL,
  icon text NOT NULL DEFAULT '🏆',
  rarity text NOT NULL DEFAULT 'common',
  requirement_key text NOT NULL,
  requirement_value int NOT NULL DEFAULT 1,
  sort_order int NOT NULL DEFAULT 0
);
GRANT SELECT ON public.achievements TO anon, authenticated;
GRANT ALL ON public.achievements TO service_role;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "achievements public read" ON public.achievements FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS public.user_achievements (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id text NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  earned_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, achievement_id)
);
GRANT SELECT, INSERT ON public.user_achievements TO authenticated;
GRANT ALL ON public.user_achievements TO service_role;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own achievements read" ON public.user_achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own achievements insert" ON public.user_achievements FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Unique quest templates
CREATE TABLE IF NOT EXISTS public.unique_quest_templates (
  id text PRIMARY KEY,
  name_bm text NOT NULL,
  name_en text NOT NULL,
  description_bm text NOT NULL,
  description_en text NOT NULL,
  trigger_artifact_id text NOT NULL REFERENCES public.artifacts(id),
  target_category text NOT NULL,
  target_count int NOT NULL DEFAULT 2,
  reward_multiplier int NOT NULL DEFAULT 3,
  penalty_exp int NOT NULL DEFAULT 20,
  badge_id text,
  sort_order int NOT NULL DEFAULT 0
);
GRANT SELECT ON public.unique_quest_templates TO anon, authenticated;
GRANT ALL ON public.unique_quest_templates TO service_role;
ALTER TABLE public.unique_quest_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "uq tmpl public read" ON public.unique_quest_templates FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS public.user_unique_quests (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id text NOT NULL REFERENCES public.unique_quest_templates(id) ON DELETE CASCADE,
  status text NOT NULL,
  correct_scans int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, template_id)
);
GRANT SELECT, INSERT, UPDATE ON public.user_unique_quests TO authenticated;
GRANT ALL ON public.user_unique_quests TO service_role;
ALTER TABLE public.user_unique_quests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own uq read" ON public.user_unique_quests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own uq insert" ON public.user_unique_quests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own uq update" ON public.user_unique_quests FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Seed unique quest templates
INSERT INTO public.unique_quest_templates (id, name_bm, name_en, description_bm, description_en, trigger_artifact_id, target_category, target_count, reward_multiplier, penalty_exp, badge_id, sort_order) VALUES
('uq-weapons','Jejak Pahlawan','Warrior''s Trail','Selepas menemui senjata pertama, imbas 2 senjata lain berturut-turut untuk 3× EXP dan lencana rare. Imbas kategori lain semasa aktif akan tolak 20 EXP dan gagalkan kuest.','After your first weapon, scan 2 more weapons in a row for 3× EXP and a rare badge. Scanning a different category deducts 20 EXP and fails the quest.','keris-panjang','weapons',2,3,20,'unique-explorer-weapons',1),
('uq-regalia','Jejak Istana','Royal Path','Selepas menemui pakaian diraja pertama, imbas 2 regalia lain berturut-turut untuk 3× EXP dan lencana rare.','After your first regalia, scan 2 more regalia items in a row for 3× EXP and a rare badge.','tengkolok','regalia',2,3,20,'unique-explorer-regalia',2),
('uq-music','Irama Warisan','Rhythm of Heritage','Selepas menemui alat muzik pertama, imbas 2 alat muzik lain berturut-turut untuk 3× EXP dan lencana rare.','After your first music item, scan 2 more music items in a row for 3× EXP and a rare badge.','gong-gamelan','music',2,3,20,'unique-explorer-music',3),
('uq-crafts','Tangan Seni','Artisan''s Hand','Selepas menemui kraftangan pertama, imbas 2 kraftangan lain berturut-turut untuk 3× EXP dan lencana rare.','After your first craft, scan 2 more crafts in a row for 3× EXP and a rare badge.','alat-tenun-songket','crafts',2,3,20,'unique-explorer-crafts',4)
ON CONFLICT (id) DO NOTHING;

-- Seed unique explorer rare badges
INSERT INTO public.badges (id, name_bm, name_en, description_bm, description_en, icon, sort_order, rarity) VALUES
('unique-explorer-weapons','Peneroka Unik: Senjata','Unique Explorer: Weapons','Menamatkan Jejak Pahlawan.','Completed the Warrior''s Trail.','⚔️',100,'rare'),
('unique-explorer-regalia','Peneroka Unik: Diraja','Unique Explorer: Regalia','Menamatkan Jejak Istana.','Completed the Royal Path.','👑',101,'rare'),
('unique-explorer-music','Peneroka Unik: Muzik','Unique Explorer: Music','Menamatkan Irama Warisan.','Completed the Rhythm of Heritage.','🎵',102,'rare'),
('unique-explorer-crafts','Peneroka Unik: Kraf','Unique Explorer: Crafts','Menamatkan Tangan Seni.','Completed the Artisan''s Hand.','🧵',103,'rare')
ON CONFLICT (id) DO UPDATE SET rarity = EXCLUDED.rarity;

-- Backfill existing badge rarity
UPDATE public.badges SET rarity='common' WHERE id='penemu-pertama';
UPDATE public.badges SET rarity='common' WHERE id='ahli-kuest';
UPDATE public.badges SET rarity='epic' WHERE id='separuh-jalan';
UPDATE public.badges SET rarity='legendary' WHERE id='peneroka-muzium';

-- Seed achievements
INSERT INTO public.achievements (id, name_bm, name_en, description_bm, description_en, icon, rarity, requirement_key, requirement_value, sort_order) VALUES
('ach-first-scan','Langkah Pertama','First Steps','Imbas artifak pertama anda.','Scan your first artifact.','👣','common','scans',1,1),
('ach-scan-3','Pengembara Muda','Young Wanderer','Imbas 3 artifak.','Scan 3 artifacts.','🌱','common','scans',3,2),
('ach-scan-6','Separuh Jalan','Halfway There','Imbas 6 artifak.','Scan 6 artifacts.','🌿','rare','scans',6,3),
('ach-scan-all','Kolektor Warisan','Heritage Collector','Imbas kesemua 12 artifak.','Scan all 12 artifacts.','🏆','legendary','scans',12,4),
('ach-level-3','Naik Tahap 3','Reach Level 3','Capai tahap 3.','Reach level 3.','⭐','common','level',3,5),
('ach-level-5','Naik Tahap Maksima','Max Level','Capai tahap 5.','Reach max level.','🌟','epic','level',5,6),
('ach-uq-1','Pemburu Rahsia','Secret Hunter','Namatkan satu Kuest Unik.','Complete one Unique Quest.','🗝️','rare','unique_quests',1,7),
('ach-uq-all','Legenda Unik','Unique Legend','Namatkan semua Kuest Unik.','Complete all Unique Quests.','💎','legendary','unique_quests',4,8)
ON CONFLICT (id) DO NOTHING;
