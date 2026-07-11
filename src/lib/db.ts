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
    }) => {
      const { data: u } = await supabase.auth.getUser();
      const total = input.unit_price * input.qty;
      const { data: order, error } = await supabase
        .from("orders")
        .insert({
          code: "",
          customer_id: input.customer_id,
          status: input.status ?? "pending",
          priority: input.priority ?? "normal",
          total,
          created_by: u.user?.id,
        })
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
        const starts = new Date();
        const ends = new Date(starts);
        if (input.billing_type === "monthly") ends.setMonth(ends.getMonth() + 1);
        else ends.setFullYear(ends.getFullYear() + 1);
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
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["order", v.id] });
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

export function daysBetween(iso: string): number {
  return Math.round((new Date(iso).getTime() - Date.now()) / 86400000);
}

