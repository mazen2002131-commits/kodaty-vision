import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Customer = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  tier: string;
  tags: string[];
  notes: string | null;
  created_at: string;
};

export type BillingType = "one_time" | "monthly" | "yearly";

export type Product = {
  id: string;
  name: string;
  category: string | null;
  price: number;
  cost_price: number;
  currency: string;
  active: boolean;
  billing_type: BillingType;
};



export type Order = {
  id: string;
  code: string;
  customer_id: string | null;
  status: string;
  priority: string;
  total: number;
  currency: string;
  payment_method: string | null;
  tags: string[];
  created_at: string;
  customers?: Pick<Customer, "id" | "name" | "email"> | null;
  order_items?: { id: string; product_name: string; qty: number; unit_price: number; unit_cost?: number }[];
};

// ---------- Customers ----------
export function useCustomers() {
  return useQuery({
    queryKey: ["customers"],
    queryFn: async (): Promise<Customer[]> => {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Customer[];
    },
  });
}

export function useCreateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      name: string;
      email?: string;
      phone?: string;
      company?: string;
      tier?: string;
    }) => {
      const { data: u } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("customers")
        .insert({ ...input, tier: input.tier ?? "regular", created_by: u.user?.id })
        .select()
        .single();
      if (error) throw error;
      return data as Customer;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["customers"] }),
  });
}

export function useUpdateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id: string;
      name?: string;
      email?: string | null;
      phone?: string | null;
      company?: string | null;
      tier?: string;
      notes?: string | null;
    }) => {
      const { id, ...patch } = input;
      const { data, error } = await supabase
        .from("customers")
        .update(patch)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as Customer;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["customers"] });
      qc.invalidateQueries({ queryKey: ["customer", v.id] });
    },
  });
}

export function useDeleteCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("customers").delete().eq("id", id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["customers"] }),
  });
}


// ---------- Products ----------
export function useProducts() {
  return useQuery({
    queryKey: ["products"],
    queryFn: async (): Promise<Product[]> => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("active", true)
        .order("name");
      if (error) throw error;
      return data as Product[];
    },
  });
}

// ---------- Orders ----------
export function useOrders() {
  return useQuery({
    queryKey: ["orders"],
    queryFn: async (): Promise<Order[]> => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, customers(id,name,email), order_items(id,product_name,qty,unit_price,unit_cost)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Order[];
    },
  });
}

export type OrderStatus = "pending" | "processing" | "delivered" | "cancelled" | "refunded";
export type OrderPriority = "low" | "normal" | "high" | "urgent";

export function useCreateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      customer_id: string;
      product_id: string;
      product_name: string;
      unit_price: number;
      unit_cost?: number;
      qty: number;
      priority?: OrderPriority;
      status?: OrderStatus;
      billing_type?: BillingType;
      starts_at?: string;
      ends_at?: string;
      duration_months?: number;
      payment_method?: string | null;
      order_date?: string;
    }) => {
      const { data: u } = await supabase.auth.getUser();
      const total = input.unit_price * input.qty;
      const insertPayload: any = {
        code: "",
        customer_id: input.customer_id,
        status: input.status ?? "pending",
        priority: input.priority ?? "normal",
        total,
        created_by: u.user?.id,
        payment_method: input.payment_method ?? null,
      };
      if (input.order_date) insertPayload.created_at = new Date(input.order_date).toISOString();
      const { data: order, error } = await supabase
        .from("orders")
        .insert(insertPayload)
        .select()
        .single();
      if (error) throw error;
      const { error: itemErr } = await supabase.from("order_items").insert({
        order_id: order.id,
        product_id: input.product_id,
        product_name: input.product_name,
        qty: input.qty,
        unit_price: input.unit_price,
        unit_cost: input.unit_cost ?? 0,
      });
      if (itemErr) throw itemErr;

      // Auto-create subscription for recurring products
      if (input.billing_type && input.billing_type !== "one_time") {
        const starts = input.starts_at ? new Date(input.starts_at) : new Date();
        let ends: Date;
        if (input.ends_at) {
          ends = new Date(input.ends_at);
        } else if (input.duration_months && input.duration_months > 0) {
          ends = new Date(starts);
          ends.setMonth(ends.getMonth() + input.duration_months);
        } else {
          ends = new Date(starts);
          if (input.billing_type === "monthly") ends.setMonth(ends.getMonth() + 1);
          else ends.setFullYear(ends.getFullYear() + 1);
        }
        const { error: subErr } = await supabase.from("subscriptions").insert({
          customer_id: input.customer_id,
          product_id: input.product_id,
          product_name: input.product_name,
          starts_at: starts.toISOString(),
          ends_at: ends.toISOString(),
          auto_renew: true,
          status: "active",
          price: input.unit_price,
        });
        if (subErr) throw subErr;
      }
      return order;
    },

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["subscriptions"] });
    },

  });
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: OrderStatus }) => {
      const { error } = await supabase.from("orders").update({ status }).eq("id", id);
      if (error) throw error;
      if (status === "delivered") {
        const { data: o } = await supabase
          .from("orders")
          .select("id, customer_id, order_items(product_id, product_name)")
          .eq("id", id)
          .maybeSingle();
        const item = (o as any)?.order_items?.[0];
        const { runAutomationsFor } = await import("./automation");
        await runAutomationsFor("order_paid", {
          order_id: id,
          customer_id: (o as any)?.customer_id,
          product_id: item?.product_id,
          product_name: item?.product_name,
        });
      }
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["order", v.id] });
      qc.invalidateQueries({ queryKey: ["licenses"] });
      qc.invalidateQueries({ queryKey: ["automations"] });
      qc.invalidateQueries({ queryKey: ["automation_runs", "all"] });
    },
  });
}

export function useUpdateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: { id: string; status?: OrderStatus; priority?: OrderPriority; payment_method?: string | null }) => {
      const { error } = await supabase.from("orders").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["order", v.id] });
    },
  });
}

export function useUpdateOrderItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, order_id, unit_price, qty, unit_cost }: { id: string; order_id: string; unit_price?: number; qty?: number; unit_cost?: number }) => {
      const patch: { unit_price?: number; qty?: number; unit_cost?: number } = {};
      if (unit_price !== undefined) patch.unit_price = unit_price;
      if (qty !== undefined) patch.qty = qty;
      if (unit_cost !== undefined) patch.unit_cost = unit_cost;
      const { error } = await supabase.from("order_items").update(patch).eq("id", id);

      if (error) throw error;
      // recompute order total from all items
      const { data: items, error: e2 } = await supabase.from("order_items").select("qty,unit_price").eq("order_id", order_id);
      if (e2) throw e2;
      const total = (items ?? []).reduce((s, it: any) => s + Number(it.unit_price) * Number(it.qty), 0);
      const { error: e3 } = await supabase.from("orders").update({ total }).eq("id", order_id);
      if (e3) throw e3;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["order", v.order_id] });
    },
  });
}

export function useDeleteOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("order_items").delete().eq("order_id", id);
      const { error } = await supabase.from("orders").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}

export function useCustomer(id: string) {
  return useQuery({
    queryKey: ["customer", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("customers").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data as Customer | null;
    },
  });
}

export function useCustomerOrders(customerId: string) {
  return useQuery({
    queryKey: ["customer-orders", customerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(id,product_name,qty,unit_price,unit_cost)")
        .eq("customer_id", customerId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Order[];
    },
  });
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: ["order", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, customers(id,name,email,phone,company,tier), order_items(id,product_id,product_name,qty,unit_price,unit_cost)")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data as (Order & { customers: (Customer & { phone: string | null }) | null }) | null;
    },
  });
}


// Helper — deterministic avatar color from a string
export function avatarColor(seed: string): string {
  const colors = ["#4F04AC", "#7C3AED", "#0EA5E9", "#059669", "#DC2626", "#D97706", "#DB2777", "#0891B2"];
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return colors[Math.abs(h) % colors.length];
}

export function formatEGP(n: number): string {
  return new Intl.NumberFormat("ar-EG", { style: "currency", currency: "EGP", maximumFractionDigits: 0 }).format(n);
}

// ---------- Subscriptions ----------
export type Subscription = {
  id: string;
  customer_id: string;
  product_id: string | null;
  product_name: string;
  starts_at: string;
  ends_at: string;
  auto_renew: boolean;
  status: "active" | "expiring" | "expired" | "cancelled";
  price: number | null;
  customers?: Pick<Customer, "id" | "name" | "email"> | null;
};

export function useSubscriptions() {
  return useQuery({
    queryKey: ["subscriptions"],
    queryFn: async (): Promise<Subscription[]> => {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*, customers(id,name,email)")
        .order("ends_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Subscription[];
    },
  });
}

export function useCreateSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      customer_id: string;
      product_id?: string | null;
      product_name: string;
      price?: number | null;
      billing_type: "monthly" | "yearly";
      auto_renew?: boolean;
      notes?: string | null;
      starts_at?: string;
      ends_at?: string;
      duration_months?: number;
    }) => {
      const starts = input.starts_at ? new Date(input.starts_at) : new Date();
      let ends: Date;
      if (input.ends_at) {
        ends = new Date(input.ends_at);
      } else if (input.duration_months && input.duration_months > 0) {
        ends = new Date(starts);
        ends.setMonth(ends.getMonth() + input.duration_months);
      } else {
        ends = new Date(starts);
        if (input.billing_type === "monthly") ends.setMonth(ends.getMonth() + 1);
        else ends.setFullYear(ends.getFullYear() + 1);
      }
      const { error } = await supabase.from("subscriptions").insert({
        customer_id: input.customer_id,
        product_id: input.product_id ?? null,
        product_name: input.product_name,
        price: input.price ?? null,
        auto_renew: input.auto_renew ?? false,
        status: "active",
        starts_at: starts.toISOString(),
        ends_at: ends.toISOString(),
        notes: input.notes ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["subscriptions"] }),
  });
}

// ---------- Licenses ----------
export type License = {
  id: string;
  product_id: string | null;
  product_name: string;
  key: string;
  status: "available" | "sold" | "reserved" | "revoked";
  cost: number | null;
  sold_to: string | null;
  sold_at: string | null;
  expires_at: string | null;
  notes: string | null;
  created_at: string;
};

export function useLicenses() {
  return useQuery({
    queryKey: ["licenses"],
    queryFn: async (): Promise<License[]> => {
      const { data, error } = await supabase
        .from("licenses")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as License[];
    },
  });
}

export function useCreateLicense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { product_id: string; product_name: string; key: string; cost?: number }) => {
      const { error } = await supabase.from("licenses").insert({
        product_id: input.product_id,
        product_name: input.product_name,
        key: input.key,
        cost: input.cost ?? null,
        status: "available",
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["licenses"] }),
  });
}

// ---------- Tickets ----------
export type Ticket = {
  id: string;
  code: string;
  customer_id: string | null;
  subject: string;
  status: "open" | "pending" | "resolved" | "closed";
  priority: "low" | "normal" | "high" | "urgent";
  assignee_id: string | null;
  created_at: string;
  updated_at: string;
  customers?: Pick<Customer, "id" | "name" | "email"> | null;
};

export function useTickets() {
  return useQuery({
    queryKey: ["tickets"],
    queryFn: async (): Promise<Ticket[]> => {
      const { data, error } = await supabase
        .from("tickets")
        .select("*, customers(id,name,email)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Ticket[];
    },
  });
}

export function useCreateTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { customer_id: string; subject: string; priority?: "low"|"normal"|"high"|"urgent" }) => {
      const { error } = await supabase.from("tickets").insert({
        code: "",
        customer_id: input.customer_id,
        subject: input.subject,
        priority: input.priority ?? "normal",
        status: "open",
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tickets"] }),
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; category?: string; price: number; cost_price?: number; billing_type?: BillingType }) => {
      const { error } = await supabase.from("products").insert({
        name: input.name,
        category: input.category ?? null,
        price: input.price,
        cost_price: input.cost_price ?? 0,
        currency: "EGP",
        active: true,
        billing_type: input.billing_type ?? "one_time",
      });
      if (error) throw error;
    },


    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: { id: string; name?: string; category?: string | null; price?: number; cost_price?: number; billing_type?: BillingType; active?: boolean }) => {
      const { error } = await supabase.from("products").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });
}

export function daysBetween(iso: string): number {
  return Math.round((new Date(iso).getTime() - Date.now()) / 86400000);
}


// ---------- Marketing ----------
export type Campaign = {
  id: string;
  name: string;
  channel: string;
  reach: number;
  orders: number;
  revenue: number;
  status: string;
  starts_at: string | null;
  ends_at: string | null;
  notes: string | null;
  created_at: string;
};

export type Coupon = {
  id: string;
  code: string;
  discount_type: "percent" | "fixed";
  discount_value: number;
  uses: number;
  cap: number;
  expires_at: string | null;
  active: boolean;
  created_at: string;
};

export type Referral = {
  id: string;
  customer_id: string | null;
  name: string;
  refs_count: number;
  earned: number;
  tier: string;
  created_at: string;
};

export function useCampaigns() {
  return useQuery({
    queryKey: ["campaigns"],
    queryFn: async (): Promise<Campaign[]> => {
      const { data, error } = await supabase.from("marketing_campaigns").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Campaign[];
    },
  });
}

export function useCreateCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: Partial<Campaign>) => {
      const { data: u } = await supabase.auth.getUser();
      const { error } = await supabase.from("marketing_campaigns").insert({
        name: p.name!, channel: p.channel ?? "other",
        reach: p.reach ?? 0, orders: p.orders ?? 0, revenue: p.revenue ?? 0,
        status: p.status ?? "active", starts_at: p.starts_at ?? null, ends_at: p.ends_at ?? null,
        notes: p.notes ?? null, created_by: u.user?.id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["campaigns"] }),
  });
}

export function useUpdateCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: { id: string } & Partial<Campaign>) => {
      const { error } = await supabase.from("marketing_campaigns").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["campaigns"] }),
  });
}

export function useDeleteCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("marketing_campaigns").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["campaigns"] }),
  });
}

export function useCoupons() {
  return useQuery({
    queryKey: ["coupons"],
    queryFn: async (): Promise<Coupon[]> => {
      const { data, error } = await supabase.from("marketing_coupons").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Coupon[];
    },
  });
}

export function useCreateCoupon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: Partial<Coupon>) => {
      const { data: u } = await supabase.auth.getUser();
      const { error } = await supabase.from("marketing_coupons").insert({
        code: p.code!, discount_type: p.discount_type ?? "percent",
        discount_value: p.discount_value ?? 0, cap: p.cap ?? 100,
        expires_at: p.expires_at ?? null, active: p.active ?? true,
        created_by: u.user?.id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["coupons"] }),
  });
}

export function useDeleteCoupon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("marketing_coupons").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["coupons"] }),
  });
}

export function useReferrals() {
  return useQuery({
    queryKey: ["referrals"],
    queryFn: async (): Promise<Referral[]> => {
      const { data, error } = await supabase.from("marketing_referrals").select("*").order("earned", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Referral[];
    },
  });
}

export function useCreateReferral() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: Partial<Referral>) => {
      const { error } = await supabase.from("marketing_referrals").insert({
        name: p.name!, customer_id: p.customer_id ?? null,
        refs_count: p.refs_count ?? 0, earned: p.earned ?? 0, tier: p.tier ?? "bronze",
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["referrals"] }),
  });
}

export function useDeleteReferral() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("marketing_referrals").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["referrals"] }),
  });
}

// ---------- Order licenses ----------
export function useOrderLicenses(orderId: string) {
  return useQuery({
    queryKey: ["order-licenses", orderId],
    queryFn: async () => {
      const { data, error } = await supabase.from("licenses").select("id,key,product_name,status,expires_at").eq("sold_order_id", orderId);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!orderId,
  });
}
