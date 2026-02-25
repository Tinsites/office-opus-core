import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CheckSquare, Circle, Clock, Plus, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Task {
  id: string;
  title: string;
  description: string | null;
  project_id: string | null;
  assignee_id: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  is_completed: boolean;
  projects?: { name: string } | null;
  assignee_profile?: { full_name: string | null } | null;
}

interface Project { id: string; name: string; }
interface Profile { user_id: string; full_name: string | null; }

const priorityStyles: Record<string, string> = {
  high: "bg-destructive/10 text-destructive",
  medium: "bg-primary/10 text-primary",
  low: "bg-muted text-muted-foreground",
};

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } };
const item = { hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0 } };

const Tasks = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [filterPriority, setFilterPriority] = useState<string | null>(null);
  const [filterProject, setFilterProject] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", description: "", project_id: "", assignee_id: "", priority: "medium", due_date: "" });

  const fetchAll = async () => {
    const [{ data: t }, { data: p }, { data: pr }] = await Promise.all([
      supabase.from("tasks").select("*, projects(name)").order("created_at", { ascending: false }),
      supabase.from("projects").select("id, name").order("name"),
      supabase.from("profiles").select("user_id, full_name"),
    ]);
    if (t) {
      const tasksWithProfiles = (t as any[]).map(task => ({
        ...task,
        assignee_profile: pr?.find(p => p.user_id === task.assignee_id) || null,
      }));
      setTasks(tasksWithProfiles);
    }
    if (p) setProjects(p);
    if (pr) setProfiles(pr);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const resetForm = () => {
    setForm({ title: "", description: "", project_id: "", assignee_id: "", priority: "medium", due_date: "" });
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    const { error } = await supabase.from("tasks").insert({
      title: form.title,
      description: form.description || null,
      project_id: form.project_id || null,
      assignee_id: form.assignee_id || null,
      priority: form.priority as any,
      due_date: form.due_date || null,
      created_by: user?.id,
    });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Task created" });
    resetForm();
    fetchAll();
  };

  const toggleComplete = async (task: Task) => {
    const newCompleted = !task.is_completed;
    const { error } = await supabase.from("tasks").update({
      is_completed: newCompleted,
      status: newCompleted ? "done" as any : "todo" as any,
    }).eq("id", task.id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    fetchAll();
  };

  const filtered = tasks.filter((t) => {
    if (filterStatus && t.status !== filterStatus) return false;
    if (filterPriority && t.priority !== filterPriority) return false;
    if (filterProject && t.project_id !== filterProject) return false;
    return true;
  });

  const remaining = tasks.filter(t => !t.is_completed).length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto pt-16 md:pt-4">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-display font-bold text-foreground">Tasks</h1>
          <p className="text-muted-foreground text-sm mt-1">{remaining} tasks remaining</p>
        </div>
        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="h-10 px-4 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors flex items-center gap-2">
                <Filter size={14} /> Filter
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => { setFilterStatus(null); setFilterPriority(null); setFilterProject(null); }}>All</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterStatus("todo")}>To Do</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterStatus("in_progress")}>In Progress</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterStatus("done")}>Done</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterPriority("high")}>High Priority</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterPriority("medium")}>Medium Priority</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterPriority("low")}>Low Priority</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setShowForm(true)} className="h-10 px-5 gradient-orange rounded-lg text-primary-foreground text-sm font-semibold flex items-center gap-2 shadow-orange">
            <Plus size={16} /> Add Task
          </motion.button>
        </div>
      </motion.div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 shadow-card text-center">
          <p className="text-muted-foreground">No tasks found. Add your first task to get started.</p>
        </div>
      ) : (
        <motion.div variants={container} initial="hidden" animate="show" className="bg-card border border-border rounded-xl shadow-card divide-y divide-border">
          {filtered.map((task) => (
            <motion.div key={task.id} variants={item} className={`flex items-start sm:items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3 sm:py-4 hover:bg-muted/30 transition-colors cursor-pointer ${task.is_completed ? "opacity-50" : ""}`}>
              <button onClick={() => toggleComplete(task)} className="text-muted-foreground hover:text-primary transition-colors mt-0.5 sm:mt-0 shrink-0">
                {task.is_completed ? <CheckSquare size={18} className="text-primary" /> : <Circle size={18} />}
              </button>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${task.is_completed ? "line-through text-muted-foreground" : "text-foreground"}`}>{task.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{task.projects?.name || "No project"}</p>
                <div className="flex items-center gap-2 mt-1.5 sm:hidden flex-wrap">
                  <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${priorityStyles[task.priority]}`}>{task.priority}</span>
                  {task.due_date && <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Clock size={10} />{new Date(task.due_date).toLocaleDateString()}</span>}
                </div>
              </div>
              {task.assignee_profile?.full_name && (
                <div className="hidden sm:flex w-7 h-7 rounded-full bg-secondary items-center justify-center text-xs font-medium text-secondary-foreground shrink-0">
                  {task.assignee_profile.full_name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                </div>
              )}
              <span className={`hidden sm:inline text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${priorityStyles[task.priority]}`}>
                {task.priority}
              </span>
              {task.due_date && (
                <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground min-w-[70px]">
                  <Clock size={12} /> {new Date(task.due_date).toLocaleDateString()}
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>
      )}

      <Dialog open={showForm} onOpenChange={(open) => { if (!open) resetForm(); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Task</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Title *</label>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full h-10 px-3 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring/40" placeholder="Task title" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Description</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full min-h-[60px] px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring/40" placeholder="Task description" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Project</label>
                <select value={form.project_id} onChange={(e) => setForm({ ...form, project_id: e.target.value })} className="w-full h-10 px-3 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring/40">
                  <option value="">None</option>
                  {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Assignee</label>
                <select value={form.assignee_id} onChange={(e) => setForm({ ...form, assignee_id: e.target.value })} className="w-full h-10 px-3 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring/40">
                  <option value="">Unassigned</option>
                  {profiles.map((p) => <option key={p.user_id} value={p.user_id}>{p.full_name || "User"}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Priority</label>
                <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="w-full h-10 px-3 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring/40">
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Due Date</label>
                <input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} className="w-full h-10 px-3 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring/40" />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={resetForm} className="h-10 px-4 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors">Cancel</button>
              <button type="submit" className="h-10 px-5 gradient-orange rounded-lg text-primary-foreground text-sm font-semibold shadow-orange">Create Task</button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Tasks;
