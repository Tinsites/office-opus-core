import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Search, MoreHorizontal, Pencil, Trash2, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface Prospect {
  id: string;
  company_name: string;
  industry: string | null;
  contact_name: string | null;
  contact_email: string | null;
  outreach_method: string;
  date_contacted: string | null;
  response_received: boolean;
  follow_up_status: string;
  notes: string | null;
}

const followUpStyles: Record<string, string> = {
  pending: "bg-muted text-muted-foreground",
  followed_up: "bg-primary/10 text-primary",
  converted: "bg-primary/10 text-primary",
  lost: "bg-destructive/10 text-destructive",
};

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } };
const item = { hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0 } };

const Prospecting = () => {
  const { user } = useAuth();
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Prospect | null>(null);
  const [form, setForm] = useState({ company_name: "", industry: "", contact_name: "", contact_email: "", outreach_method: "email", date_contacted: "", response_received: false, follow_up_status: "pending", notes: "" });

  const fetchAll = async () => {
    const { data } = await supabase.from("prospects").select("*").order("created_at", { ascending: false });
    if (data) setProspects(data as any);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const resetForm = () => { setForm({ company_name: "", industry: "", contact_name: "", contact_email: "", outreach_method: "email", date_contacted: "", response_received: false, follow_up_status: "pending", notes: "" }); setEditing(null); setShowForm(false); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.company_name.trim()) return;
    const payload = {
      company_name: form.company_name, industry: form.industry || null,
      contact_name: form.contact_name || null, contact_email: form.contact_email || null,
      outreach_method: form.outreach_method as any,
      date_contacted: form.date_contacted || null, response_received: form.response_received,
      follow_up_status: form.follow_up_status as any, notes: form.notes || null,
    };
    if (editing) {
      const { error } = await supabase.from("prospects").update(payload).eq("id", editing.id);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Prospect updated" });
    } else {
      const { error } = await supabase.from("prospects").insert({ ...payload, created_by: user?.id });
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Prospect added" });
    }
    resetForm();
    fetchAll();
  };

  const handleEdit = (p: Prospect) => {
    setEditing(p);
    setForm({
      company_name: p.company_name, industry: p.industry || "", contact_name: p.contact_name || "",
      contact_email: p.contact_email || "", outreach_method: p.outreach_method,
      date_contacted: p.date_contacted || "", response_received: p.response_received,
      follow_up_status: p.follow_up_status, notes: p.notes || "",
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    await supabase.from("prospects").delete().eq("id", id);
    toast({ title: "Prospect deleted" });
    fetchAll();
  };

  const filtered = prospects.filter(p => p.company_name.toLowerCase().includes(search.toLowerCase()) || (p.industry || "").toLowerCase().includes(search.toLowerCase()));
  const totalOutreach = prospects.length;
  const responseRate = totalOutreach > 0 ? Math.round((prospects.filter(p => p.response_received).length / totalOutreach) * 100) : 0;
  const converted = prospects.filter(p => p.follow_up_status === "converted").length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto pt-16 md:pt-4">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Prospecting</h1>
          <p className="text-muted-foreground text-sm mt-1">Track outreach and conversions</p>
        </div>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => { resetForm(); setShowForm(true); }} className="h-10 px-5 gradient-orange rounded-lg text-primary-foreground text-sm font-semibold flex items-center gap-2 shadow-orange">
          <Plus size={16} /> Add Prospect
        </motion.button>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
        {[
          { label: "Total Outreach", value: totalOutreach },
          { label: "Response Rate", value: `${responseRate}%` },
          { label: "Converted", value: converted },
        ].map((s) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-xl p-4 shadow-card">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="text-xl font-display font-bold text-foreground mt-1">{s.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="relative mb-6">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} className="w-full max-w-sm h-10 pl-10 pr-4 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40 text-sm" placeholder="Search prospects..." />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 shadow-card text-center"><p className="text-muted-foreground">No prospects yet.</p></div>
      ) : (
        <motion.div variants={container} initial="hidden" animate="show" className="bg-card border border-border rounded-xl shadow-card overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Company</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Industry</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Method</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Response</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((p) => (
                <motion.tr key={p.id} variants={item} className="hover:bg-muted/30 transition-colors">
                  <td className="px-5 py-4">
                    <p className="text-sm font-medium text-foreground">{p.company_name}</p>
                    {p.contact_name && <p className="text-xs text-muted-foreground">{p.contact_name}</p>}
                  </td>
                  <td className="px-5 py-4 text-sm text-muted-foreground">{p.industry || "—"}</td>
                  <td className="px-5 py-4 text-sm text-foreground capitalize">{p.outreach_method}</td>
                  <td className="px-5 py-4">{p.response_received ? <Check size={16} className="text-primary" /> : <X size={16} className="text-muted-foreground" />}</td>
                  <td className="px-5 py-4"><span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${followUpStyles[p.follow_up_status]}`}>{p.follow_up_status.replace("_", " ")}</span></td>
                  <td className="px-5 py-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><button className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground"><MoreHorizontal size={16} /></button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(p)}><Pencil size={14} className="mr-2" /> Edit</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(p.id)} className="text-destructive"><Trash2 size={14} className="mr-2" /> Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      )}

      <Dialog open={showForm} onOpenChange={(open) => { if (!open) resetForm(); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Prospect" : "Add Prospect"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-sm font-medium text-foreground mb-1">Company *</label><input value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} className="w-full h-10 px-3 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring/40" required /></div>
              <div><label className="block text-sm font-medium text-foreground mb-1">Industry</label><input value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} className="w-full h-10 px-3 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring/40" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-sm font-medium text-foreground mb-1">Contact Name</label><input value={form.contact_name} onChange={(e) => setForm({ ...form, contact_name: e.target.value })} className="w-full h-10 px-3 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring/40" /></div>
              <div><label className="block text-sm font-medium text-foreground mb-1">Contact Email</label><input type="email" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} className="w-full h-10 px-3 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring/40" /></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><label className="block text-sm font-medium text-foreground mb-1">Method</label><select value={form.outreach_method} onChange={(e) => setForm({ ...form, outreach_method: e.target.value })} className="w-full h-10 px-3 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"><option value="email">Email</option><option value="whatsapp">WhatsApp</option><option value="phone">Phone</option><option value="linkedin">LinkedIn</option><option value="other">Other</option></select></div>
              <div><label className="block text-sm font-medium text-foreground mb-1">Date Contacted</label><input type="date" value={form.date_contacted} onChange={(e) => setForm({ ...form, date_contacted: e.target.value })} className="w-full h-10 px-3 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring/40" /></div>
              <div><label className="block text-sm font-medium text-foreground mb-1">Follow-up</label><select value={form.follow_up_status} onChange={(e) => setForm({ ...form, follow_up_status: e.target.value })} className="w-full h-10 px-3 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"><option value="pending">Pending</option><option value="followed_up">Followed Up</option><option value="converted">Converted</option><option value="lost">Lost</option></select></div>
            </div>
            <label className="flex items-center gap-2 text-sm text-foreground"><input type="checkbox" checked={form.response_received} onChange={(e) => setForm({ ...form, response_received: e.target.checked })} className="rounded border-border" /> Response Received</label>
            <div><label className="block text-sm font-medium text-foreground mb-1">Notes</label><textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full min-h-[60px] px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring/40" /></div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={resetForm} className="h-10 px-4 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors">Cancel</button>
              <button type="submit" className="h-10 px-5 gradient-orange rounded-lg text-primary-foreground text-sm font-semibold shadow-orange">{editing ? "Update" : "Add"}</button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Prospecting;
