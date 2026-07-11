import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Lock } from "lucide-react";
import { useRole } from "@/lib/roles";

/** Wrap a page's content to hide it from non-admins. */
export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { isAdmin, loading, role } = useRole();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && role && !isAdmin) {
      const t = setTimeout(() => navigate({ to: "/" }), 1400);
      return () => clearTimeout(t);
    }
  }, [loading, role, isAdmin, navigate]);

  if (loading) return null;
  if (isAdmin) return <>{children}</>;

  return (
    <div className="grid min-h-[60vh] place-items-center">
      <div className="surface-elevated max-w-md p-8 text-center">
        <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
          <Lock className="h-6 w-6" />
        </div>
        <h2 className="font-display text-lg font-bold">صلاحيات غير كافية</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          هذه الصفحة مخصصة للمدراء فقط. سيتم تحويلك للرئيسية…
        </p>
      </div>
    </div>
  );
}
