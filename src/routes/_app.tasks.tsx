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
  todo: [],
  doing: [],
  review: [],
  done: [],
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
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<{ title: string; assignee: string; priority: Task["priority"]; column: ColumnId }>({
    title: "", assignee: "أنت", priority: "normal", column: "todo",
  });

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

  const submit = () => {
    if (!form.title.trim()) return;
    const task: Task = { id: crypto.randomUUID(), title: form.title.trim(), assignee: form.assignee || "أنت", priority: form.priority };
    setBoard(prev => ({ ...prev, [form.column]: [task, ...prev[form.column]] }));
    setForm({ title: "", assignee: "أنت", priority: "normal", column: "todo" });
    setOpen(false);
  };

  const total = Object.values(board).flat().length;

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">المهام</h1>
          <p className="text-sm text-muted-foreground mt-1">{total} مهمة موزّعة على الفريق</p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl brand-gradient text-white px-4 py-2 text-sm font-medium shadow-brand"
        >
          <Plus className="h-4 w-4" /> مهمة جديدة
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={() => setOpen(false)}>
          <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-elevated" onClick={e => e.stopPropagation()}>
            <h2 className="font-display text-lg font-bold">مهمة جديدة</h2>
            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-medium">العنوان</label>
                <input
                  autoFocus
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  onKeyDown={e => e.key === "Enter" && submit()}
                  placeholder="ماذا نفعل؟"
                  className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium">المسؤول</label>
                  <input
                    value={form.assignee}
                    onChange={e => setForm(f => ({ ...f, assignee: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium">الأولوية</label>
                  <select
                    value={form.priority}
                    onChange={e => setForm(f => ({ ...f, priority: e.target.value as Task["priority"] }))}
                    className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
                  >
                    <option value="low">منخفضة</option>
                    <option value="normal">عادية</option>
                    <option value="high">عالية</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium">العمود</label>
                <select
                  value={form.column}
                  onChange={e => setForm(f => ({ ...f, column: e.target.value as ColumnId }))}
                  className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
                >
                  {columns.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setOpen(false)} className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-secondary">إلغاء</button>
              <button onClick={submit} className="rounded-lg brand-gradient text-white px-4 py-2 text-sm font-medium shadow-brand">إضافة</button>
            </div>
          </div>
        </div>
      )}


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
