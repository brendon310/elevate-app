REVOKE EXECUTE ON FUNCTION public.toggle_community_flame(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.toggle_community_flame(uuid) TO authenticated;