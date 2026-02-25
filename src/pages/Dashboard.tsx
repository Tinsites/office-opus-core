import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, FolderKanban, CheckSquare, DollarSign, TrendingUp, Clock, ArrowUpRight, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } };

const priorityStyles: Record<string, string> = {
  high: "bg-destructive/10 text-destructive",
  medium: "bg-primary/10 text-primary",
  low: "bg-muted text-muted-foreground",
};
const statusStyles: Record<string, string> = {
  in_progress: "bg-primary/10 text-primary",
  review: "bg-accent text-accent-foreground",
  onboarding: "bg-muted text-muted-foreground",
};
const statusLabels: Record<string, string> = {
  onboarding: "Onboarding", in_progress: "In Progress", review: "Review", completed: "Completed",
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ clients: 0, projects: 0, tasks: 0, revenue: 0 });
  const [recentProjects, setRecentProjects] = useState<any[]>([]);
  const [recentTasks, setRecentTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const [{ count: clientCount }, { count: projectCount }, { data: openTasks }, { data: paidInvoices }, { data: projects }, { data: tasks }] = await Promise.all([
        supabase.from("clients").select("*", { count: "exact", head: true }),
        supabase.from("projects").select("*", { count: "exact", head: true }),
        supabase.from("tasks").select("*", { count: "exact", head: true }).eq("is_completed", false),
        supabase.from("invoices").select("total").eq("status", "paid"),
        supabase.from("projects").select("*, clients(name)").order("created_at", { ascending: false }).limit(4),
        supabase.from("tasks").select("*, projects(name)").eq("is_completed", false).order("due_date", { ascending: true }).limit(5),
      ]);

      const revenue = (paidInvoices || []).reduce((s: number, i: any) => s + Number(i.total), 0);
      setStats({ clients: clientCount || 0, projects: projectCount || 0, tasks: openTasks?.length || 0, revenue });
      setRecentProjects(projects || []);
      setRecentTasks(tasks || []);
      setLoading(false);
    };
    fetch();
  }, []);

  const statCards = [
    { label: "Active Clients", value: stats.clients.toString(), icon: Users, trend: "up" },
    { label: "Projects", value: stats.projects.toString(), icon: FolderKanban, trend: "up" },
    { label: "Open Tasks", value: stats.tasks.toString(), icon: CheckSquare, trend: "neutral" },
    { label: "Revenue", value: `$${stats.revenue.toLocaleString()}`, icon: DollarSign, trend: "up" },
  ];

  if (loading) return <div className="flex items-center justify-center h-full py-20"><div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto pt-16 md:pt-4">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-display font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Welcome back — here's your overview.</p>
        </div>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => navigate("/projects")} className="h-10 px-5 gradient-orange rounded-lg text-primary-foreground text-sm font-semibold flex items-center gap-2 shadow-orange self-start sm:self-auto">
          <Plus size={16} /> New Project
        </motion.button>
      </motion.div>

      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        {statCards.map((stat) => (
          <motion.div key={stat.label} variants={item} className="bg-card border border-border rounded-xl p-5 shadow-card hover:shadow-card-hover transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center"><stat.icon size={20} className="text-accent-foreground" /></div>
              {stat.trend === "up" && <TrendingUp size={16} className="text-primary" />}
            </div>
            <p className="text-2xl font-display font-bold text-foreground">{stat.value}</p>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6">
        <motion.div variants={container} initial="hidden" animate="show" className="lg:col-span-3 bg-card border border-border rounded-xl shadow-card">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h2 className="font-display font-semibold text-foreground">Active Projects</h2>
            <button onClick={() => navigate("/projects")} className="text-xs text-primary font-medium flex items-center gap-1 hover:underline">View all <ArrowUpRight size={12} /></button>
          </div>
          <div className="divide-y divide-border">
            {recentProjects.length === 0 ? (
              <div className="px-5 py-8 text-center text-muted-foreground text-sm">No projects yet</div>
            ) : recentProjects.map((project: any) => (
              <motion.div key={project.id} variants={item} className="px-5 py-4 flex items-center gap-4 hover:bg-muted/40 transition-colors cursor-pointer" onClick={() => navigate("/projects")}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{project.name}</p>
                  <p className="text-xs text-muted-foreground">{project.clients?.name || "No client"}</p>
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusStyles[project.status] || ""}`}>{statusLabels[project.status] || project.status}</span>
                <div className="w-24">
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${project.progress}%` }} transition={{ duration: 0.8 }} className="h-full gradient-orange rounded-full" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div variants={container} initial="hidden" animate="show" className="lg:col-span-2 bg-card border border-border rounded-xl shadow-card">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h2 className="font-display font-semibold text-foreground">Upcoming Tasks</h2>
            <button onClick={() => navigate("/tasks")} className="text-xs text-primary font-medium flex items-center gap-1 hover:underline">View all <ArrowUpRight size={12} /></button>
          </div>
          <div className="divide-y divide-border">
            {recentTasks.length === 0 ? (
              <div className="px-5 py-8 text-center text-muted-foreground text-sm">No tasks yet</div>
            ) : recentTasks.map((task: any) => (
              <motion.div key={task.id} variants={item} className="px-5 py-3.5 hover:bg-muted/40 transition-colors cursor-pointer" onClick={() => navigate("/tasks")}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{task.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{task.projects?.name || "No project"}</p>
                  </div>
                  <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full whitespace-nowrap ${priorityStyles[task.priority]}`}>{task.priority}</span>
                </div>
                {task.due_date && (
                  <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground"><Clock size={12} /><span>{new Date(task.due_date).toLocaleDateString()}</span></div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
