import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, ChevronLeft, ChevronRight, Target } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string | null;
  event_type: string;
  is_quarterly_goal: boolean;
}

const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

const CalendarPage = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showForm, setShowForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [editing, setEditing] = useState<CalendarEvent | null>(null);
  const [form, setForm] = useState({ title: "", description: "", event_type: "appointment", is_quarterly_goal: false, start_date: "", end_date: "" });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const fetchEvents = async () => {
    const startOfMonth = new Date(year, month, 1).toISOString();
    const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59).toISOString();
    const { data } = await supabase.from("calendar_events").select("*").gte("start_date", startOfMonth).lte("start_date", endOfMonth).order("start_date");
    if (data) setEvents(data as any);
  };

  useEffect(() => { fetchEvents(); }, [month, year]);

  const resetForm = () => { setForm({ title: "", description: "", event_type: "appointment", is_quarterly_goal: false, start_date: "", end_date: "" }); setEditing(null); setShowForm(false); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.start_date) return;
    const payload = {
      title: form.title, description: form.description || null,
      start_date: new Date(form.start_date).toISOString(),
      end_date: form.end_date ? new Date(form.end_date).toISOString() : null,
      event_type: form.event_type as any, is_quarterly_goal: form.is_quarterly_goal,
    };
    if (editing) {
      const { error } = await supabase.from("calendar_events").update(payload).eq("id", editing.id);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Event updated" });
    } else {
      const { error } = await supabase.from("calendar_events").insert({ ...payload, created_by: user?.id });
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Event created" });
    }
    resetForm();
    fetchEvents();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("calendar_events").delete().eq("id", id);
    toast({ title: "Event deleted" });
    fetchEvents();
  };

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const cells = Array.from({ length: 42 }, (_, i) => {
    const day = i - firstDay + 1;
    return day > 0 && day <= daysInMonth ? day : null;
  });

  const getEventsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return events.filter(e => e.start_date.startsWith(dateStr));
  };

  const quarterStart = Math.floor(month / 3) * 3;
  const quarterGoals = events.filter(e => e.is_quarterly_goal);
  const quarterLabel = `Q${Math.floor(month / 3) + 1} ${year}`;

  const openAddForDate = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    setForm({ ...form, start_date: dateStr });
    setShowForm(true);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Calendar</h1>
          <p className="text-muted-foreground text-sm mt-1">Schedule and track events</p>
        </div>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => { resetForm(); setShowForm(true); }} className="h-10 px-5 gradient-orange rounded-lg text-primary-foreground text-sm font-semibold flex items-center gap-2 shadow-orange">
          <Plus size={16} /> Add Event
        </motion.button>
      </motion.div>

      {quarterGoals.length > 0 && (
        <div className="mb-4 p-3 bg-accent border border-border rounded-lg flex items-center gap-3">
          <Target size={16} className="text-accent-foreground" />
          <div>
            <p className="text-sm font-medium text-accent-foreground">{quarterLabel} Goals</p>
            <p className="text-xs text-muted-foreground">{quarterGoals.map(g => g.title).join(" • ")}</p>
          </div>
        </div>
      )}

      <div className="bg-card border border-border rounded-xl shadow-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <button onClick={() => setCurrentDate(new Date(year, month - 1))} className="p-1 rounded hover:bg-muted"><ChevronLeft size={18} /></button>
          <h2 className="font-display font-semibold text-foreground">{months[month]} {year}</h2>
          <button onClick={() => setCurrentDate(new Date(year, month + 1))} className="p-1 rounded hover:bg-muted"><ChevronRight size={18} /></button>
        </div>

        <div className="grid grid-cols-7">
          {days.map(d => <div key={d} className="px-2 py-2 text-center text-[10px] font-semibold uppercase text-muted-foreground border-b border-border">{d}</div>)}
          {cells.map((day, i) => {
            const dayEvents = day ? getEventsForDay(day) : [];
            const isToday = day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();
            return (
              <div key={i} onClick={() => day && openAddForDate(day)} className={`min-h-[80px] p-1 border-b border-r border-border cursor-pointer hover:bg-muted/30 transition-colors ${!day ? "bg-muted/10" : ""}`}>
                {day && (
                  <>
                    <span className={`text-xs font-medium inline-flex w-6 h-6 items-center justify-center rounded-full ${isToday ? "gradient-orange text-primary-foreground" : "text-foreground"}`}>{day}</span>
                    {dayEvents.map(ev => (
                      <div key={ev.id} onClick={(e) => { e.stopPropagation(); setEditing(ev); setForm({ title: ev.title, description: ev.description || "", event_type: ev.event_type, is_quarterly_goal: ev.is_quarterly_goal, start_date: ev.start_date.slice(0, 10), end_date: ev.end_date?.slice(0, 10) || "" }); setShowForm(true); }}
                        className={`text-[10px] px-1 py-0.5 rounded mt-0.5 truncate ${ev.is_quarterly_goal ? "bg-primary/10 text-primary font-semibold" : ev.event_type === "milestone" ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"}`}>
                        {ev.title}
                      </div>
                    ))}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4 text-xs text-muted-foreground text-center">💡 Tip: Set quarterly goals to stay on track. Review them at the start of each quarter.</div>

      <Dialog open={showForm} onOpenChange={(open) => { if (!open) resetForm(); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Event" : "Add Event"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Title *</label>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full h-10 px-3 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring/40" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Description</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full min-h-[60px] px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring/40" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Start Date *</label>
                <input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} className="w-full h-10 px-3 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring/40" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">End Date</label>
                <input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} className="w-full h-10 px-3 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring/40" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Type</label>
                <select value={form.event_type} onChange={(e) => setForm({ ...form, event_type: e.target.value })} className="w-full h-10 px-3 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring/40">
                  <option value="appointment">Appointment</option>
                  <option value="goal">Goal</option>
                  <option value="milestone">Milestone</option>
                </select>
              </div>
              <div className="flex items-end pb-1">
                <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                  <input type="checkbox" checked={form.is_quarterly_goal} onChange={(e) => setForm({ ...form, is_quarterly_goal: e.target.checked })} className="rounded border-border" />
                  Quarterly Goal
                </label>
              </div>
            </div>
            <div className="flex justify-between pt-2">
              {editing && <button type="button" onClick={() => { handleDelete(editing.id); resetForm(); }} className="h-10 px-4 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors">Delete</button>}
              <div className="flex gap-3 ml-auto">
                <button type="button" onClick={resetForm} className="h-10 px-4 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors">Cancel</button>
                <button type="submit" className="h-10 px-5 gradient-orange rounded-lg text-primary-foreground text-sm font-semibold shadow-orange">{editing ? "Update" : "Create"}</button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CalendarPage;
