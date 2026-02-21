import { motion } from "framer-motion";
import { Plus, Search, DollarSign, Send, CheckCircle, Clock } from "lucide-react";

const invoices = [
  { id: "INV-001", client: "Meridian Corp", amount: "$4,500", date: "Feb 10, 2026", status: "Paid" },
  { id: "INV-002", client: "Bloom Studio", amount: "$2,800", date: "Feb 12, 2026", status: "Sent" },
  { id: "INV-003", client: "Atlas Finance", amount: "$6,200", date: "Feb 15, 2026", status: "Draft" },
  { id: "INV-004", client: "Crestline Media", amount: "$3,100", date: "Feb 18, 2026", status: "Overdue" },
  { id: "INV-005", client: "Meridian Corp", amount: "$1,900", date: "Jan 28, 2026", status: "Paid" },
];

const statusConfig: Record<string, { icon: typeof DollarSign; style: string }> = {
  Paid: { icon: CheckCircle, style: "bg-primary/10 text-primary" },
  Sent: { icon: Send, style: "bg-accent text-accent-foreground" },
  Draft: { icon: Clock, style: "bg-muted text-muted-foreground" },
  Overdue: { icon: Clock, style: "bg-destructive/10 text-destructive" },
};

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } };
const item = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } };

const Invoices = () => (
  <div className="p-8 max-w-5xl mx-auto">
    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Invoices</h1>
        <p className="text-muted-foreground text-sm mt-1">Generate and track payments</p>
      </div>
      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="h-10 px-5 gradient-orange rounded-lg text-primary-foreground text-sm font-semibold flex items-center gap-2 shadow-orange">
        <Plus size={16} /> New Invoice
      </motion.button>
    </motion.div>

    <div className="grid grid-cols-3 gap-4 mb-6">
      {[
        { label: "Total Revenue", value: "$18,500", sub: "This month" },
        { label: "Outstanding", value: "$9,300", sub: "3 invoices" },
        { label: "Overdue", value: "$3,100", sub: "1 invoice" },
      ].map((s) => (
        <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-xl p-4 shadow-card">
          <p className="text-xs text-muted-foreground">{s.label}</p>
          <p className="text-xl font-display font-bold text-foreground mt-1">{s.value}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{s.sub}</p>
        </motion.div>
      ))}
    </div>

    <motion.div variants={container} initial="hidden" animate="show" className="bg-card border border-border rounded-xl shadow-card overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border bg-muted/30">
            <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Invoice</th>
            <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Client</th>
            <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Amount</th>
            <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Date</th>
            <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {invoices.map((inv) => {
            const config = statusConfig[inv.status];
            return (
              <motion.tr key={inv.id} variants={item} className="hover:bg-muted/30 transition-colors cursor-pointer">
                <td className="px-5 py-4 text-sm font-medium text-foreground">{inv.id}</td>
                <td className="px-5 py-4 text-sm text-foreground">{inv.client}</td>
                <td className="px-5 py-4 text-sm font-semibold text-foreground">{inv.amount}</td>
                <td className="px-5 py-4 text-sm text-muted-foreground">{inv.date}</td>
                <td className="px-5 py-4">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${config.style}`}>{inv.status}</span>
                </td>
              </motion.tr>
            );
          })}
        </tbody>
      </table>
    </motion.div>
  </div>
);

export default Invoices;
