-- Backfill artifact images and complete quest seed data for all categories.
-- Image paths point only to files already present in public/artifacts.

ALTER TABLE public.artifacts ADD COLUMN IF NOT EXISTS image_url text;

UPDATE public.artifacts AS a
SET image_url = v.image_url
FROM (VALUES
  ('keris-panjang', '/artifacts/keris-panjang.jpg'),
  ('meriam-melaka', '/artifacts/meriam-melaka.jpg'),
  ('terabai', '/artifacts/terabai.jpg'),
  ('tengkolok', '/artifacts/tengkolok.jpg'),
  ('baju-kurung-diraja', '/artifacts/baju-kurung-diraja.jpg'),
  ('set-perak-diraja', '/artifacts/set-perak-diraja.jpg'),
  ('gong-gamelan', '/artifacts/gong-gamelan.jpg'),
  ('rebana-ubi', '/artifacts/rebana-ubi.jpg'),
  ('seruling-tradisional', '/artifacts/seruling-tradisional.jpg'),
  ('alat-tenun-songket', '/artifacts/alat-tenun-songket.jpg'),
  ('wau-bulan', '/artifacts/wau-bulan.jpg'),
  ('canting-batik', '/artifacts/canting-batik.jpg'),
  ('congkak', '/artifacts/congkak.jpg'),
  ('diabolo-cina', '/artifacts/diabolo-cina.jpg'),
  ('catur-cina', '/artifacts/catur-cina.jpg')
) AS v(id, image_url)
WHERE a.id = v.id;

INSERT INTO public.quests (
  id, type, category, name_bm, name_en,
  description_bm, description_en, exp_reward, sort_order
) VALUES
  ('quest-weapons', 'category', 'weapons',
   'Pakar Senjata Tradisional', 'Traditional Weapons Expert',
   'Imbas ketiga-tiga senjata tradisional di Dewan Senjata.',
   'Scan all 3 traditional weapons in the Weapons Hall.',
   50, 1),
  ('quest-regalia', 'category', 'regalia',
   'Pakar Diraja', 'Royal Regalia Expert',
   'Imbas ketiga-tiga artifak diraja di Balai Diraja.',
   'Scan all 3 royal regalia artifacts in the Royal Gallery.',
   50, 2),
  ('quest-music', 'category', 'music',
   'Pakar Irama Warisan', 'Traditional Music Expert',
   'Imbas ketiga-tiga alat muzik tradisional di Dewan Muzik.',
   'Scan all 3 traditional instruments in the Music Hall.',
   50, 3),
  ('quest-crafts', 'category', 'crafts',
   'Pakar Kraftangan Warisan', 'Heritage Handicrafts Expert',
   'Imbas ketiga-tiga kraftangan warisan di Studio Kraftangan.',
   'Scan all 3 heritage handicrafts in the Crafts Studio.',
   50, 4),
  ('quest-toys', 'category', 'toys',
   'Pakar Mainan Tradisional', 'Traditional Toys Expert',
   'Imbas ketiga-tiga mainan tradisional di Ruang Mainan Tradisional.',
   'Scan all 3 traditional toys in the Traditional Toys Corner.',
   50, 5),
  ('quest-grand', 'grand', null,
   'Peneroka Muzium', 'Museum Explorer',
   'Imbas kesemua 15 artifak di Muzium Warisan Malaysia.',
   'Scan all 15 artifacts in Muzium Warisan Malaysia.',
   100, 99)
ON CONFLICT (id) DO UPDATE SET
  type = EXCLUDED.type,
  category = EXCLUDED.category,
  name_bm = EXCLUDED.name_bm,
  name_en = EXCLUDED.name_en,
  description_bm = EXCLUDED.description_bm,
  description_en = EXCLUDED.description_en,
  exp_reward = EXCLUDED.exp_reward,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.unique_quest_templates (
  id, name_bm, name_en, description_bm, description_en,
  trigger_artifact_id, target_category, target_count,
  reward_multiplier, penalty_exp, badge_id, sort_order
) VALUES
  ('uq-weapons', 'Jejak Pahlawan', 'Warrior''s Trail',
   'Selepas menemui senjata pertama, imbas 2 senjata lain berturut-turut untuk 3x EXP dan lencana rare. Imbas kategori lain semasa aktif akan tolak 20 EXP dan gagalkan kuest.',
   'After your first weapon, scan 2 more weapons in a row for 3x EXP and a rare badge. Scanning a different category deducts 20 EXP and fails the quest.',
   'keris-panjang', 'weapons', 2, 3, 20, 'unique-explorer-weapons', 1),
  ('uq-regalia', 'Jejak Istana', 'Royal Path',
   'Selepas menemui pakaian diraja pertama, imbas 2 regalia lain berturut-turut untuk 3x EXP dan lencana rare. Imbas kategori lain semasa aktif akan tolak 20 EXP dan gagalkan kuest.',
   'After your first regalia item, scan 2 more regalia items in a row for 3x EXP and a rare badge. Scanning a different category deducts 20 EXP and fails the quest.',
   'tengkolok', 'regalia', 2, 3, 20, 'unique-explorer-regalia', 2),
  ('uq-music', 'Irama Warisan', 'Rhythm of Heritage',
   'Selepas menemui alat muzik pertama, imbas 2 alat muzik lain berturut-turut untuk 3x EXP dan lencana rare. Imbas kategori lain semasa aktif akan tolak 20 EXP dan gagalkan kuest.',
   'After your first music item, scan 2 more music items in a row for 3x EXP and a rare badge. Scanning a different category deducts 20 EXP and fails the quest.',
   'gong-gamelan', 'music', 2, 3, 20, 'unique-explorer-music', 3),
  ('uq-crafts', 'Tangan Seni', 'Artisan''s Hand',
   'Selepas menemui kraftangan pertama, imbas 2 kraftangan lain berturut-turut untuk 3x EXP dan lencana rare. Imbas kategori lain semasa aktif akan tolak 20 EXP dan gagalkan kuest.',
   'After your first craft, scan 2 more crafts in a row for 3x EXP and a rare badge. Scanning a different category deducts 20 EXP and fails the quest.',
   'alat-tenun-songket', 'crafts', 2, 3, 20, 'unique-explorer-crafts', 4),
  ('uq-toys', 'Semangat Bermain', 'Spirit of Play',
   'Selepas menemui mainan tradisional pertama, imbas 2 mainan lain berturut-turut untuk 3x EXP dan lencana rare. Imbas kategori lain semasa aktif akan tolak 20 EXP dan gagalkan kuest.',
   'After your first traditional toy, scan 2 more toys in a row for 3x EXP and a rare badge. Scanning a different category deducts 20 EXP and fails the quest.',
   'congkak', 'toys', 2, 3, 20, 'unique-explorer-toys', 5)
ON CONFLICT (id) DO UPDATE SET
  name_bm = EXCLUDED.name_bm,
  name_en = EXCLUDED.name_en,
  description_bm = EXCLUDED.description_bm,
  description_en = EXCLUDED.description_en,
  trigger_artifact_id = EXCLUDED.trigger_artifact_id,
  target_category = EXCLUDED.target_category,
  target_count = EXCLUDED.target_count,
  reward_multiplier = EXCLUDED.reward_multiplier,
  penalty_exp = EXCLUDED.penalty_exp,
  badge_id = EXCLUDED.badge_id,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.badges (
  id, name_bm, name_en, description_bm, description_en, icon, sort_order, rarity
) VALUES
  ('unique-explorer-weapons', 'Peneroka Unik: Senjata', 'Unique Explorer: Weapons',
   'Menamatkan Jejak Pahlawan.', 'Completed the Warrior''s Trail.', '⚔️', 100, 'rare'),
  ('unique-explorer-regalia', 'Peneroka Unik: Diraja', 'Unique Explorer: Regalia',
   'Menamatkan Jejak Istana.', 'Completed the Royal Path.', '👑', 101, 'rare'),
  ('unique-explorer-music', 'Peneroka Unik: Muzik', 'Unique Explorer: Music',
   'Menamatkan Irama Warisan.', 'Completed the Rhythm of Heritage.', '🎵', 102, 'rare'),
  ('unique-explorer-crafts', 'Peneroka Unik: Kraf', 'Unique Explorer: Crafts',
   'Menamatkan Tangan Seni.', 'Completed the Artisan''s Hand.', '🧵', 103, 'rare'),
  ('unique-explorer-toys', 'Peneroka Unik: Mainan', 'Unique Explorer: Toys',
   'Menamatkan Semangat Bermain.', 'Completed the Spirit of Play.', '🪀', 104, 'rare')
ON CONFLICT (id) DO UPDATE SET
  name_bm = EXCLUDED.name_bm,
  name_en = EXCLUDED.name_en,
  description_bm = EXCLUDED.description_bm,
  description_en = EXCLUDED.description_en,
  icon = EXCLUDED.icon,
  sort_order = EXCLUDED.sort_order,
  rarity = EXCLUDED.rarity;

UPDATE public.achievements
SET requirement_value = 5
WHERE id = 'ach-uq-all' AND requirement_key = 'unique_quests';
