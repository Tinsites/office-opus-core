import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, DollarSign, Send, CheckCircle, Clock, Download, Link2, MoreHorizontal } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface InvoiceItem { description: string; amount: number; }

interface Invoice {
  id: string;
  invoice_number: string;
  client_id: string | null;
  project_id: string | null;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: string;
  due_date: string | null;
  notes: string | null;
  public_token: string | null;
  created_at: string;
  clients?: { name: string } | null;
}

interface Client { id: string; name: string; }
interface Project { id: string; name: string; }

const statusConfig: Record<string, { icon: typeof DollarSign; style: string }> = {
  paid: { icon: CheckCircle, style: "bg-primary/10 text-primary" },
  sent: { icon: Send, style: "bg-accent text-accent-foreground" },
  draft: { icon: Clock, style: "bg-muted text-muted-foreground" },
  overdue: { icon: Clock, style: "bg-destructive/10 text-destructive" },
};

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } };
const item = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } };

const Invoices = () => {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ client_id: "", project_id: "", tax: "0", notes: "", due_date: "" });
  const [lineItems, setLineItems] = useState<InvoiceItem[]>([{ description: "", amount: 0 }]);

  const fetchAll = async () => {
    const [{ data: inv }, { data: cl }, { data: pr }] = await Promise.all([
      supabase.from("invoices").select("*, clients(name)").order("created_at", { ascending: false }),
      supabase.from("clients").select("id, name").order("name"),
      supabase.from("projects").select("id, name").order("name"),
    ]);
    if (inv) setInvoices(inv as any);
    if (cl) setClients(cl);
    if (pr) setProjects(pr);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const resetForm = () => {
    setForm({ client_id: "", project_id: "", tax: "0", notes: "", due_date: "" });
    setLineItems([{ description: "", amount: 0 }]);
    setShowForm(false);
  };

  const subtotal = lineItems.reduce((s, i) => s + (i.amount || 0), 0);
  const taxAmount = parseFloat(form.tax) || 0;
  const total = subtotal + taxAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lineItems.every(i => !i.description.trim())) return;

    const { error } = await supabase.from("invoices").insert({
      invoice_number: "",
      client_id: form.client_id || null,
      project_id: form.project_id || null,
      items: lineItems.filter(i => i.description.trim()) as any,
      subtotal,
      tax: taxAmount,
      total,
      due_date: form.due_date || null,
      notes: form.notes || null,
      created_by: user?.id,
    });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Invoice created" });
    resetForm();
    fetchAll();
  };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("invoices").update({ status: status as any }).eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: `Invoice marked as ${status}` });
    fetchAll();
  };

  const copyPublicLink = (token: string | null) => {
    if (!token) return;
    const url = `${window.location.origin}/invoice/${token}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Link copied to clipboard" });
  };

  const downloadPdf = (inv: Invoice) => {
    const w = window.open("", "_blank");
    if (!w) return;
    const itemsHtml = (inv.items as InvoiceItem[]).map(i => `<tr><td style="padding:8px;border-bottom:1px solid #eee">${i.description}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right">$${i.amount.toFixed(2)}</td></tr>`).join("");
    w.document.write(`<html><head><title>${inv.invoice_number}</title><style>body{font-family:sans-serif;padding:40px;max-width:800px;margin:auto}table{width:100%;border-collapse:collapse}</style></head><body>
      <h1>${inv.invoice_number}</h1><p>Client: ${inv.clients?.name || "N/A"}</p><p>Date: ${new Date(inv.created_at).toLocaleDateString()}</p>${inv.due_date ? `<p>Due: ${new Date(inv.due_date).toLocaleDateString()}</p>` : ""}
      <table><thead><tr><th style="text-align:left;padding:8px;border-bottom:2px solid #333">Description</th><th style="text-align:right;padding:8px;border-bottom:2px solid #333">Amount</th></tr></thead><tbody>${itemsHtml}</tbody></table>
      <div style="text-align:right;margin-top:20px"><p>Subtotal: $${inv.subtotal}</p><p>Tax: $${inv.tax}</p><p style="font-size:1.2em;font-weight:bold">Total: $${inv.total}</p></div>
      ${inv.notes ? `<p style="margin-top:20px;color:#666">Notes: ${inv.notes}</p>` : ""}
      <script>window.print()</script></body></html>`);
  };

  const totalRevenue = invoices.filter(i => i.status === "paid").reduce((s, i) => s + Number(i.total), 0);
  const outstanding = invoices.filter(i => i.status === "sent" || i.status === "draft").reduce((s, i) => s + Number(i.total), 0);
  const overdueTotal = invoices.filter(i => i.status === "overdue").reduce((s, i) => s + Number(i.total), 0);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto pt-16 md:pt-4">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-display font-bold text-foreground">Invoices</h1>
          <p className="text-muted-foreground text-sm mt-1">Generate and track payments</p>
        </div>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setShowForm(true)} className="h-10 px-5 gradient-orange rounded-lg text-primary-foreground text-sm font-semibold flex items-center gap-2 shadow-orange self-start sm:self-auto">
          <Plus size={16} /> New Invoice
        </motion.button>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
        {[
          { label: "Total Revenue", value: `$${totalRevenue.toLocaleString()}`, sub: "Paid invoices" },
          { label: "Outstanding", value: `$${outstanding.toLocaleString()}`, sub: `${invoices.filter(i => i.status !== "paid" && i.status !== "overdue").length} invoices` },
          { label: "Overdue", value: `$${overdueTotal.toLocaleString()}`, sub: `${invoices.filter(i => i.status === "overdue").length} invoices` },
        ].map((s) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-xl p-4 shadow-card">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="text-xl font-display font-bold text-foreground mt-1">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.sub}</p>
          </motion.div>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : invoices.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 shadow-card text-center">
          <p className="text-muted-foreground">No invoices yet. Create your first invoice to get started.</p>
        </div>
      ) : (
        <motion.div variants={container} initial="hidden" animate="show" className="bg-card border border-border rounded-xl shadow-card overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Invoice</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Client</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Amount</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Date</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {invoices.map((inv) => {
                const config = statusConfig[inv.status] || statusConfig.draft;
                return (
                  <motion.tr key={inv.id} variants={item} className="hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-4 text-sm font-medium text-foreground">{inv.invoice_number}</td>
                    <td className="px-5 py-4 text-sm text-foreground">{inv.clients?.name || "—"}</td>
                    <td className="px-5 py-4 text-sm font-semibold text-foreground">${Number(inv.total).toLocaleString()}</td>
                    <td className="px-5 py-4 text-sm text-muted-foreground">{new Date(inv.created_at).toLocaleDateString()}</td>
                    <td className="px-5 py-4">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${config.style}`}>{inv.status}</span>
                    </td>
                    <td className="px-5 py-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground"><MoreHorizontal size={16} /></button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {inv.status !== "paid" && <DropdownMenuItem onClick={() => updateStatus(inv.id, "paid")}><CheckCircle size={14} className="mr-2" /> Mark Paid</DropdownMenuItem>}
                          {inv.status === "draft" && <DropdownMenuItem onClick={() => updateStatus(inv.id, "sent")}><Send size={14} className="mr-2" /> Mark Sent</DropdownMenuItem>}
                          <DropdownMenuItem onClick={() => copyPublicLink(inv.public_token)}><Link2 size={14} className="mr-2" /> Copy Link</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => downloadPdf(inv)}><Download size={14} className="mr-2" /> Download PDF</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </motion.div>
      )}

      <Dialog open={showForm} onOpenChange={(open) => { if (!open) resetForm(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>New Invoice</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Client</label>
                <select value={form.client_id} onChange={(e) => setForm({ ...form, client_id: e.target.value })} className="w-full h-10 px-3 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring/40">
                  <option value="">Select client</option>
                  {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Project</label>
                <select value={form.project_id} onChange={(e) => setForm({ ...form, project_id: e.target.value })} className="w-full h-10 px-3 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring/40">
                  <option value="">None</option>
                  {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Line Items</label>
              {lineItems.map((li, i) => (
                <div key={i} className="flex gap-2 mb-2">
                  <input value={li.description} onChange={(e) => { const n = [...lineItems]; n[i].description = e.target.value; setLineItems(n); }} className="flex-1 h-10 px-3 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring/40" placeholder="Description" />
                  <input type="number" value={li.amount || ""} onChange={(e) => { const n = [...lineItems]; n[i].amount = parseFloat(e.target.value) || 0; setLineItems(n); }} className="w-28 h-10 px-3 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring/40" placeholder="Amount" />
                </div>
              ))}
              <button type="button" onClick={() => setLineItems([...lineItems, { description: "", amount: 0 }])} className="text-xs text-primary font-medium hover:underline">+ Add line item</button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Tax Amount</label>
                <input type="number" value={form.tax} onChange={(e) => setForm({ ...form, tax: e.target.value })} className="w-full h-10 px-3 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring/40" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Due Date</label>
                <input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} className="w-full h-10 px-3 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring/40" />
              </div>
            </div>

            <div className="text-right text-sm font-semibold text-foreground">Total: ${total.toFixed(2)}</div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Notes</label>
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full min-h-[60px] px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring/40" placeholder="Additional notes" />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={resetForm} className="h-10 px-4 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors">Cancel</button>
              <button type="submit" className="h-10 px-5 gradient-orange rounded-lg text-primary-foreground text-sm font-semibold shadow-orange">Create Invoice</button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Invoices;
