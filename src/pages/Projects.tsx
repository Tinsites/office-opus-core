import { motion } from "framer-motion";
import { Plus, Search, MoreHorizontal } from "lucide-react";

const projects = [
  { name: "Meridian Corp Website", client: "Meridian Corp", status: "In Progress", progress: 68, deadline: "Mar 15, 2026", team: ["JD", "AK", "MR"] },
  { name: "Bloom Studio Rebrand", client: "Bloom Studio", status: "Review", progress: 90, deadline: "Feb 28, 2026", team: ["AK", "LS"] },
  { name: "Atlas Finance App", client: "Atlas Finance", status: "In Progress", progress: 42, deadline: "Apr 10, 2026", team: ["JD", "MR", "LS"] },
  { name: "Pinnacle Health Portal", client: "Pinnacle Health", status: "Onboarding", progress: 15, deadline: "May 1, 2026", team: ["AK"] },
  { name: "Crestline Media CMS", client: "Crestline Media", status: "In Progress", progress: 55, deadline: "Mar 22, 2026", team: ["JD", "MR"] },
];

const statusStyles: Record<string, string> = {
  "In Progress": "bg-primary/10 text-primary",
  Review: "bg-accent text-accent-foreground",
  Onboarding: "bg-muted text-muted-foreground",
  Completed: "bg-secondary text-secondary-foreground",
};

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } };

const Projects = () => (
  <div className="p-8 max-w-7xl mx-auto">
    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Projects</h1>
        <p className="text-muted-foreground text-sm mt-1">Track and manage all projects</p>
      </div>
      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="h-10 px-5 gradient-orange rounded-lg text-primary-foreground text-sm font-semibold flex items-center gap-2 shadow-orange">
        <Plus size={16} /> New Project
      </motion.button>
    </motion.div>

    <div className="relative mb-6">
      <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
      <input className="w-full max-w-sm h-10 pl-10 pr-4 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40 text-sm" placeholder="Search projects..." />
    </div>

    <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {projects.map((project) => (
        <motion.div
          key={project.name}
          variants={item}
          className="bg-card border border-border rounded-xl p-5 shadow-card hover:shadow-card-hover transition-shadow cursor-pointer group"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{project.name}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{project.client}</p>
            </div>
            <button className="p-1 rounded-md hover:bg-muted transition-colors text-muted-foreground opacity-0 group-hover:opacity-100">
              <MoreHorizontal size={16} />
            </button>
          </div>

          <div className="flex items-center justify-between mb-3">
            <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${statusStyles[project.status]}`}>
              {project.status}
            </span>
            <span className="text-xs text-muted-foreground">Due {project.deadline}</span>
          </div>

          <div className="mb-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">Progress</span>
              <span className="text-xs font-medium text-foreground">{project.progress}%</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${project.progress}%` }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="h-full gradient-orange rounded-full"
              />
            </div>
          </div>

          <div className="flex items-center gap-1">
            {project.team.map((member) => (
              <div key={member} className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-xs font-medium text-secondary-foreground border-2 border-card -ml-1 first:ml-0">
                {member}
              </div>
            ))}
          </div>
        </motion.div>
      ))}
    </motion.div>
  </div>
);

export default Projects;
