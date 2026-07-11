import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

/**
 * Subscribe to Realtime changes on a table and invalidate the given query keys.
 * Optionally show a toast for INSERT events.
 */
export function useRealtimeInvalidate(
  table: "orders" | "tickets" | "subscriptions",
  queryKeys: (string | number)[][],
  options?: { toastOnInsert?: (row: any) => string | null },
) {
  const qc = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel(`rt:${table}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        (payload) => {
          queryKeys.forEach(key => qc.invalidateQueries({ queryKey: key }));
          if (payload.eventType === "INSERT" && options?.toastOnInsert) {
            const msg = options.toastOnInsert(payload.new);
            if (msg) toast.success(msg);
          }
        },
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table]);
}
