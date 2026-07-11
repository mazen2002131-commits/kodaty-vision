DO $$ BEGIN
  CREATE TYPE public.billing_type AS ENUM ('one_time','monthly','yearly');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS billing_type public.billing_type NOT NULL DEFAULT 'one_time';