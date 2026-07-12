
-- Marketing tables: restrict SELECT to team members
DROP POLICY IF EXISTS "auth read campaigns" ON public.marketing_campaigns;
CREATE POLICY "team read campaigns" ON public.marketing_campaigns
  FOR SELECT TO authenticated
  USING (public.is_team_member(auth.uid()));

DROP POLICY IF EXISTS "auth read coupons" ON public.marketing_coupons;
CREATE POLICY "team read coupons" ON public.marketing_coupons
  FOR SELECT TO authenticated
  USING (public.is_team_member(auth.uid()));

DROP POLICY IF EXISTS "auth read referrals" ON public.marketing_referrals;
CREATE POLICY "team read referrals" ON public.marketing_referrals
  FOR SELECT TO authenticated
  USING (public.is_team_member(auth.uid()));

-- Ticket messages: team members can only post as themselves, never as customer
DROP POLICY IF EXISTS "team insert ticket messages" ON public.ticket_messages;
DROP POLICY IF EXISTS "auth insert ticket messages" ON public.ticket_messages;
DROP POLICY IF EXISTS "insert ticket messages" ON public.ticket_messages;

CREATE POLICY "team insert ticket messages" ON public.ticket_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_team_member(auth.uid())
    AND from_customer = false
    AND (sender_id IS NULL OR sender_id = auth.uid())
  );
