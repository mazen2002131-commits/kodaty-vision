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

export type Product = {
  id: string;
  name: string;
  category: string | null;
  price: number;
  currency: string;
  active: boolean;
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
  order_items?: { id: string; product_name: string; qty: number; unit_price: number }[];
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
        .select("*, customers(id,name,email), order_items(id,product_name,qty,unit_price)")
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
      qty: number;
      priority?: OrderPriority;
      status?: OrderStatus;
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
      });
      if (itemErr) throw itemErr;
      return order;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
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
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
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
