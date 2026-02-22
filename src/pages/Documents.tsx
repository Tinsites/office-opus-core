import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Search, FileText, Pencil, Trash2, Save, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Doc {
  id: string;
  title: string;
  content: string;
  category: string;
  project_id: string | null;
  created_at: string;
  updated_at: string;
  projects?: { name: string } | null;
}

interface Project { id: string; name: string; }

const categories = ["general", "meeting-notes", "strategy", "research", "internal"];

const Documents = () => {
  const { user } = useAuth();
  const [docs, setDocs] = useState<Doc[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Doc | null>(null);
  const [form, setForm] = useState({ title: "", content: "", category: "general", project_id: "" });
  const [showReminder, setShowReminder] = useState(false);

  const fetchAll = async () => {
    const [{ data: d }, { data: p }] = await Promise.all([
      supabase.from("documents").select("*, projects(name)").order("updated_at", { ascending: false }),
      supabase.from("projects").select("id, name").order("name"),
    ]);
    if (d) setDocs(d as any);
    if (p) setProjects(p);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const resetForm = () => { setForm({ title: "", content: "", category: "general", project_id: "" }); setEditing(null); setShowForm(false); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    const payload = { title: form.title, content: form.content, category: form.category, project_id: form.project_id || null };

    if (editing) {
      const { error } = await supabase.from("documents").update(payload).eq("id", editing.id);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Document saved" });
      setShowReminder(true);
    } else {
      const { error } = await supabase.from("documents").insert({ ...payload, created_by: user?.id });
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Document created" });
      setShowReminder(true);
    }
    resetForm();
    fetchAll();
  };

  const handleEdit = (doc: Doc) => {
    setEditing(doc);
    setForm({ title: doc.title, content: doc.content || "", category: doc.category, project_id: doc.project_id || "" });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("documents").delete().eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Document deleted" });
    fetchAll();
  };

  const filtered = docs.filter((d) => {
    const matchSearch = d.title.toLowerCase().includes(search.toLowerCase()) || d.content.toLowerCase().includes(search.toLowerCase());
    const matchCat = !filterCat || d.category === filterCat;
    return matchSearch && matchCat;
  });

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Documents</h1>
          <p className="text-muted-foreground text-sm mt-1">Notes, strategies, and documentation</p>
        </div>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => { resetForm(); setShowForm(true); }} className="h-10 px-5 gradient-orange rounded-lg text-primary-foreground text-sm font-semibold flex items-center gap-2 shadow-orange">
          <Plus size={16} /> New Document
        </motion.button>
      </motion.div>

      {showReminder && (
        <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="mb-4 p-3 bg-accent border border-border rounded-lg flex items-center gap-3">
          <Info size={16} className="text-accent-foreground shrink-0" />
          <p className="text-sm text-accent-foreground">Consider exporting this to a Word document and uploading to Google Drive.</p>
          <button onClick={() => setShowReminder(false)} className="ml-auto text-xs text-muted-foreground hover:text-foreground">Dismiss</button>
        </motion.div>
      )}

      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} className="w-full h-10 pl-10 pr-4 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40 text-sm" placeholder="Search documents..." />
        </div>
        <select value={filterCat || ""} onChange={(e) => setFilterCat(e.target.value || null)} className="h-10 px-3 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring/40">
          <option value="">All categories</option>
          {categories.map((c) => <option key={c} value={c}>{c.replace("-", " ").replace(/\b\w/g, l => l.toUpperCase())}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 shadow-card text-center">
          <p className="text-muted-foreground">No documents yet. Create your first document to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((doc) => (
            <motion.div key={doc.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-xl p-5 shadow-card hover:shadow-card-hover transition-shadow group">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <FileText size={16} className="text-primary" />
                  <h3 className="text-sm font-semibold text-foreground">{doc.title}</h3>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleEdit(doc)} className="p-1 rounded hover:bg-muted"><Pencil size={14} className="text-muted-foreground" /></button>
                  <button onClick={() => handleDelete(doc.id)} className="p-1 rounded hover:bg-muted"><Trash2 size={14} className="text-destructive" /></button>
                </div>
              </div>
              <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{doc.category.replace("-", " ")}</span>
              {doc.projects?.name && <span className="ml-2 text-xs text-muted-foreground">• {doc.projects.name}</span>}
              {doc.content && <p className="text-xs text-muted-foreground mt-3 line-clamp-3">{doc.content}</p>}
              <p className="text-[10px] text-muted-foreground mt-3">Updated {new Date(doc.updated_at).toLocaleDateString()}</p>
            </motion.div>
          ))}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={(open) => { if (!open) resetForm(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Edit Document" : "New Document"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Title *</label>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full h-10 px-3 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring/40" placeholder="Document title" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Category</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full h-10 px-3 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring/40">
                  {categories.map((c) => <option key={c} value={c}>{c.replace("-", " ").replace(/\b\w/g, l => l.toUpperCase())}</option>)}
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
              <label className="block text-sm font-medium text-foreground mb-1">Content</label>
              <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} className="w-full min-h-[200px] px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring/40" placeholder="Write your notes here..." />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={resetForm} className="h-10 px-4 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors">Cancel</button>
              <button type="submit" className="h-10 px-5 gradient-orange rounded-lg text-primary-foreground text-sm font-semibold shadow-orange flex items-center gap-2"><Save size={14} /> {editing ? "Save" : "Create"}</button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Documents;
