import { motion } from "framer-motion";
import {
  Users,
  FolderKanban,
  CheckSquare,
  DollarSign,
  TrendingUp,
  Clock,
  ArrowUpRight,
  Plus,
} from "lucide-react";

const stats = [
  { label: "Active Clients", value: "24", change: "+3 this month", icon: Users, trend: "up" },
  { label: "Projects", value: "12", change: "4 in progress", icon: FolderKanban, trend: "up" },
  { label: "Open Tasks", value: "38", change: "6 due today", icon: CheckSquare, trend: "neutral" },
  { label: "Revenue", value: "$18.4k", change: "+12% vs last month", icon: DollarSign, trend: "up" },
];

const recentProjects = [
  { name: "Meridian Corp Website", client: "Meridian Corp", status: "In Progress", progress: 68 },
  { name: "Bloom Studio Rebrand", client: "Bloom Studio", status: "Review", progress: 90 },
  { name: "Atlas Finance App", client: "Atlas Finance", status: "In Progress", progress: 42 },
  { name: "Pinnacle Health Portal", client: "Pinnacle Health", status: "Onboarding", progress: 15 },
];

const recentTasks = [
  { title: "Finalize homepage mockup", project: "Meridian Corp Website", due: "Today", priority: "high" },
  { title: "Setup payment gateway", project: "Atlas Finance App", due: "Tomorrow", priority: "medium" },
  { title: "Client feedback review", project: "Bloom Studio Rebrand", due: "Today", priority: "high" },
  { title: "Send onboarding form", project: "Pinnacle Health Portal", due: "Wed", priority: "low" },
  { title: "Deploy staging build", project: "Meridian Corp Website", due: "Thu", priority: "medium" },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

const priorityStyles: Record<string, string> = {
  high: "bg-destructive/10 text-destructive",
  medium: "bg-primary/10 text-primary",
  low: "bg-muted text-muted-foreground",
};

const statusStyles: Record<string, string> = {
  "In Progress": "bg-primary/10 text-primary",
  Review: "bg-accent text-accent-foreground",
  Onboarding: "bg-muted text-muted-foreground",
};

const Dashboard = () => {
  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-8"
      >
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Welcome back — here's your overview.</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="h-10 px-5 gradient-orange rounded-lg text-primary-foreground text-sm font-semibold flex items-center gap-2 shadow-orange"
        >
          <Plus size={16} />
          New Project
        </motion.button>
      </motion.div>

      {/* Stats */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
      >
        {stats.map((stat) => (
          <motion.div
            key={stat.label}
            variants={item}
            className="bg-card border border-border rounded-xl p-5 shadow-card hover:shadow-card-hover transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
                <stat.icon size={20} className="text-accent-foreground" />
              </div>
              {stat.trend === "up" && (
                <TrendingUp size={16} className="text-primary" />
              )}
            </div>
            <p className="text-2xl font-display font-bold text-foreground">{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Projects */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="lg:col-span-3 bg-card border border-border rounded-xl shadow-card"
        >
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h2 className="font-display font-semibold text-foreground">Active Projects</h2>
            <button className="text-xs text-primary font-medium flex items-center gap-1 hover:underline">
              View all <ArrowUpRight size={12} />
            </button>
          </div>
          <div className="divide-y divide-border">
            {recentProjects.map((project) => (
              <motion.div
                key={project.name}
                variants={item}
                className="px-5 py-4 flex items-center gap-4 hover:bg-muted/40 transition-colors cursor-pointer"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{project.name}</p>
                  <p className="text-xs text-muted-foreground">{project.client}</p>
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusStyles[project.status] || ""}`}>
                  {project.status}
                </span>
                <div className="w-24">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">{project.progress}%</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${project.progress}%` }}
                      transition={{ duration: 0.8, delay: 0.3 }}
                      className="h-full gradient-orange rounded-full"
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Tasks */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="lg:col-span-2 bg-card border border-border rounded-xl shadow-card"
        >
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h2 className="font-display font-semibold text-foreground">Upcoming Tasks</h2>
            <button className="text-xs text-primary font-medium flex items-center gap-1 hover:underline">
              View all <ArrowUpRight size={12} />
            </button>
          </div>
          <div className="divide-y divide-border">
            {recentTasks.map((task) => (
              <motion.div
                key={task.title}
                variants={item}
                className="px-5 py-3.5 hover:bg-muted/40 transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{task.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{task.project}</p>
                  </div>
                  <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full whitespace-nowrap ${priorityStyles[task.priority]}`}>
                    {task.priority}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
                  <Clock size={12} />
                  <span>{task.due}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
