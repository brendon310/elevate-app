-- community_posts: anonymous reflections per track
CREATE TABLE public.community_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  track_slug text NOT NULL,
  user_id uuid NOT NULL,
  content text NOT NULL CHECK (char_length(content) >= 10 AND char_length(content) <= 280),
  day_number integer NOT NULL DEFAULT 0,
  flame_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX cp_track_slug_created_idx ON public.community_posts(track_slug, created_at DESC);

ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
-- anyone authenticated can read all posts
CREATE POLICY cp_select_all ON public.community_posts FOR SELECT USING (auth.uid() IS NOT NULL);
-- users can only insert their own posts
CREATE POLICY cp_insert_own ON public.community_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
-- any authenticated user can update flame_count (managed exclusively via server functions)
CREATE POLICY cp_update_flame ON public.community_posts FOR UPDATE USING (auth.uid() IS NOT NULL);

-- community_post_flames: one flame per user per post
CREATE TABLE public.community_post_flames (
  post_id uuid NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  PRIMARY KEY (post_id, user_id)
);

ALTER TABLE public.community_post_flames ENABLE ROW LEVEL SECURITY;
CREATE POLICY cpf_select_all ON public.community_post_flames FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY cpf_insert_own ON public.community_post_flames FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY cpf_delete_own ON public.community_post_flames FOR DELETE USING (auth.uid() = user_id);
