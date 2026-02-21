import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Send, Search, Circle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

interface Profile {
  user_id: string;
  full_name: string | null;
}

interface UserRole {
  user_id: string;
  role: string;
}

interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

const roleLabels: Record<string, string> = {
  ceo: "CEO",
  operations_manager: "Operations Manager",
  brand_manager: "Brand Manager",
  admin: "Admin",
  staff: "Staff",
  user: "User",
};

const Messages = () => {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    
    const fetchData = async () => {
      // Fetch all profiles (visible to authenticated users)
      const { data: profilesData } = await supabase.from("profiles").select("user_id, full_name");
      // We can only see our own profile due to RLS, but let's work with what we get
      // For messaging, we need to know about other users - let's fetch from messages
      
      const { data: rolesData } = await supabase.from("user_roles").select("user_id, role");
      
      if (profilesData) setProfiles(profilesData);
      if (rolesData) setRoles(rolesData);

      // Fetch all messages for this user
      const { data: messagesData } = await supabase
        .from("messages")
        .select("*")
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .order("created_at", { ascending: true });
      
      if (messagesData) setMessages(messagesData as Message[]);
    };

    fetchData();

    // Subscribe to new messages in realtime
    const channel = supabase
      .channel("messages-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        const msg = payload.new as Message;
        if (msg.sender_id === user.id || msg.recipient_id === user.id) {
          setMessages((prev) => [...prev, msg]);
        }
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "messages" }, (payload) => {
        const msg = payload.new as Message;
        setMessages((prev) => prev.map((m) => (m.id === msg.id ? msg : m)));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, selectedUser]);

  // Mark messages as read when selecting a conversation
  useEffect(() => {
    if (!selectedUser || !user) return;
    const unread = messages.filter((m) => m.sender_id === selectedUser && m.recipient_id === user.id && !m.is_read);
    if (unread.length > 0) {
      supabase.from("messages").update({ is_read: true }).in("id", unread.map((m) => m.id)).then(() => {
        setMessages((prev) => prev.map((m) => unread.find((u) => u.id === m.id) ? { ...m, is_read: true } : m));
      });
    }
  }, [selectedUser, messages, user]);

  // Get unique conversation partners from messages
  const conversationPartners = Array.from(
    new Set(messages.map((m) => (m.sender_id === user?.id ? m.recipient_id : m.sender_id)))
  );

  // Also include profiles that we know about but haven't messaged yet
  const allKnownUsers = Array.from(new Set([...conversationPartners, ...profiles.filter(p => p.user_id !== user?.id).map(p => p.user_id)]));

  const getProfileName = (userId: string) => {
    const profile = profiles.find((p) => p.user_id === userId);
    return profile?.full_name || "Team Member";
  };

  const getUserRole = (userId: string) => {
    const role = roles.find((r) => r.user_id === userId);
    return role ? roleLabels[role.role] || role.role : "Staff";
  };

  const getUnreadCount = (userId: string) => {
    return messages.filter((m) => m.sender_id === userId && m.recipient_id === user?.id && !m.is_read).length;
  };

  const getLastMessage = (userId: string) => {
    const convMessages = messages.filter(
      (m) => (m.sender_id === userId && m.recipient_id === user?.id) || (m.sender_id === user?.id && m.recipient_id === userId)
    );
    return convMessages[convMessages.length - 1];
  };

  const conversationMessages = messages.filter(
    (m) => (m.sender_id === selectedUser && m.recipient_id === user?.id) || (m.sender_id === user?.id && m.recipient_id === selectedUser)
  );

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser || !user) return;
    
    const { error } = await supabase.from("messages").insert({
      sender_id: user.id,
      recipient_id: selectedUser,
      content: newMessage.trim(),
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setNewMessage("");
    }
  };

  const filteredUsers = allKnownUsers.filter((uid) => {
    const name = getProfileName(uid).toLowerCase();
    return name.includes(searchTerm.toLowerCase());
  });

  // Sort by last message time
  const sortedUsers = filteredUsers.sort((a, b) => {
    const lastA = getLastMessage(a);
    const lastB = getLastMessage(b);
    if (!lastA && !lastB) return 0;
    if (!lastA) return 1;
    if (!lastB) return -1;
    return new Date(lastB.created_at).getTime() - new Date(lastA.created_at).getTime();
  });

  return (
    <div className="flex h-[calc(100vh-0px)]">
      {/* Sidebar - Conversations */}
      <div className="w-80 border-r border-border flex flex-col bg-card">
        <div className="p-4 border-b border-border">
          <h1 className="text-lg font-display font-bold text-foreground mb-3">Messages</h1>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-9 pl-9 pr-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40 text-sm"
              placeholder="Search conversations..."
            />
          </div>
        </div>
        <div className="flex-1 overflow-auto">
          {sortedUsers.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground text-sm">
              No conversations yet. Other team members will appear here once they sign up.
            </div>
          ) : (
            sortedUsers.map((uid) => {
              const lastMsg = getLastMessage(uid);
              const unread = getUnreadCount(uid);
              return (
                <button
                  key={uid}
                  onClick={() => setSelectedUser(uid)}
                  className={`w-full p-4 text-left hover:bg-muted/50 transition-colors border-b border-border ${selectedUser === uid ? "bg-muted/70" : ""}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full gradient-orange flex items-center justify-center text-primary-foreground font-display font-bold text-sm shrink-0">
                      {getProfileName(uid).charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground truncate">{getProfileName(uid)}</span>
                        {unread > 0 && (
                          <span className="w-5 h-5 rounded-full gradient-orange text-primary-foreground text-[10px] font-bold flex items-center justify-center shrink-0">{unread}</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{getUserRole(uid)}</p>
                      {lastMsg && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{lastMsg.content}</p>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        {selectedUser ? (
          <>
            {/* Chat header */}
            <div className="h-16 border-b border-border flex items-center px-6 bg-card">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full gradient-orange flex items-center justify-center text-primary-foreground font-display font-bold text-sm">
                  {getProfileName(selectedUser).charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{getProfileName(selectedUser)}</p>
                  <p className="text-xs text-muted-foreground">{getUserRole(selectedUser)}</p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-auto p-6 space-y-4">
              {conversationMessages.map((msg) => {
                const isMine = msg.sender_id === user?.id;
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                  >
                    <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm ${isMine ? "gradient-orange text-primary-foreground rounded-br-md" : "bg-muted text-foreground rounded-bl-md"}`}>
                      {msg.content}
                      <p className={`text-[10px] mt-1 ${isMine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            {/* Message input */}
            <form onSubmit={handleSend} className="p-4 border-t border-border bg-card">
              <div className="flex items-center gap-3">
                <input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1 h-10 px-4 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40 text-sm"
                  placeholder="Type a message..."
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="w-10 h-10 gradient-orange rounded-lg flex items-center justify-center text-primary-foreground shadow-orange disabled:opacity-50"
                >
                  <Send size={16} />
                </motion.button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center mx-auto mb-4">
                <Send size={28} className="text-accent-foreground" />
              </div>
              <h2 className="text-lg font-display font-semibold text-foreground mb-1">Your Messages</h2>
              <p className="text-sm text-muted-foreground">Select a conversation to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;
