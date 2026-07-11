import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command";
import { useNavigate } from "@tanstack/react-router";
import { ShoppingCart, Users, Package, KeyRound, RefreshCw, Wallet, Zap, Plus, Home, LineChart } from "lucide-react";
import { customers, orders, products } from "@/lib/mock/data";

interface Props { open: boolean; onOpenChange: (v: boolean) => void }

export function CommandPalette({ open, onOpenChange }: Props) {
  const navigate = useNavigate();
  const go = (to: string) => { onOpenChange(false); navigate({ to }); };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="ابحث عن طلب، عميل، منتج، مفتاح، أو أمر…" />
      <CommandList className="max-h-[480px]">
        <CommandEmpty>لا نتائج.</CommandEmpty>

        <CommandGroup heading="إجراءات سريعة">
          <CommandItem onSelect={() => go("/orders")}><Plus className="me-2 h-4 w-4 text-primary" />إنشاء طلب جديد</CommandItem>
          <CommandItem onSelect={() => go("/licenses")}><KeyRound className="me-2 h-4 w-4 text-primary" />إضافة مفتاح ترخيص</CommandItem>
          <CommandItem onSelect={() => go("/customers")}><Users className="me-2 h-4 w-4 text-primary" />إضافة عميل</CommandItem>
          <CommandItem onSelect={() => go("/automation")}><Zap className="me-2 h-4 w-4 text-primary" />فتح مركز الأتمتة</CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="التنقل">
          <CommandItem onSelect={() => go("/")}><Home className="me-2 h-4 w-4" />الرئيسية</CommandItem>
          <CommandItem onSelect={() => go("/orders")}><ShoppingCart className="me-2 h-4 w-4" />الطلبات</CommandItem>
          <CommandItem onSelect={() => go("/subscriptions")}><RefreshCw className="me-2 h-4 w-4" />الاشتراكات</CommandItem>
          <CommandItem onSelect={() => go("/customers")}><Users className="me-2 h-4 w-4" />العملاء</CommandItem>
          <CommandItem onSelect={() => go("/products")}><Package className="me-2 h-4 w-4" />المنتجات</CommandItem>
          <CommandItem onSelect={() => go("/licenses")}><KeyRound className="me-2 h-4 w-4" />التراخيص</CommandItem>
          <CommandItem onSelect={() => go("/finance")}><Wallet className="me-2 h-4 w-4" />المالية</CommandItem>
          <CommandItem onSelect={() => go("/analytics")}><LineChart className="me-2 h-4 w-4" />الإحصائيات</CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="الطلبات الأخيرة">
          {orders.slice(0, 5).map(o => (
            <CommandItem key={o.id} onSelect={() => go(`/orders/${o.id}`)}>
              <ShoppingCart className="me-2 h-4 w-4" />
              <span className="num me-2 text-muted-foreground">{o.code}</span>
              <span className="truncate">{products.find(p => p.id === o.productId)?.name}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandGroup heading="العملاء">
          {customers.slice(0, 5).map(c => (
            <CommandItem key={c.id} onSelect={() => go(`/customers/${c.id}`)}>
              <Users className="me-2 h-4 w-4" />{c.name}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
