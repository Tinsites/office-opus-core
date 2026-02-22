import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface InvoiceItem { description: string; amount: number; }

const PublicInvoice = () => {
  const { token } = useParams<{ token: string }>();
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    supabase.from("invoices").select("*, clients(name)").eq("public_token", token).maybeSingle().then(({ data }) => {
      setInvoice(data);
      setLoading(false);
    });
  }, [token]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  if (!invoice) return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full bg-card border border-border rounded-xl p-8 shadow-card text-center">
        <h1 className="text-xl font-display font-bold text-foreground mb-2">Invoice Not Found</h1>
        <p className="text-sm text-muted-foreground">This invoice link is invalid or has expired.</p>
      </div>
    </div>
  );

  const items = (invoice.items || []) as InvoiceItem[];

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-2xl mx-auto bg-card border border-border rounded-xl p-8 shadow-card">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-9 h-9 rounded-lg gradient-orange flex items-center justify-center">
            <span className="text-primary-foreground font-display font-bold text-sm">T</span>
          </div>
          <span className="font-display text-lg font-bold text-foreground">TinSites OS</span>
        </div>

        <div className="flex justify-between mb-6">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">{invoice.invoice_number}</h1>
            <p className="text-sm text-muted-foreground mt-1">Client: {invoice.clients?.name || "—"}</p>
          </div>
          <div className="text-right">
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${invoice.status === "paid" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>{invoice.status}</span>
            <p className="text-sm text-muted-foreground mt-2">{new Date(invoice.created_at).toLocaleDateString()}</p>
            {invoice.due_date && <p className="text-xs text-muted-foreground">Due: {new Date(invoice.due_date).toLocaleDateString()}</p>}
          </div>
        </div>

        <table className="w-full mb-6">
          <thead><tr className="border-b-2 border-border"><th className="text-left text-sm font-semibold text-foreground py-2">Description</th><th className="text-right text-sm font-semibold text-foreground py-2">Amount</th></tr></thead>
          <tbody>{items.map((item, i) => <tr key={i} className="border-b border-border"><td className="py-3 text-sm text-foreground">{item.description}</td><td className="py-3 text-sm text-foreground text-right">${item.amount.toFixed(2)}</td></tr>)}</tbody>
        </table>

        <div className="text-right space-y-1">
          <p className="text-sm text-muted-foreground">Subtotal: ${Number(invoice.subtotal).toFixed(2)}</p>
          <p className="text-sm text-muted-foreground">Tax: ${Number(invoice.tax).toFixed(2)}</p>
          <p className="text-lg font-display font-bold text-foreground">Total: ${Number(invoice.total).toFixed(2)}</p>
        </div>

        {invoice.notes && <p className="mt-6 text-sm text-muted-foreground border-t border-border pt-4">{invoice.notes}</p>}
      </div>
    </div>
  );
};

export default PublicInvoice;
