import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface FormField {
  id: string;
  label: string;
  type: "text" | "email" | "phone" | "textarea" | "select";
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
}

const SubmitForm = () => {
  const { formId } = useParams<{ formId: string }>();
  const [form, setForm] = useState<OnboardingForm | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [submitterName, setSubmitterName] = useState("");
  const [submitterEmail, setSubmitterEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchForm = async () => {
      if (!formId) return;
      const { data, error } = await supabase
        .from("onboarding_forms")
        .select("*")
        .eq("id", formId)
        .eq("is_active", true)
        .maybeSingle();

      if (error || !data) {
        setError("This form is no longer available.");
      } else {
        setForm(data as unknown as OnboardingForm);
      }
      setLoading(false);
    };
    fetchForm();
  }, [formId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;

    // Validate required fields
    for (const field of form.fields) {
      if (field.required && !formData[field.id]?.trim()) {
        setError(`"${field.label}" is required`);
        return;
      }
    }

    if (!submitterName.trim() || !submitterEmail.trim()) {
      setError("Your name and email are required");
      return;
    }

    setSubmitting(true);
    setError(null);

    const { error: submitError } = await supabase.from("form_submissions").insert({
      form_id: form.id,
      data: formData,
      submitted_by_name: submitterName.trim(),
      submitted_by_email: submitterEmail.trim(),
    });

    if (submitError) {
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
      return;
    }

    setSubmitted(true);
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-card border border-border rounded-xl p-8 shadow-card text-center"
        >
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={28} className="text-primary" />
          </div>
          <h1 className="text-xl font-display font-bold text-foreground mb-2">Submitted Successfully!</h1>
          <p className="text-sm text-muted-foreground">
            Thank you for completing the form. Our team will review your submission and be in touch shortly.
          </p>
        </motion.div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full bg-card border border-border rounded-xl p-8 shadow-card text-center">
          <AlertCircle size={28} className="text-destructive mx-auto mb-4" />
          <h1 className="text-xl font-display font-bold text-foreground mb-2">Form Not Found</h1>
          <p className="text-sm text-muted-foreground">{error || "This form doesn't exist or is no longer active."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-xl mx-auto"
      >
        {/* Branding */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-9 h-9 rounded-lg gradient-orange flex items-center justify-center">
            <span className="text-primary-foreground font-display font-bold text-sm">T</span>
          </div>
          <span className="font-display text-lg font-bold text-foreground">TinSites OS</span>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 shadow-card">
          <h1 className="text-xl font-display font-bold text-foreground mb-1">{form.title}</h1>
          {form.description && (
            <p className="text-sm text-muted-foreground mb-6">{form.description}</p>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Contact info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-5 border-b border-border">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Your Name *</label>
                <input
                  value={submitterName}
                  onChange={(e) => setSubmitterName(e.target.value)}
                  className="w-full h-10 px-4 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40 text-sm"
                  placeholder="John Doe"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Your Email *</label>
                <input
                  type="email"
                  value={submitterEmail}
                  onChange={(e) => setSubmitterEmail(e.target.value)}
                  className="w-full h-10 px-4 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40 text-sm"
                  placeholder="you@company.com"
                  required
                />
              </div>
            </div>

            {/* Dynamic fields */}
            {form.fields.map((field) => (
              <div key={field.id}>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  {field.label} {field.required && "*"}
                </label>
                {field.type === "textarea" ? (
                  <textarea
                    value={formData[field.id] || ""}
                    onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
                    className="w-full min-h-[100px] px-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40 text-sm"
                    placeholder={field.placeholder}
                    required={field.required}
                  />
                ) : field.type === "select" ? (
                  <select
                    value={formData[field.id] || ""}
                    onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
                    className="w-full h-10 px-4 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
                    required={field.required}
                  >
                    <option value="">Select...</option>
                    {field.options?.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={field.type === "phone" ? "tel" : field.type}
                    value={formData[field.id] || ""}
                    onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
                    className="w-full h-10 px-4 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40 text-sm"
                    placeholder={field.placeholder}
                    required={field.required}
                  />
                )}
              </div>
            ))}

            {error && (
              <p className="text-sm text-destructive font-medium">{error}</p>
            )}

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="submit"
              disabled={submitting}
              className="w-full h-11 gradient-orange rounded-lg text-primary-foreground font-semibold text-sm shadow-orange hover:opacity-95 transition-opacity disabled:opacity-60"
            >
              {submitting ? "Submitting..." : "Submit"}
            </motion.button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default SubmitForm;
