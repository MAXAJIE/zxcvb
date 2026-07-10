INSERT INTO public.souvenirs (id, name_bm, name_en, cost_points, icon, sort_order) VALUES
  ('gift-card',   'Kad Hadiah Kedai',      'Museum Gift Card',       18, 'gift',    1),
  ('discount-15', 'Kad Diskaun 15%',       '15% Discount Card',      10, 'ticket',  2),
  ('discount-30', 'Kad Diskaun 30%',       '30% Discount Card',      20, 'percent', 3),
  ('poskad',      'Poskad Warisan',        'Heritage Postcard',       5, 'mail',    4),
  ('magnet',      'Magnet Peti Sejuk',     'Fridge Magnet',           8, 'magnet',  5),
  ('baju-t',      'Baju-T HeritageQuest',  'HeritageQuest T-Shirt',  25, 'shirt',   6)
ON CONFLICT (id) DO UPDATE SET
  name_bm = EXCLUDED.name_bm,
  name_en = EXCLUDED.name_en,
  cost_points = EXCLUDED.cost_points,
  icon = EXCLUDED.icon,
  sort_order = EXCLUDED.sort_order;

DELETE FROM public.souvenirs s
WHERE s.id NOT IN ('gift-card','discount-15','discount-30','poskad','magnet','baju-t')
  AND NOT EXISTS (SELECT 1 FROM public.redemptions r WHERE r.souvenir_id = s.id);