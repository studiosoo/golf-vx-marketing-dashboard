import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { X, Plus, Loader2, CheckCircle2, ExternalLink, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const CAMPAIGN_SECTIONS = [
  "Trial Conversion Campaign",
  "Membership Acquisition campaign",
  "Member Retention + Community Flywheel",
  "Venue Display / Local Media",
];

interface TaskDraft {
  id: string;
  name: string;
  notes: string;
  due_on: string;
  campaignSection: string;
}

interface AsanaTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  suggestedTasks?: Array<{
    name: string;
    notes?: string;
    due_on?: string;
    campaignSection?: string;
  }>;
  title?: string;
}

function generateId() {
  return Math.random().toString(36).slice(2);
}

export default function AsanaTaskModal({ isOpen, onClose, suggestedTasks, title }: AsanaTaskModalProps) {
  const [tasks, setTasks] = useState<TaskDraft[]>(() => {
    if (suggestedTasks && suggestedTasks.length > 0) {
      return suggestedTasks.map(t => ({
        id: generateId(),
        name: t.name,
        notes: t.notes || "",
        due_on: t.due_on || "",
        campaignSection: t.campaignSection || CAMPAIGN_SECTIONS[0],
      }));
    }
    return [{ id: generateId(), name: "", notes: "", due_on: "", campaignSection: CAMPAIGN_SECTIONS[0] }];
  });
  const [createdTasks, setCreatedTasks] = useState<Array<{ name: string; permalink_url: string }>>([]);

  const createBatch = trpc.asana.createBatchTasks.useMutation({
    onSuccess: (result) => {
      setCreatedTasks(result.tasks.map(t => ({ name: t.name, permalink_url: t.permalink_url })));
      if (result.errors.length > 0) {
        toast({ title: `${result.created} tasks created, ${result.errors.length} failed`, variant: "destructive" });
      } else {
        toast({ title: `${result.created} task${result.created !== 1 ? "s" : ""} added to Asana` });
      }
    },
    onError: (err: unknown) => {
      toast({ title: "Failed to create tasks", description: (err as Error).message, variant: "destructive" });
    },
  });

  const updateTask = (id: string, field: keyof TaskDraft, value: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  const addTask = () => {
    setTasks(prev => [...prev, { id: generateId(), name: "", notes: "", due_on: "", campaignSection: CAMPAIGN_SECTIONS[0] }]);
  };

  const removeTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const handleSubmit = () => {
    const valid = tasks.filter(t => t.name.trim().length > 0);
    if (valid.length === 0) {
      toast({ title: "Please enter at least one task name", variant: "destructive" });
      return;
    }
    createBatch.mutate({
      tasks: valid.map(t => ({
        name: t.name.trim(),
        notes: t.notes || undefined,
        due_on: t.due_on || undefined,
        campaignSection: t.campaignSection || undefined,
      })),
    });
  };

  if (!isOpen) return null;

  const isDone = createdTasks.length > 0;
  const validCount = tasks.filter(t => t.name.trim()).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E0E0E0]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#F06A35]/10 flex items-center justify-center">
              <svg className="w-4 h-4 text-[#F06A35]" viewBox="0 0 32 32" fill="currentColor">
                <circle cx="16" cy="6" r="5" /><circle cx="6" cy="26" r="5" /><circle cx="26" cy="26" r="5" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[#111]">{title || "Add to Asana"}</h2>
              <p className="text-xs text-[#888]">Marketing Master Timeline / Control Tower</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#F5F5F5] transition-colors">
            <X className="w-4 h-4 text-[#666]" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {isDone ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-[#3DB855]">
                <CheckCircle2 className="w-5 h-5" />
                <span className="text-sm font-medium">{createdTasks.length} task{createdTasks.length !== 1 ? "s" : ""} created in Asana</span>
              </div>
              {createdTasks.map((t, i) => (
                <a key={i} href={t.permalink_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2.5 bg-[#FAFAFA] border border-[#E0E0E0] rounded-lg hover:bg-[#F0F0F0] transition-colors group">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#3DB855] flex-shrink-0" />
                  <span className="text-sm text-[#333] flex-1 truncate">{t.name}</span>
                  <ExternalLink className="w-3.5 h-3.5 text-[#AAA] group-hover:text-[#666] flex-shrink-0" />
                </a>
              ))}
            </div>
          ) : (
            tasks.map((task, idx) => (
              <div key={task.id} className="border border-[#E0E0E0] rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-[#888]">Task {idx + 1}</span>
                  {tasks.length > 1 && (
                    <button onClick={() => removeTask(task.id)} className="p-1 rounded hover:bg-red-50 text-[#CCC] hover:text-red-400 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="Task name *"
                  value={task.name}
                  onChange={e => updateTask(task.id, "name", e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-[#E0E0E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F5C72C]/50 focus:border-[#F5C72C]"
                />
                <textarea
                  placeholder="Notes / description (optional)"
                  value={task.notes}
                  onChange={e => updateTask(task.id, "notes", e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 text-sm border border-[#E0E0E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F5C72C]/50 focus:border-[#F5C72C] resize-none"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-[#888] mb-1">Due date</label>
                    <input
                      type="date"
                      value={task.due_on}
                      onChange={e => updateTask(task.id, "due_on", e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-[#E0E0E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F5C72C]/50 focus:border-[#F5C72C]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#888] mb-1">Campaign section</label>
                    <select
                      value={task.campaignSection}
                      onChange={e => updateTask(task.id, "campaignSection", e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-[#E0E0E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F5C72C]/50 focus:border-[#F5C72C] bg-white"
                    >
                      {CAMPAIGN_SECTIONS.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="px-6 py-4 border-t border-[#E0E0E0] flex items-center justify-between gap-3">
          {isDone ? (
            <button onClick={onClose} className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-[#111] rounded-xl hover:bg-[#333] transition-colors">
              Done
            </button>
          ) : (
            <>
              <button onClick={addTask} disabled={createBatch.isPending}
                className="flex items-center gap-1.5 px-3 py-2 text-sm text-[#666] border border-[#E0E0E0] rounded-xl hover:bg-[#F5F5F5] transition-colors disabled:opacity-50">
                <Plus className="w-4 h-4" />Add task
              </button>
              <div className="flex items-center gap-2">
                <button onClick={onClose} disabled={createBatch.isPending}
                  className="px-4 py-2.5 text-sm text-[#666] border border-[#E0E0E0] rounded-xl hover:bg-[#F5F5F5] transition-colors disabled:opacity-50">
                  Cancel
                </button>
                <button onClick={handleSubmit} disabled={createBatch.isPending}
                  className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-[#F06A35] rounded-xl hover:bg-[#D85A28] transition-colors disabled:opacity-50">
                  {createBatch.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {createBatch.isPending ? "Creating…" : `Create ${validCount || ""} task${validCount !== 1 ? "s" : ""}`}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
