import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BarChart3, TrendingUp, AlertTriangle, Target } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const COLORS = ["hsl(24,95%,53%)", "hsl(16,100%,50%)", "hsl(220,14%,70%)", "hsl(30,100%,60%)", "hsl(220,20%,85%)"];

const Analytics = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const [{ data: projects }, { data: tasks }, { data: invoices }, { data: prospects }] = await Promise.all([
        supabase.from("projects").select("status, progress"),
        supabase.from("tasks").select("status, priority, is_completed"),
        supabase.from("invoices").select("status, total, created_at"),
        supabase.from("prospects").select("response_received, follow_up_status, industry"),
      ]);

      const projectsByStatus = (projects || []).reduce((acc: any, p: any) => { acc[p.status] = (acc[p.status] || 0) + 1; return acc; }, {});
      const tasksByPriority = (tasks || []).reduce((acc: any, t: any) => { acc[t.priority] = (acc[t.priority] || 0) + 1; return acc; }, {});
      const completedTasks = (tasks || []).filter((t: any) => t.is_completed).length;
      const totalTasks = (tasks || []).length;

      const paidInvoices = (invoices || []).filter((i: any) => i.status === "paid");
      const totalRevenue = paidInvoices.reduce((s: number, i: any) => s + Number(i.total), 0);
      const overdueCount = (invoices || []).filter((i: any) => i.status === "overdue").length;

      const totalProspects = (prospects || []).length;
      const responded = (prospects || []).filter((p: any) => p.response_received).length;
      const converted = (prospects || []).filter((p: any) => p.follow_up_status === "converted").length;

      const industryBreakdown = (prospects || []).reduce((acc: any, p: any) => {
        const ind = p.industry || "Unknown";
        acc[ind] = (acc[ind] || 0) + 1;
        return acc;
      }, {});

      const projectStatusData = Object.entries(projectsByStatus).map(([name, value]) => ({ name: name.replace("_", " "), value }));
      const taskPriorityData = Object.entries(tasksByPriority).map(([name, value]) => ({ name, value }));
      const industryData = Object.entries(industryBreakdown).map(([name, value]) => ({ name, value }));

      // Attention areas for CEO
      const attentionAreas: string[] = [];
      if (overdueCount > 0) attentionAreas.push(`${overdueCount} overdue invoice(s) need attention`);
      const highPriorityOpen = (tasks || []).filter((t: any) => t.priority === "high" && !t.is_completed).length;
      if (highPriorityOpen > 0) attentionAreas.push(`${highPriorityOpen} high-priority tasks are still open`);
      const avgProgress = (projects || []).length ? Math.round((projects || []).reduce((s: number, p: any) => s + p.progress, 0) / (projects || []).length) : 0;
      if (avgProgress < 40 && (projects || []).length > 0) attentionAreas.push(`Average project progress is only ${avgProgress}%`);

      setData({
        totalRevenue, completedTasks, totalTasks, totalProspects, responded, converted,
        projectStatusData, taskPriorityData, industryData, attentionAreas, avgProgress,
        completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
        responseRate: totalProspects > 0 ? Math.round((responded / totalProspects) * 100) : 0,
      });
      setLoading(false);
    };
    fetch();
  }, []);

  if (loading) return <div className="flex items-center justify-center h-full py-20"><div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!data) return null;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto pt-16 md:pt-4">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl font-display font-bold text-foreground">Analytics</h1>
        <p className="text-muted-foreground text-sm mt-1">Performance insights and KPIs</p>
      </motion.div>

      {data.attentionAreas.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-4 bg-destructive/5 border border-destructive/20 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={16} className="text-destructive" />
            <h3 className="text-sm font-semibold text-foreground">Needs Attention</h3>
          </div>
          <ul className="space-y-1">{data.attentionAreas.map((a: string, i: number) => <li key={i} className="text-sm text-muted-foreground">• {a}</li>)}</ul>
        </motion.div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        {[
          { label: "Total Revenue", value: `$${data.totalRevenue.toLocaleString()}`, icon: TrendingUp },
          { label: "Task Completion", value: `${data.completionRate}%`, icon: Target },
          { label: "Avg Progress", value: `${data.avgProgress}%`, icon: BarChart3 },
          { label: "Prospect Response", value: `${data.responseRate}%`, icon: TrendingUp },
        ].map((s) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-xl p-4 shadow-card">
            <div className="flex items-center gap-2 mb-2"><s.icon size={16} className="text-primary" /><p className="text-xs text-muted-foreground">{s.label}</p></div>
            <p className="text-xl font-display font-bold text-foreground">{s.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-card border border-border rounded-xl p-5 shadow-card">
          <h3 className="font-display font-semibold text-foreground mb-4">Projects by Status</h3>
          {data.projectStatusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data.projectStatusData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,13%,91%)" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: "hsl(220,10%,46%)" }} />
                <YAxis tick={{ fontSize: 12, fill: "hsl(220,10%,46%)" }} />
                <Tooltip />
                <Bar dataKey="value" fill="hsl(24,95%,53%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-muted-foreground text-center py-8">No project data yet</p>}
        </div>

        <div className="bg-card border border-border rounded-xl p-5 shadow-card">
          <h3 className="font-display font-semibold text-foreground mb-4">Tasks by Priority</h3>
          {data.taskPriorityData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={data.taskPriorityData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {data.taskPriorityData.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-muted-foreground text-center py-8">No task data yet</p>}
        </div>

        {data.industryData.length > 0 && (
          <div className="bg-card border border-border rounded-xl p-5 shadow-card lg:col-span-2">
            <h3 className="font-display font-semibold text-foreground mb-4">Prospects by Industry</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data.industryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,13%,91%)" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: "hsl(220,10%,46%)" }} />
                <YAxis tick={{ fontSize: 12, fill: "hsl(220,10%,46%)" }} />
                <Tooltip />
                <Bar dataKey="value" fill="hsl(16,100%,50%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};

export default Analytics;
