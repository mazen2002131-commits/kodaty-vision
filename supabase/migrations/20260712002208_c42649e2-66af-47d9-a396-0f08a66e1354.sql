
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.admin_create_user(
  _email text,
  _password text,
  _full_name text,
  _role app_role,
  _perms text[]
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_id uuid := gen_random_uuid();
  norm_email text := lower(trim(_email));
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Forbidden' USING ERRCODE = '42501';
  END IF;

  IF _password IS NULL OR length(_password) < 8 THEN
    RAISE EXCEPTION 'كلمة المرور قصيرة جداً' USING ERRCODE = '22023';
  END IF;

  IF norm_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN
    RAISE EXCEPTION 'صيغة الإيميل غير صحيحة' USING ERRCODE = '22023';
  END IF;

  IF EXISTS (SELECT 1 FROM auth.users WHERE lower(email) = norm_email) THEN
    RAISE EXCEPTION 'الإيميل مستخدم بالفعل' USING ERRCODE = '23505';
  END IF;

  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data, is_super_admin
  ) VALUES (
    new_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    norm_email,
    extensions.crypt(_password, extensions.gen_salt('bf')),
    now(), now(), now(),
    jsonb_build_object('provider', 'email', 'providers', array['email']),
    jsonb_build_object('full_name', _full_name),
    false
  );

  INSERT INTO auth.identities (
    id, provider_id, user_id, identity_data, provider,
    last_sign_in_at, created_at, updated_at
  ) VALUES (
    gen_random_uuid(),
    new_id::text,
    new_id,
    jsonb_build_object('sub', new_id::text, 'email', norm_email, 'email_verified', true),
    'email',
    now(), now(), now()
  );

  -- handle_new_user trigger inserts profile + default role; override:
  DELETE FROM public.user_roles WHERE user_id = new_id;
  INSERT INTO public.user_roles (user_id, role) VALUES (new_id, _role);

  UPDATE public.profiles
     SET full_name = COALESCE(_full_name, full_name)
   WHERE id = new_id;

  DELETE FROM public.user_permissions WHERE user_id = new_id;
  IF _perms IS NOT NULL AND array_length(_perms, 1) > 0 THEN
    INSERT INTO public.user_permissions (user_id, permission)
    SELECT new_id, unnest(_perms)
    ON CONFLICT (user_id, permission) DO NOTHING;
  END IF;

  RETURN new_id;
END;
$$;
