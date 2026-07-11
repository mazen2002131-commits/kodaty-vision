
-- Automations system
CREATE TABLE IF NOT EXISTS public.automations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT NOT NULL, -- 'order_paid' | 'subscription_expiring' | 'low_stock' | 'urgent_ticket' | 'schedule_weekly'
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  actions JSONB NOT NULL DEFAULT '[]'::jsonb, -- array of {type, params}
  active BOOLEAN NOT NULL DEFAULT true,
  runs_count INT NOT NULL DEFAULT 0,
  last_run_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.automations TO authenticated;
GRANT ALL ON public.automations TO service_role;

ALTER TABLE public.automations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "team read automations" ON public.automations FOR SELECT TO authenticated
  USING (public.is_team_member(auth.uid()));
CREATE POLICY "admin write automations" ON public.automations FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "admin update automations" ON public.automations FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "admin delete automations" ON public.automations FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE TRIGGER trg_automations_updated_at BEFORE UPDATE ON public.automations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Automation runs log
CREATE TABLE IF NOT EXISTS public.automation_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_id UUID NOT NULL REFERENCES public.automations(id) ON DELETE CASCADE,
  status TEXT NOT NULL, -- 'success' | 'failed' | 'skipped'
  trigger_data JSONB,
  result JSONB,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.automation_runs TO authenticated;
GRANT ALL ON public.automation_runs TO service_role;

ALTER TABLE public.automation_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "team read runs" ON public.automation_runs FOR SELECT TO authenticated
  USING (public.is_team_member(auth.uid()));
CREATE POLICY "team insert runs" ON public.automation_runs FOR INSERT TO authenticated
  WITH CHECK (public.is_team_member(auth.uid()));

CREATE INDEX IF NOT EXISTS idx_automation_runs_automation ON public.automation_runs(automation_id, created_at DESC);

-- Seed default automations
INSERT INTO public.automations (name, description, trigger_type, actions, active)
VALUES
  ('تسليم فوري للمفتاح بعد الدفع', 'عند اكتمال الدفع، يتم اختيار مفتاح من الخزنة وتعيينه للعميل.', 'order_paid',
   '[{"type":"assign_license"},{"type":"notify","channel":"in_app","message":"تم تسليم المفتاح للعميل"}]'::jsonb, true),
  ('تنبيه مخزون منخفض', 'إذا نزل المخزون تحت 5 مفاتيح، يُنشأ إشعار داخلي.', 'low_stock',
   '[{"type":"notify","channel":"in_app","message":"مخزون منخفض!"}]'::jsonb, true),
  ('تذكير تجديد قبل 7 أيام', 'قبل انتهاء الاشتراك بأسبوع يُسجَّل تذكير.', 'subscription_expiring',
   '[{"type":"notify","channel":"in_app","message":"اشتراك قارب على الانتهاء"}]'::jsonb, true)
ON CONFLICT DO NOTHING;
