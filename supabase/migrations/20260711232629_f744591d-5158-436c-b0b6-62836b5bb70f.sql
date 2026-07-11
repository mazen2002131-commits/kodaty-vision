
-- Lock down SECURITY DEFINER functions to authenticated only (they self-check admin)
REVOKE EXECUTE ON FUNCTION public.admin_list_team() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.admin_set_role(uuid, app_role) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.admin_set_permissions(uuid, text[]) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.admin_list_team() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_permissions(uuid, text[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_team_member(uuid) TO authenticated;
