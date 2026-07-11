-- Traditional Toys category: 3 new artifacts, category quest, rescaled milestones (12 -> 15).

-- 1) New artifacts
INSERT INTO public.artifacts (id, category, name_bm, name_en, description_bm, description_en, era_bm, era_en, origin_bm, origin_en, material_bm, material_en, icon, image_url, sort_order) VALUES
('congkak', 'toys',
 'Congkak', 'Congkak',
 'Congkak ialah permainan papan tradisional Melayu yang dimainkan oleh dua orang. Papan kayu berbentuk perahu ini mempunyai dua baris lubang kecil dan dua "rumah" di hujungnya. Pemain bergilir-gilir mengagihkan guli atau biji getah ke dalam lubang, dan pemain yang mengumpul paling banyak biji di rumahnya menang. Permainan ini melatih kiraan pantas dan strategi, dan sering dimainkan di beranda rumah kampung.',
 'Congkak is a traditional Malay board game for two players. The boat-shaped wooden board has two rows of small pits and two larger "storehouses" at the ends. Players take turns sowing marbles or rubber seeds into the pits, and whoever gathers the most seeds in their storehouse wins. The game sharpens quick counting and strategy, and was often played on the verandahs of village houses.',
 'Abad ke-15 hingga kini', '15th century to present',
 'Semenanjung Tanah Melayu', 'Malay Peninsula',
 'Kayu keras, guli atau biji getah', 'Hardwood, marbles or rubber seeds',
 'archive', '/artifacts/congkak.jpg', 13),
('diabolo-cina', 'toys',
 'Diabolo Cina', 'Chinese Diabolo',
 'Diabolo Cina, atau kongzhu, ialah alat permainan berbentuk jam pasir yang diputar dan dilambung menggunakan tali yang diikat pada dua batang kayu. Apabila berputar laju, diabolo mengeluarkan bunyi berdengung yang unik. Permainan berusia lebih 1,000 tahun ini dibawa masuk oleh komuniti Cina dan menjadi persembahan popular semasa perayaan Tahun Baru Cina di Malaysia.',
 'The Chinese diabolo, or kongzhu, is an hourglass-shaped toy spun and tossed on a string tied between two hand sticks. When it spins fast, the diabolo produces a distinctive humming sound. Over 1,000 years old, this pastime was brought by the Chinese community and became a popular performance during Chinese New Year celebrations in Malaysia.',
 'Lebih 1,000 tahun', 'Over 1,000 years old',
 'China; komuniti Cina Malaysia', 'China; Malaysian Chinese community',
 'Buluh, kayu dan tali', 'Bamboo, wood and string',
 'archive', '/artifacts/diabolo-cina.jpg', 14),
('catur-cina', 'toys',
 'Catur Cina', 'Chinese Chess (Xiangqi)',
 'Catur Cina, atau xiangqi, ialah permainan strategi dua pemain yang dimainkan di atas papan bergrid dengan "sungai" di tengahnya. Buah catur berbentuk cakera kayu ditanda dengan aksara Cina merah dan hitam, mewakili jeneral, gajah, kuda dan askar. Permainan ini sangat digemari di kedai kopi dan rumah kongsi, mengasah pemikiran taktikal merentas generasi.',
 'Chinese chess, or xiangqi, is a two-player strategy game played on a gridded board divided by a central "river". The wooden disc pieces are marked with red and black Chinese characters representing generals, elephants, horses and soldiers. Beloved in coffee shops and clan houses, the game has sharpened tactical thinking across generations.',
 'Lebih 1,500 tahun', 'Over 1,500 years old',
 'China; komuniti Cina Malaysia', 'China; Malaysian Chinese community',
 'Kayu dan dakwat', 'Wood and ink',
 'archive', '/artifacts/catur-cina.jpg', 15)
ON CONFLICT (id) DO NOTHING;

-- 2) Category quest for toys (+50 EXP, awarded automatically by the scan logic)
INSERT INTO public.quests (id, type, category, name_bm, name_en, description_bm, description_en, exp_reward, sort_order) VALUES
('quest-toys', 'category', 'toys',
 'Pakar Mainan Tradisional', 'Traditional Toys Expert',
 'Imbas ketiga-tiga mainan tradisional di Ruang Mainan Tradisional.',
 'Scan all 3 traditional toys in the Traditional Toys Corner.',
 50, 5)
ON CONFLICT (id) DO NOTHING;

-- 3) Rescale milestones from 12 artifacts to 15
UPDATE public.achievements SET requirement_value = 15,
  description_bm = REPLACE(description_bm, '12', '15'),
  description_en = REPLACE(description_en, '12', '15')
WHERE requirement_key = 'scans' AND requirement_value = 12;

UPDATE public.achievements SET requirement_value = 8,
  description_bm = REPLACE(description_bm, '6', '8'),
  description_en = REPLACE(description_en, '6', '8')
WHERE requirement_key = 'scans' AND requirement_value = 6;

UPDATE public.quests SET
  description_bm = REPLACE(description_bm, '12', '15'),
  description_en = REPLACE(description_en, '12', '15')
WHERE id = 'quest-grand';

UPDATE public.badges SET
  description_bm = REPLACE(REPLACE(description_bm, '12', '15'), ' 6 ', ' 8 '),
  description_en = REPLACE(REPLACE(description_en, '12', '15'), ' 6 ', ' 8 ')
WHERE id IN ('peneroka-muzium', 'separuh-jalan');
