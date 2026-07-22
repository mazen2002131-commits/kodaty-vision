-- Kodaty Finance Final Repair
-- شغّل هذا الملف مرة واحدة في Supabase SQL Editor.
-- الهدف: ضمان أن المالية تعتمد على الطلبات + تكلفة البضاعة + المصروفات بدون صفحات مكسورة.

-- 1) أعمدة تكلفة المنتج والبند، حتى يحسب النظام هامش الربح و COGS.
ALTER TABLE IF EXISTS public.products
  ADD COLUMN IF NOT EXISTS cost_price numeric(12,2) NOT NULL DEFAULT 0;

ALTER TABLE IF EXISTS public.products
  ADD COLUMN IF NOT EXISTS billing_type text NOT NULL DEFAULT 'one_time';

ALTER TABLE IF EXISTS public.order_items
  ADD COLUMN IF NOT EXISTS unit_price numeric(12,2) NOT NULL DEFAULT 0;

ALTER TABLE IF EXISTS public.order_items
  ADD COLUMN IF NOT EXISTS unit_cost numeric(12,2) NOT NULL DEFAULT 0;

-- دالة صلاحيات مرنة حتى لو role مخزن كنص أو enum.
CREATE OR REPLACE FUNCTION public.is_team_member(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id::text = _user_id::text
      AND role::text IN ('admin', 'staff')
  )
$$;

-- 2) جدول القيود/المصروفات الذي يغذي مصروفات المالية.
CREATE TABLE IF NOT EXISTS public.journal_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_date date NOT NULL DEFAULT CURRENT_DATE,
  description text NOT NULL,
  debit_account text NOT NULL,
  credit_account text NOT NULL,
  amount numeric(14,2) NOT NULL CHECK (amount > 0),
  notes text,
  reference text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.journal_entries TO authenticated;
GRANT ALL ON public.journal_entries TO service_role;

ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;

-- 3) سياسات آمنة: أي عضو فريق/أدمن يقدر يشوف ويضيف مصروفات وقيود.
DROP POLICY IF EXISTS "Admins can view journal entries" ON public.journal_entries;
DROP POLICY IF EXISTS "Admins can insert journal entries" ON public.journal_entries;
DROP POLICY IF EXISTS "Admins can update journal entries" ON public.journal_entries;
DROP POLICY IF EXISTS "Admins can delete journal entries" ON public.journal_entries;
DROP POLICY IF EXISTS "team select journal" ON public.journal_entries;
DROP POLICY IF EXISTS "team insert journal" ON public.journal_entries;
DROP POLICY IF EXISTS "team update journal" ON public.journal_entries;
DROP POLICY IF EXISTS "team delete journal" ON public.journal_entries;

CREATE POLICY "team select journal"
  ON public.journal_entries FOR SELECT TO authenticated
  USING (public.is_team_member(auth.uid()));

CREATE POLICY "team insert journal"
  ON public.journal_entries FOR INSERT TO authenticated
  WITH CHECK (public.is_team_member(auth.uid()));

CREATE POLICY "team update journal"
  ON public.journal_entries FOR UPDATE TO authenticated
  USING (public.is_team_member(auth.uid()))
  WITH CHECK (public.is_team_member(auth.uid()));

CREATE POLICY "team delete journal"
  ON public.journal_entries FOR DELETE TO authenticated
  USING (public.is_team_member(auth.uid()));

-- 4) صلاحيات Data API للجداول التي تقرأها المالية.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO authenticated;
GRANT ALL ON public.orders TO service_role;
GRANT ALL ON public.order_items TO service_role;
GRANT ALL ON public.products TO service_role;
GRANT ALL ON public.customers TO service_role;

-- 5) دعم Realtime حتى تتحدث لوحة المالية فوراً، بدون فشل لو الجدول مضاف بالفعل.
DO $$
DECLARE
  tbl text;
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    FOREACH tbl IN ARRAY ARRAY['orders', 'order_items', 'products', 'journal_entries'] LOOP
      IF NOT EXISTS (
        SELECT 1
        FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
          AND schemaname = 'public'
          AND tablename = tbl
      ) THEN
        EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', tbl);
      END IF;
    END LOOP;
  END IF;
END $$;
-- Ensure customers.id has a UUID default (fixes: null value in column "id")
ALTER TABLE public.customers ALTER COLUMN id SET DEFAULT gen_random_uuid();
