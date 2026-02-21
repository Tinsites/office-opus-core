import { motion } from "framer-motion";
import { Construction } from "lucide-react";

interface PlaceholderPageProps {
  title: string;
  description: string;
}

const PlaceholderPage = ({ title, description }: PlaceholderPageProps) => (
  <div className="p-8 max-w-5xl mx-auto">
    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
      <h1 className="text-2xl font-display font-bold text-foreground">{title}</h1>
      <p className="text-muted-foreground text-sm mt-1">{description}</p>
    </motion.div>
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-card border border-border rounded-xl p-12 shadow-card flex flex-col items-center justify-center text-center"
    >
      <div className="w-14 h-14 rounded-xl bg-accent flex items-center justify-center mb-4">
        <Construction size={28} className="text-accent-foreground" />
      </div>
      <h2 className="text-lg font-display font-semibold text-foreground mb-2">Coming Soon</h2>
      <p className="text-sm text-muted-foreground max-w-sm">
        This feature is under development. Enable Lovable Cloud to add backend functionality.
      </p>
    </motion.div>
  </div>
);

export const Documents = () => <PlaceholderPage title="Documents" description="Manage and share files" />;
export const Messages = () => <PlaceholderPage title="Messages" description="Internal team messaging" />;
export const CalendarPage = () => <PlaceholderPage title="Calendar" description="Schedule client follow-ups" />;
export const Analytics = () => <PlaceholderPage title="Analytics" description="Activity logs and insights" />;
export const SettingsPage = () => <PlaceholderPage title="Settings" description="Manage your workspace" />;
