
CREATE TABLE public.marketing_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'other',
  reach INTEGER NOT NULL DEFAULT 0,
  orders INTEGER NOT NULL DEFAULT 0,
  revenue NUMERIC(14,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  starts_at DATE,
  ends_at DATE,
  notes TEXT,
  created_by UUID REFERENCES auth.users,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.marketing_campaigns TO authenticated;
GRANT ALL ON public.marketing_campaigns TO service_role;
ALTER TABLE public.marketing_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin manage campaigns" ON public.marketing_campaigns FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "auth read campaigns" ON public.marketing_campaigns FOR SELECT TO authenticated USING (true);
CREATE TRIGGER trg_campaigns_updated BEFORE UPDATE ON public.marketing_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.marketing_coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  discount_type TEXT NOT NULL DEFAULT 'percent',
  discount_value NUMERIC(10,2) NOT NULL DEFAULT 0,
  uses INTEGER NOT NULL DEFAULT 0,
  cap INTEGER NOT NULL DEFAULT 100,
  expires_at DATE,
  active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.marketing_coupons TO authenticated;
GRANT ALL ON public.marketing_coupons TO service_role;
ALTER TABLE public.marketing_coupons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin manage coupons" ON public.marketing_coupons FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "auth read coupons" ON public.marketing_coupons FOR SELECT TO authenticated USING (true);
CREATE TRIGGER trg_coupons_updated BEFORE UPDATE ON public.marketing_coupons
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.marketing_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  refs_count INTEGER NOT NULL DEFAULT 0,
  earned NUMERIC(14,2) NOT NULL DEFAULT 0,
  tier TEXT NOT NULL DEFAULT 'bronze',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.marketing_referrals TO authenticated;
GRANT ALL ON public.marketing_referrals TO service_role;
ALTER TABLE public.marketing_referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin manage referrals" ON public.marketing_referrals FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "auth read referrals" ON public.marketing_referrals FOR SELECT TO authenticated USING (true);
CREATE TRIGGER trg_referrals_updated BEFORE UPDATE ON public.marketing_referrals
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
