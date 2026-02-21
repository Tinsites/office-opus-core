import { motion } from "framer-motion";
import { Plus, Search, Filter, MoreHorizontal, Mail, Phone } from "lucide-react";

const clients = [
  { name: "Meridian Corp", email: "contact@meridiancorp.com", phone: "+1 (555) 123-4567", projects: 3, status: "Active" },
  { name: "Bloom Studio", email: "hello@bloomstudio.co", phone: "+1 (555) 234-5678", projects: 2, status: "Active" },
  { name: "Atlas Finance", email: "info@atlasfinance.com", phone: "+1 (555) 345-6789", projects: 1, status: "Active" },
  { name: "Pinnacle Health", email: "admin@pinnaclehealth.org", phone: "+1 (555) 456-7890", projects: 1, status: "Onboarding" },
  { name: "Vertex Labs", email: "team@vertexlabs.io", phone: "+1 (555) 567-8901", projects: 0, status: "Lead" },
  { name: "Crestline Media", email: "info@crestlinemedia.com", phone: "+1 (555) 678-9012", projects: 2, status: "Active" },
];

const statusStyles: Record<string, string> = {
  Active: "bg-primary/10 text-primary",
  Onboarding: "bg-accent text-accent-foreground",
  Lead: "bg-muted text-muted-foreground",
};

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } },
};
const item = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0 },
};

const Clients = () => {
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Clients</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your client relationships</p>
        </div>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="h-10 px-5 gradient-orange rounded-lg text-primary-foreground text-sm font-semibold flex items-center gap-2 shadow-orange">
          <Plus size={16} /> Add Client
        </motion.button>
      </motion.div>

      {/* Search bar */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input className="w-full h-10 pl-10 pr-4 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40 text-sm" placeholder="Search clients..." />
        </div>
        <button className="h-10 px-4 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors flex items-center gap-2">
          <Filter size={14} /> Filter
        </button>
      </div>

      {/* Table */}
      <motion.div variants={container} initial="hidden" animate="show" className="bg-card border border-border rounded-xl shadow-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Client</th>
              <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Contact</th>
              <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Projects</th>
              <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Status</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {clients.map((client) => (
              <motion.tr key={client.name} variants={item} className="hover:bg-muted/30 transition-colors cursor-pointer">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full gradient-orange flex items-center justify-center text-primary-foreground font-display font-bold text-sm">
                      {client.name.charAt(0)}
                    </div>
                    <span className="text-sm font-medium text-foreground">{client.name}</span>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Mail size={12} /> {client.email}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Phone size={12} /> {client.phone}
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4 text-sm text-foreground">{client.projects}</td>
                <td className="px-5 py-4">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusStyles[client.status]}`}>
                    {client.status}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <button className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground">
                    <MoreHorizontal size={16} />
                  </button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </motion.div>
    </div>
  );
};

export default Clients;
