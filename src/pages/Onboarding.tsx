import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, Copy, ExternalLink, GripVertical } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

interface FormField {
  id: string;
  label: string;
  type: "text" | "email" | "phone" | "textarea" | "select" | "file";
  required: boolean;
  placeholder?: string;
  options?: string[];
}

interface OnboardingForm {
  id: string;
  title: string;
  description: string | null;
  fields: FormField[];
  is_active: boolean;
  created_at: string;
  client_id: string | null;
}

const fieldTypes = [
  { value: "text", label: "Text" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "textarea", label: "Long Text" },
  { value: "select", label: "Dropdown" },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0 },
};

const Onboarding = () => {
  const { user } = useAuth();
  const [forms, setForms] = useState<OnboardingForm[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [fields, setFields] = useState<FormField[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchForms();
  }, []);

  const fetchForms = async () => {
    const { data, error } = await supabase
      .from("onboarding_forms")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setForms(data as unknown as OnboardingForm[]);
    setLoading(false);
  };

  const addField = () => {
    setFields([
      ...fields,
      {
        id: crypto.randomUUID(),
        label: "",
        type: "text",
        required: false,
        placeholder: "",
      },
    ]);
  };

  const updateField = (id: string, updates: Partial<FormField>) => {
    setFields(fields.map((f) => (f.id === id ? { ...f, ...updates } : f)));
  };

  const removeField = (id: string) => {
    setFields(fields.filter((f) => f.id !== id));
  };

  const saveForm = async () => {
    if (!formTitle.trim()) {
      toast({ title: "Error", description: "Form title is required", variant: "destructive" });
      return;
    }
    if (fields.length === 0) {
      toast({ title: "Error", description: "Add at least one field", variant: "destructive" });
      return;
    }
    const invalidFields = fields.filter((f) => !f.label.trim());
    if (invalidFields.length > 0) {
      toast({ title: "Error", description: "All fields must have labels", variant: "destructive" });
      return;
    }

    const { error } = await supabase.from("onboarding_forms").insert([{
      title: formTitle.trim(),
      description: formDescription.trim() || null,
      fields: JSON.parse(JSON.stringify(fields)),
      created_by: user?.id,
    }]);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Success", description: "Onboarding form created!" });
    setIsCreating(false);
    setFormTitle("");
    setFormDescription("");
    setFields([]);
    fetchForms();
  };

  const copyLink = (formId: string) => {
    const url = `${window.location.origin}/submit/${formId}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Copied!", description: "Form link copied to clipboard" });
  };

  const toggleActive = async (formId: string, isActive: boolean) => {
    await supabase.from("onboarding_forms").update({ is_active: !isActive }).eq("id", formId);
    fetchForms();
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Client Onboarding</h1>
          <p className="text-muted-foreground text-sm mt-1">Create dynamic forms for clients to submit their data</p>
        </div>
        {!isCreating && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsCreating(true)}
            className="h-10 px-5 gradient-orange rounded-lg text-primary-foreground text-sm font-semibold flex items-center gap-2 shadow-orange"
          >
            <Plus size={16} /> New Form
          </motion.button>
        )}
      </motion.div>

      {isCreating && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-xl p-6 shadow-card mb-6"
        >
          <h2 className="font-display font-semibold text-foreground mb-4">Create Onboarding Form</h2>
          
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Form Title</label>
              <input
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                className="w-full h-10 px-4 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40 text-sm"
                placeholder="e.g. New Client Information"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Description (optional)</label>
              <textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                className="w-full min-h-[80px] px-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40 text-sm"
                placeholder="Briefly describe what this form is for..."
              />
            </div>
          </div>

          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-foreground">Form Fields</h3>
              <button
                onClick={addField}
                className="text-xs text-primary font-medium flex items-center gap-1 hover:underline"
              >
                <Plus size={14} /> Add Field
              </button>
            </div>

            {fields.length === 0 && (
              <div className="text-center py-8 border border-dashed border-border rounded-lg">
                <p className="text-sm text-muted-foreground">No fields yet. Click "Add Field" to start building your form.</p>
              </div>
            )}

            <div className="space-y-3">
              {fields.map((field, index) => (
                <motion.div
                  key={field.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-start gap-3 p-3 border border-border rounded-lg bg-muted/20"
                >
                  <div className="text-muted-foreground pt-2">
                    <GripVertical size={14} />
                  </div>
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input
                      value={field.label}
                      onChange={(e) => updateField(field.id, { label: e.target.value })}
                      className="h-9 px-3 rounded-md border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
                      placeholder="Field label"
                    />
                    <select
                      value={field.type}
                      onChange={(e) => updateField(field.id, { type: e.target.value as FormField["type"] })}
                      className="h-9 px-3 rounded-md border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
                    >
                      {fieldTypes.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
                        <input
                          type="checkbox"
                          checked={field.required}
                          onChange={(e) => updateField(field.id, { required: e.target.checked })}
                          className="rounded border-border"
                        />
                        Required
                      </label>
                      <button onClick={() => removeField(field.id)} className="p-1 text-destructive hover:bg-destructive/10 rounded">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 pt-4 border-t border-border">
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={saveForm}
              className="h-10 px-6 gradient-orange rounded-lg text-primary-foreground text-sm font-semibold shadow-orange"
            >
              Create Form
            </motion.button>
            <button
              onClick={() => { setIsCreating(false); setFields([]); setFormTitle(""); setFormDescription(""); }}
              className="h-10 px-4 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              Cancel
            </button>
          </div>
        </motion.div>
      )}

      {/* Existing forms list */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : forms.length === 0 && !isCreating ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-card border border-border rounded-xl p-12 shadow-card text-center"
        >
          <p className="text-muted-foreground text-sm mb-4">No onboarding forms yet</p>
          <button
            onClick={() => setIsCreating(true)}
            className="text-primary text-sm font-medium hover:underline"
          >
            Create your first form →
          </button>
        </motion.div>
      ) : (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-3">
          {forms.map((form) => (
            <motion.div
              key={form.id}
              variants={item}
              className="bg-card border border-border rounded-xl p-5 shadow-card hover:shadow-card-hover transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-display font-semibold text-foreground">{form.title}</h3>
                  {form.description && <p className="text-xs text-muted-foreground mt-1">{form.description}</p>}
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-muted-foreground">{(form.fields as FormField[]).length} fields</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${form.is_active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                      {form.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => copyLink(form.id)}
                    className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    title="Copy form link"
                  >
                    <Copy size={16} />
                  </button>
                  <a
                    href={`/submit/${form.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    title="Preview form"
                  >
                    <ExternalLink size={16} />
                  </a>
                  <button
                    onClick={() => toggleActive(form.id, form.is_active)}
                    className="text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors text-foreground"
                  >
                    {form.is_active ? "Deactivate" : "Activate"}
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
};

export default Onboarding;
