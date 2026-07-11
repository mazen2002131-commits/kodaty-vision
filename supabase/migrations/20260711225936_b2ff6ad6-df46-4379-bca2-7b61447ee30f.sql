
DROP FUNCTION IF EXISTS public.admin_list_team();

CREATE OR REPLACE FUNCTION public.admin_list_team()
RETURNS TABLE(
  id uuid, email text, created_at timestamptz, last_sign_in_at timestamptz,
  confirmed boolean, full_name text, avatar_url text, role text, permissions text[]
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Forbidden' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT
    u.id, u.email::text, u.created_at, u.last_sign_in_at,
    (u.email_confirmed_at IS NOT NULL) AS confirmed,
    p.full_name, p.avatar_url,
    (SELECT r.role::text FROM public.user_roles r
      WHERE r.user_id = u.id
      ORDER BY CASE r.role WHEN 'admin' THEN 0 WHEN 'staff' THEN 1 ELSE 2 END
      LIMIT 1) AS role,
    COALESCE((SELECT array_agg(perm.permission ORDER BY perm.permission)
              FROM public.user_permissions perm WHERE perm.user_id = u.id), ARRAY[]::text[]) AS permissions
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.id = u.id
  ORDER BY u.created_at DESC;
END; $$;
