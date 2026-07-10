
-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  language_pref TEXT NOT NULL DEFAULT 'bm',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "own profile write" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email,'@',1)));
  INSERT INTO public.user_progress (user_id) VALUES (NEW.id);
  RETURN NEW;
END; $$;

-- Artifacts (static reference)
CREATE TABLE public.artifacts (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  name_bm TEXT NOT NULL,
  name_en TEXT NOT NULL,
  description_bm TEXT NOT NULL,
  description_en TEXT NOT NULL,
  era_bm TEXT NOT NULL,
  era_en TEXT NOT NULL,
  origin_bm TEXT NOT NULL,
  origin_en TEXT NOT NULL,
  material_bm TEXT NOT NULL,
  material_en TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'archive',
  sort_order INT NOT NULL DEFAULT 0
);
GRANT SELECT ON public.artifacts TO authenticated;
GRANT ALL ON public.artifacts TO service_role;
ALTER TABLE public.artifacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "artifacts readable" ON public.artifacts FOR SELECT TO authenticated USING (true);

-- Badges
CREATE TABLE public.badges (
  id TEXT PRIMARY KEY,
  name_bm TEXT NOT NULL,
  name_en TEXT NOT NULL,
  description_bm TEXT NOT NULL,
  description_en TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'award',
  sort_order INT NOT NULL DEFAULT 0
);
GRANT SELECT ON public.badges TO authenticated;
GRANT ALL ON public.badges TO service_role;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "badges readable" ON public.badges FOR SELECT TO authenticated USING (true);

-- Quests
CREATE TABLE public.quests (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('category','grand')),
  category TEXT,
  name_bm TEXT NOT NULL,
  name_en TEXT NOT NULL,
  description_bm TEXT NOT NULL,
  description_en TEXT NOT NULL,
  exp_reward INT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0
);
GRANT SELECT ON public.quests TO authenticated;
GRANT ALL ON public.quests TO service_role;
ALTER TABLE public.quests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "quests readable" ON public.quests FOR SELECT TO authenticated USING (true);

-- Souvenirs
CREATE TABLE public.souvenirs (
  id TEXT PRIMARY KEY,
  name_bm TEXT NOT NULL,
  name_en TEXT NOT NULL,
  cost_points INT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'gift',
  sort_order INT NOT NULL DEFAULT 0
);
GRANT SELECT ON public.souvenirs TO authenticated;
GRANT ALL ON public.souvenirs TO service_role;
ALTER TABLE public.souvenirs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "souvenirs readable" ON public.souvenirs FOR SELECT TO authenticated USING (true);

-- User progress
CREATE TABLE public.user_progress (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_exp INT NOT NULL DEFAULT 0,
  current_level INT NOT NULL DEFAULT 1,
  discount_points INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_progress TO authenticated;
GRANT ALL ON public.user_progress TO service_role;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own progress read" ON public.user_progress FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own progress write" ON public.user_progress FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own progress update" ON public.user_progress FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Per-artifact progress
CREATE TABLE public.user_artifact_progress (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  artifact_id TEXT NOT NULL REFERENCES public.artifacts(id) ON DELETE CASCADE,
  scanned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  exp_earned INT NOT NULL DEFAULT 30,
  PRIMARY KEY (user_id, artifact_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_artifact_progress TO authenticated;
GRANT ALL ON public.user_artifact_progress TO service_role;
ALTER TABLE public.user_artifact_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own uap read" ON public.user_artifact_progress FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own uap write" ON public.user_artifact_progress FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- User badges
CREATE TABLE public.user_badges (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id TEXT NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, badge_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_badges TO authenticated;
GRANT ALL ON public.user_badges TO service_role;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own ub read" ON public.user_badges FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own ub write" ON public.user_badges FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- User quests
CREATE TABLE public.user_quests (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quest_id TEXT NOT NULL REFERENCES public.quests(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, quest_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_quests TO authenticated;
GRANT ALL ON public.user_quests TO service_role;
ALTER TABLE public.user_quests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own uq read" ON public.user_quests FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own uq write" ON public.user_quests FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Redemptions
CREATE TABLE public.redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  souvenir_id TEXT NOT NULL REFERENCES public.souvenirs(id),
  points_spent INT NOT NULL,
  redeemed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.redemptions TO authenticated;
GRANT ALL ON public.redemptions TO service_role;
ALTER TABLE public.redemptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own red read" ON public.redemptions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own red write" ON public.redemptions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Trigger last (references user_progress)
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
