CREATE TABLE public.community_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  track_slug TEXT NOT NULL,
  content TEXT NOT NULL,
  day_number INTEGER NOT NULL DEFAULT 0,
  flame_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_community_posts_track_slug ON public.community_posts(track_slug, created_at DESC);

ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cp_select_all" ON public.community_posts FOR SELECT TO authenticated USING (true);
CREATE POLICY "cp_insert_own" ON public.community_posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "cp_update_flame_count" ON public.community_posts FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "cp_delete_own" ON public.community_posts FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.community_post_flames (
  post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, user_id)
);

ALTER TABLE public.community_post_flames ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cpf_select_all" ON public.community_post_flames FOR SELECT TO authenticated USING (true);
CREATE POLICY "cpf_insert_own" ON public.community_post_flames FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "cpf_delete_own" ON public.community_post_flames FOR DELETE TO authenticated USING (auth.uid() = user_id);