import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, GripVertical } from "lucide-react";

export const Route = createFileRoute("/_app/tasks")({
  component: Tasks,
  head: () => ({ meta: [{ title: "المهام — Kodaty" }] }),
});

type Task = { id: string; title: string; assignee: string; priority: "low" | "normal" | "high" };
type ColumnId = "todo" | "doing" | "review" | "done";

const initial: Record<ColumnId, Task[]> = {
  todo: [
    { id: "1", title: "متابعة طلبات Adobe المعلقة", assignee: "أحمد", priority: "high" },
    { id: "2", title: "تحديث أسعار Office 365", assignee: "سارة", priority: "normal" },
    { id: "3", title: "استيراد 200 مفتاح Windows 11", assignee: "محمد", priority: "normal" },
  ],
  doing: [
    { id: "4", title: "تصميم صفحة الهبوط الجديدة", assignee: "منى", priority: "high" },
    { id: "5", title: "معالجة استرداد #KD-10023", assignee: "أحمد", priority: "normal" },
  ],
  review: [
    { id: "6", title: "مراجعة تذاكر الدعم المفتوحة", assignee: "سارة", priority: "low" },
  ],
  done: [
    { id: "7", title: "إعداد حملة رمضان", assignee: "منى", priority: "normal" },
    { id: "8", title: "تسوية حساب InstaPay", assignee: "محمد", priority: "high" },
  ],
};

const columns: { id: ColumnId; label: string; tone: string }[] = [
  { id: "todo", label: "للتنفيذ", tone: "bg-muted text-muted-foreground" },
  { id: "doing", label: "قيد العمل", tone: "bg-info/10 text-info" },
  { id: "review", label: "للمراجعة", tone: "bg-warning/10 text-warning" },
  { id: "done", label: "منجزة", tone: "bg-success/10 text-success" },
];

function Tasks() {
  const [board, setBoard] = useState(initial);
  const [dragging, setDragging] = useState<{ from: ColumnId; id: string } | null>(null);
  const [newTitle, setNewTitle] = useState("");

  const move = (to: ColumnId) => {
    if (!dragging) return;
    const task = board[dragging.from].find(t => t.id === dragging.id);
    if (!task) return;
    setBoard({
      ...board,
      [dragging.from]: board[dragging.from].filter(t => t.id !== dragging.id),
      [to]: [task, ...board[to]],
    });
    setDragging(null);
  };

  const add = () => {
    if (!newTitle.trim()) return;
    setBoard({
      ...board,
      todo: [{ id: crypto.randomUUID(), title: newTitle, assignee: "أنت", priority: "normal" }, ...board.todo],
    });
    setNewTitle("");
  };

  const total = Object.values(board).flat().length;

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">المهام</h1>
          <p className="text-sm text-muted-foreground mt-1">{total} مهمة موزّعة على الفريق</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            onKeyDown={e => e.key === "Enter" && add()}
            placeholder="مهمة سريعة…"
            className="input-base w-56"
          />
          <button onClick={add} className="inline-flex items-center gap-2 rounded-xl brand-gradient text-white px-4 py-2 text-sm font-medium shadow-brand">
            <Plus className="h-4 w-4" /> إضافة
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {columns.map(col => (
          <div
            key={col.id}
            onDragOver={e => e.preventDefault()}
            onDrop={() => move(col.id)}
            className="surface-elevated p-4 min-h-[400px]"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full ${col.tone}`}>{col.label}</span>
                <span className="text-xs text-muted-foreground">{board[col.id].length}</span>
              </div>
            </div>
            <div className="space-y-2">
              {board[col.id].map(t => (
                <div
                  key={t.id}
                  draggable
                  onDragStart={() => setDragging({ from: col.id, id: t.id })}
                  className="group rounded-xl border border-border bg-surface p-3 cursor-grab active:cursor-grabbing hover:border-brand-500/50 hover:shadow-brand transition"
                >
                  <div className="flex items-start gap-2">
                    <GripVertical className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 mt-0.5" />
                    <div className="flex-1">
                      <div className="text-sm font-medium leading-snug">{t.title}</div>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">{t.assignee}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                          t.priority === "high" ? "bg-danger/10 text-danger" :
                          t.priority === "low" ? "bg-muted text-muted-foreground" :
                          "bg-brand-500/10 text-brand-600"
                        }`}>
                          {t.priority === "high" ? "عالية" : t.priority === "low" ? "منخفضة" : "عادية"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {board[col.id].length === 0 && (
                <div className="text-center text-xs text-muted-foreground py-8">اسحب مهمة هنا</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
