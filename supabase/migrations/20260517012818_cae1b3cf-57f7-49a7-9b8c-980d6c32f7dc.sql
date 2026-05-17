DROP POLICY IF EXISTS "cp_update_flame_count" ON public.community_posts;

CREATE OR REPLACE FUNCTION public.toggle_community_flame(_post_id uuid)
RETURNS TABLE(flamed boolean, flame_count integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _existing boolean;
  _new_count integer;
  _did_flame boolean;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT EXISTS(
    SELECT 1 FROM public.community_post_flames
    WHERE post_id = _post_id AND user_id = _uid
  ) INTO _existing;

  IF _existing THEN
    DELETE FROM public.community_post_flames
      WHERE post_id = _post_id AND user_id = _uid;
    _did_flame := false;
  ELSE
    INSERT INTO public.community_post_flames(post_id, user_id)
      VALUES (_post_id, _uid);
    _did_flame := true;
  END IF;

  SELECT COUNT(*)::int INTO _new_count
    FROM public.community_post_flames WHERE post_id = _post_id;

  UPDATE public.community_posts SET flame_count = _new_count WHERE id = _post_id;

  RETURN QUERY SELECT _did_flame, _new_count;
END;
$$;