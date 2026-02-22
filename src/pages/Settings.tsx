import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Shield, Palette, Bell, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

const roleLabels: Record<string, string> = {
  ceo: "CEO", operations_manager: "Operations Manager", brand_manager: "Brand Manager",
  admin: "Admin", staff: "Staff", user: "User",
};

const Settings = () => {
  const { user } = useAuth();
  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [role, setRole] = useState("staff");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const [{ data: profile }, { data: roles }] = await Promise.all([
        supabase.from("profiles").select("full_name, avatar_url").eq("user_id", user.id).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", user.id),
      ]);
      if (profile) { setFullName(profile.full_name || ""); setAvatarUrl(profile.avatar_url || ""); }
      if (roles && roles.length > 0) setRole(roles[0].role);
    };
    fetch();
    setTheme(document.documentElement.classList.contains("dark") ? "dark" : "light");
  }, [user]);

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ full_name: fullName, avatar_url: avatarUrl }).eq("user_id", user.id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else toast({ title: "Profile updated" });
    setSaving(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const path = `${user.id}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file);
    if (error) { toast({ title: "Upload failed", description: error.message, variant: "destructive" }); return; }
    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
    setAvatarUrl(publicUrl);
    toast({ title: "Avatar uploaded" });
  };

  const toggleTheme = (t: "light" | "dark") => {
    setTheme(t);
    document.documentElement.classList.toggle("dark", t === "dark");
  };

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-2xl font-display font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your account and preferences</p>
      </motion.div>

      <div className="space-y-6">
        {/* Profile */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-xl p-6 shadow-card">
          <div className="flex items-center gap-2 mb-4"><User size={18} className="text-primary" /><h2 className="font-display font-semibold text-foreground">Profile</h2></div>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full gradient-orange flex items-center justify-center text-primary-foreground font-display font-bold text-xl overflow-hidden">
                {avatarUrl ? <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" /> : fullName.charAt(0) || "?"}
              </div>
              <div>
                <label className="text-xs text-primary font-medium cursor-pointer hover:underline">
                  Upload Photo
                  <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                </label>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Full Name</label>
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full h-10 px-3 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring/40" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Email</label>
              <input value={user?.email || ""} disabled className="w-full h-10 px-3 rounded-lg border border-border bg-muted text-muted-foreground text-sm" />
            </div>
            <button onClick={handleSaveProfile} disabled={saving} className="h-10 px-5 gradient-orange rounded-lg text-primary-foreground text-sm font-semibold flex items-center gap-2 shadow-orange disabled:opacity-60">
              <Save size={14} /> {saving ? "Saving..." : "Save Profile"}
            </button>
          </div>
        </motion.div>

        {/* Role */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card border border-border rounded-xl p-6 shadow-card">
          <div className="flex items-center gap-2 mb-4"><Shield size={18} className="text-primary" /><h2 className="font-display font-semibold text-foreground">Role</h2></div>
          <p className="text-sm text-foreground">{roleLabels[role] || role}</p>
          <p className="text-xs text-muted-foreground mt-1">Roles are managed by administrators and cannot be changed here.</p>
        </motion.div>

        {/* Theme */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-card border border-border rounded-xl p-6 shadow-card">
          <div className="flex items-center gap-2 mb-4"><Palette size={18} className="text-primary" /><h2 className="font-display font-semibold text-foreground">Theme</h2></div>
          <div className="flex gap-3">
            {(["light", "dark"] as const).map((t) => (
              <button key={t} onClick={() => toggleTheme(t)} className={`h-10 px-5 rounded-lg text-sm font-medium transition-colors ${theme === t ? "gradient-orange text-primary-foreground shadow-orange" : "border border-border text-foreground hover:bg-muted"}`}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Notifications */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-card border border-border rounded-xl p-6 shadow-card">
          <div className="flex items-center gap-2 mb-4"><Bell size={18} className="text-primary" /><h2 className="font-display font-semibold text-foreground">Notifications</h2></div>
          <p className="text-sm text-muted-foreground">Notification preferences will be available soon.</p>
        </motion.div>
      </div>
    </div>
  );
};

export default Settings;
