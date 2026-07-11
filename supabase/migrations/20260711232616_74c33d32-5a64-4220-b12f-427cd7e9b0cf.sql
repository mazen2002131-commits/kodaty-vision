
-- Tighten RLS: require staff/admin role for internal team tables
-- (registration is closed; new accounts are provisioned as admin/staff only)

-- Helper: any team member (admin OR staff)
CREATE OR REPLACE FUNCTION public.is_team_member(_uid uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _uid AND role IN ('admin','staff')
  )
$$;
REVOKE EXECUTE ON FUNCTION public.is_team_member(uuid) FROM anon;

-- customers
DROP POLICY IF EXISTS "customers all authed" ON public.customers;
CREATE POLICY "team read customers" ON public.customers
  FOR SELECT TO authenticated USING (public.is_team_member(auth.uid()));
CREATE POLICY "team write customers" ON public.customers
  FOR INSERT TO authenticated WITH CHECK (public.is_team_member(auth.uid()));
CREATE POLICY "team update customers" ON public.customers
  FOR UPDATE TO authenticated USING (public.is_team_member(auth.uid())) WITH CHECK (public.is_team_member(auth.uid()));
CREATE POLICY "admin delete customers" ON public.customers
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- orders
DROP POLICY IF EXISTS "orders all authed" ON public.orders;
CREATE POLICY "team read orders" ON public.orders
  FOR SELECT TO authenticated USING (public.is_team_member(auth.uid()));
CREATE POLICY "team insert orders" ON public.orders
  FOR INSERT TO authenticated WITH CHECK (public.is_team_member(auth.uid()));
CREATE POLICY "team update orders" ON public.orders
  FOR UPDATE TO authenticated USING (public.is_team_member(auth.uid())) WITH CHECK (public.is_team_member(auth.uid()));
CREATE POLICY "admin delete orders" ON public.orders
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- order_items
DROP POLICY IF EXISTS "order_items all authed" ON public.order_items;
CREATE POLICY "team read order_items" ON public.order_items
  FOR SELECT TO authenticated USING (public.is_team_member(auth.uid()));
CREATE POLICY "team insert order_items" ON public.order_items
  FOR INSERT TO authenticated WITH CHECK (public.is_team_member(auth.uid()));
CREATE POLICY "team update order_items" ON public.order_items
  FOR UPDATE TO authenticated USING (public.is_team_member(auth.uid())) WITH CHECK (public.is_team_member(auth.uid()));
CREATE POLICY "team delete order_items" ON public.order_items
  FOR DELETE TO authenticated USING (public.is_team_member(auth.uid()));

-- subscriptions
DROP POLICY IF EXISTS "subs all authed" ON public.subscriptions;
CREATE POLICY "team read subscriptions" ON public.subscriptions
  FOR SELECT TO authenticated USING (public.is_team_member(auth.uid()));
CREATE POLICY "team insert subscriptions" ON public.subscriptions
  FOR INSERT TO authenticated WITH CHECK (public.is_team_member(auth.uid()));
CREATE POLICY "team update subscriptions" ON public.subscriptions
  FOR UPDATE TO authenticated USING (public.is_team_member(auth.uid())) WITH CHECK (public.is_team_member(auth.uid()));
CREATE POLICY "admin delete subscriptions" ON public.subscriptions
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- tickets
DROP POLICY IF EXISTS "tickets all authed" ON public.tickets;
CREATE POLICY "team read tickets" ON public.tickets
  FOR SELECT TO authenticated USING (public.is_team_member(auth.uid()));
CREATE POLICY "team insert tickets" ON public.tickets
  FOR INSERT TO authenticated WITH CHECK (public.is_team_member(auth.uid()));
CREATE POLICY "team update tickets" ON public.tickets
  FOR UPDATE TO authenticated USING (public.is_team_member(auth.uid())) WITH CHECK (public.is_team_member(auth.uid()));
CREATE POLICY "admin delete tickets" ON public.tickets
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- ticket_messages
DROP POLICY IF EXISTS "ticket_messages all authed" ON public.ticket_messages;
CREATE POLICY "team read ticket_messages" ON public.ticket_messages
  FOR SELECT TO authenticated USING (public.is_team_member(auth.uid()));
CREATE POLICY "team insert ticket_messages" ON public.ticket_messages
  FOR INSERT TO authenticated WITH CHECK (public.is_team_member(auth.uid()));
CREATE POLICY "team update ticket_messages" ON public.ticket_messages
  FOR UPDATE TO authenticated USING (public.is_team_member(auth.uid())) WITH CHECK (public.is_team_member(auth.uid()));
CREATE POLICY "admin delete ticket_messages" ON public.ticket_messages
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- licenses (sensitive keys — admin only for delete)
DROP POLICY IF EXISTS "licenses all authed" ON public.licenses;
CREATE POLICY "team read licenses" ON public.licenses
  FOR SELECT TO authenticated USING (public.is_team_member(auth.uid()));
CREATE POLICY "team insert licenses" ON public.licenses
  FOR INSERT TO authenticated WITH CHECK (public.is_team_member(auth.uid()));
CREATE POLICY "team update licenses" ON public.licenses
  FOR UPDATE TO authenticated USING (public.is_team_member(auth.uid())) WITH CHECK (public.is_team_member(auth.uid()));
CREATE POLICY "admin delete licenses" ON public.licenses
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- products: staff read; admin write (cost prices are sensitive)
DROP POLICY IF EXISTS "products all authed" ON public.products;
CREATE POLICY "team read products" ON public.products
  FOR SELECT TO authenticated USING (public.is_team_member(auth.uid()));
CREATE POLICY "admin insert products" ON public.products
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin update products" ON public.products
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin delete products" ON public.products
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- profiles: user can read own; admins read all (team page uses admin RPC anyway)
DROP POLICY IF EXISTS "profiles read all authenticated" ON public.profiles;
CREATE POLICY "profiles read own or admin" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id OR public.has_role(auth.uid(),'admin'));

-- Fix mutable search_path on trigger helper functions
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public
AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE OR REPLACE FUNCTION public.set_order_code()
RETURNS trigger LANGUAGE plpgsql SET search_path = public
AS $$ BEGIN
  IF NEW.code IS NULL OR NEW.code = '' THEN
    NEW.code := 'KD-' || nextval('public.orders_seq');
  END IF;
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.set_ticket_code()
RETURNS trigger LANGUAGE plpgsql SET search_path = public
AS $$ BEGIN
  IF NEW.code IS NULL OR NEW.code = '' THEN
    NEW.code := 'T-' || nextval('public.tickets_seq');
  END IF;
  RETURN NEW;
END; $$;
