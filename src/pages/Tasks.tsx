import { motion } from "framer-motion";
import { CheckSquare, Circle, Clock, Plus, Filter } from "lucide-react";

const tasks = [
  { title: "Finalize homepage mockup", project: "Meridian Corp Website", assignee: "JD", due: "Today", priority: "high", done: false },
  { title: "Setup payment gateway", project: "Atlas Finance App", assignee: "MR", due: "Tomorrow", priority: "medium", done: false },
  { title: "Client feedback review", project: "Bloom Studio Rebrand", assignee: "AK", due: "Today", priority: "high", done: false },
  { title: "Send onboarding form", project: "Pinnacle Health Portal", assignee: "AK", due: "Wed", priority: "low", done: false },
  { title: "Deploy staging build", project: "Meridian Corp Website", assignee: "JD", due: "Thu", priority: "medium", done: false },
  { title: "Design system documentation", project: "Bloom Studio Rebrand", assignee: "LS", due: "Fri", priority: "low", done: true },
  { title: "API integration testing", project: "Atlas Finance App", assignee: "MR", due: "Mon", priority: "high", done: false },
  { title: "Content migration", project: "Crestline Media CMS", assignee: "JD", due: "Next week", priority: "medium", done: false },
];

const priorityStyles: Record<string, string> = {
  high: "bg-destructive/10 text-destructive",
  medium: "bg-primary/10 text-primary",
  low: "bg-muted text-muted-foreground",
};

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } };
const item = { hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0 } };

const Tasks = () => (
  <div className="p-8 max-w-5xl mx-auto">
    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Tasks</h1>
        <p className="text-muted-foreground text-sm mt-1">{tasks.filter(t => !t.done).length} tasks remaining</p>
      </div>
      <div className="flex items-center gap-3">
        <button className="h-10 px-4 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors flex items-center gap-2">
          <Filter size={14} /> Filter
        </button>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="h-10 px-5 gradient-orange rounded-lg text-primary-foreground text-sm font-semibold flex items-center gap-2 shadow-orange">
          <Plus size={16} /> Add Task
        </motion.button>
      </div>
    </motion.div>

    <motion.div variants={container} initial="hidden" animate="show" className="bg-card border border-border rounded-xl shadow-card divide-y divide-border">
      {tasks.map((task, i) => (
        <motion.div
          key={i}
          variants={item}
          className={`flex items-center gap-4 px-5 py-4 hover:bg-muted/30 transition-colors cursor-pointer ${task.done ? "opacity-50" : ""}`}
        >
          <button className="text-muted-foreground hover:text-primary transition-colors">
            {task.done ? <CheckSquare size={18} className="text-primary" /> : <Circle size={18} />}
          </button>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium ${task.done ? "line-through text-muted-foreground" : "text-foreground"}`}>{task.title}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{task.project}</p>
          </div>
          <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-xs font-medium text-secondary-foreground">
            {task.assignee}
          </div>
          <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${priorityStyles[task.priority]}`}>
            {task.priority}
          </span>
          <div className="flex items-center gap-1 text-xs text-muted-foreground min-w-[70px]">
            <Clock size={12} /> {task.due}
          </div>
        </motion.div>
      ))}
    </motion.div>
  </div>
);

export default Tasks;
