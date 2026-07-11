import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const GROUPS: { title: string; items: { keys: string[]; label: string }[] }[] = [
  {
    title: "عام",
    items: [
      { keys: ["⌘", "K"], label: "فتح البحث الشامل" },
      { keys: ["?"], label: "عرض الاختصارات" },
      { keys: ["⌘", "\\"], label: "تبديل الوضع الليلي" },
      { keys: ["/"], label: "تركيز البحث" },
    ],
  },
  {
    title: "التنقل (اضغط G ثم…)",
    items: [
      { keys: ["G", "D"], label: "لوحة القيادة" },
      { keys: ["G", "O"], label: "الطلبات" },
      { keys: ["G", "C"], label: "العملاء" },
      { keys: ["G", "S"], label: "الاشتراكات" },
      { keys: ["G", "L"], label: "خزنة التراخيص" },
      { keys: ["G", "F"], label: "المالية" },
      { keys: ["G", "R"], label: "التقارير" },
      { keys: ["G", "T"], label: "الدعم الفني" },
    ],
  },
  {
    title: "إجراءات",
    items: [
      { keys: ["N"], label: "طلب جديد" },
      { keys: ["Esc"], label: "إغلاق النوافذ" },
    ],
  },
];

export function ShortcutsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>اختصارات لوحة المفاتيح</DialogTitle>
        </DialogHeader>
        <div className="grid gap-6 sm:grid-cols-2">
          {GROUPS.map(g => (
            <div key={g.title}>
              <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{g.title}</div>
              <ul className="space-y-1.5">
                {g.items.map(it => (
                  <li key={it.label} className="flex items-center justify-between gap-3 rounded-md px-2 py-1.5 text-sm hover:bg-accent/40">
                    <span>{it.label}</span>
                    <div className="flex items-center gap-1">
                      {it.keys.map(k => (
                        <kbd key={k} className="rounded border border-border bg-surface-sunken px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">{k}</kbd>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
