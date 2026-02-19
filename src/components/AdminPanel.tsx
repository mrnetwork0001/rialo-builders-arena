import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, ChevronLeft, LogOut, Loader2, CalendarDays, Users, Edit2, Check, X, Upload, Camera } from "lucide-react";

interface Session {
  id: string;
  week_label: string;
  session_date: string;
  is_current: boolean;
}

interface Participant {
  id: string;
  session_id: string;
  display_name: string;
  avatar_url: string | null;
  discord_handle: string;
  twitter_handle: string | null;
  project_link: string | null;
  description: string | null;
}

const emptyParticipant = {
  display_name: "",
  discord_handle: "",
  twitter_handle: "",
  project_link: "",
  description: "",
  avatar_url: "",
};

// ── Avatar Upload Component ──────────────────────────────────────────────────
function AvatarUpload({
  value,
  onChange,
  displayName,
}: {
  value: string;
  onChange: (url: string) => void;
  displayName?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be under 5MB.");
      return;
    }
    setError("");
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });
    if (uploadError) {
      setError(uploadError.message);
    } else {
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      onChange(data.publicUrl);
    }
    setUploading(false);
  };

  return (
    <div className="flex items-center gap-3">
      {/* Preview */}
      <div className="shrink-0">
        {value ? (
          <img
            src={value}
            alt="Avatar preview"
            className="w-14 h-14 rounded-full object-cover border-2 border-primary/30"
          />
        ) : (
          <div className="w-14 h-14 rounded-full bg-primary/10 border-2 border-dashed border-primary/30 flex items-center justify-center text-primary/50">
            {displayName ? (
              <span className="text-sm font-semibold text-primary/60">
                {displayName.slice(0, 2).toUpperCase()}
              </span>
            ) : (
              <Camera size={18} />
            )}
          </div>
        )}
      </div>

      {/* Upload button */}
      <div className="flex-1 min-w-0">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg border border-border bg-input hover:bg-primary/10 hover:border-primary/40 text-muted-foreground hover:text-primary transition-colors w-full disabled:opacity-60"
        >
          {uploading ? (
            <Loader2 size={13} className="animate-spin" />
          ) : (
            <Upload size={13} />
          )}
          {uploading ? "Uploading…" : value ? "Change photo" : "Upload photo"}
        </button>
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="text-xs text-muted-foreground hover:text-destructive mt-1 ml-1"
          >
            Remove
          </button>
        )}
        {error && <p className="text-xs text-destructive mt-1">{error}</p>}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            e.target.value = "";
          }}
        />
      </div>
    </div>
  );
}

// ── AdminPanel ───────────────────────────────────────────────────────────────
export function AdminPanel() {
  const { signOut } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"sessions" | "participants">("sessions");

  // New session form
  const [newSessionLabel, setNewSessionLabel] = useState("");
  const [newSessionDate, setNewSessionDate] = useState("");
  const [addingSession, setAddingSession] = useState(false);

  // New participant form
  const [showAddParticipant, setShowAddParticipant] = useState(false);
  const [newParticipant, setNewParticipant] = useState(emptyParticipant);
  const [addingParticipant, setAddingParticipant] = useState(false);

  // Edit participant
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(emptyParticipant);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("weekly_sessions")
      .select("*")
      .order("session_date", { ascending: false });
    setSessions(data || []);
    setLoading(false);
  };

  const fetchParticipants = async (sessionId: string) => {
    const { data } = await supabase
      .from("participants")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at");
    setParticipants(data || []);
  };

  const handleSelectSession = (session: Session) => {
    setSelectedSession(session);
    fetchParticipants(session.id);
    setView("participants");
  };

  const handleAddSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSessionLabel || !newSessionDate) return;
    setAddingSession(true);
    const { error } = await supabase.from("weekly_sessions").insert({
      week_label: newSessionLabel,
      session_date: newSessionDate,
      is_current: false,
    });
    if (!error) {
      setNewSessionLabel("");
      setNewSessionDate("");
      fetchSessions();
    }
    setAddingSession(false);
  };

  const handleDeleteSession = async (id: string) => {
    if (!confirm("Delete this session and all its participants?")) return;
    await supabase.from("weekly_sessions").delete().eq("id", id);
    fetchSessions();
  };

  const handleSetCurrent = async (id: string) => {
    await supabase.from("weekly_sessions").update({ is_current: true }).eq("id", id);
    fetchSessions();
  };

  const handleAddParticipant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSession) return;
    setAddingParticipant(true);
    const { error } = await supabase.from("participants").insert({
      session_id: selectedSession.id,
      display_name: newParticipant.display_name,
      discord_handle: newParticipant.discord_handle,
      twitter_handle: newParticipant.twitter_handle || null,
      project_link: newParticipant.project_link || null,
      description: newParticipant.description || null,
      avatar_url: newParticipant.avatar_url || null,
    });
    if (!error) {
      setNewParticipant(emptyParticipant);
      setShowAddParticipant(false);
      fetchParticipants(selectedSession.id);
    }
    setAddingParticipant(false);
  };

  const handleDeleteParticipant = async (id: string) => {
    if (!confirm("Delete this participant?")) return;
    await supabase.from("participants").delete().eq("id", id);
    if (selectedSession) fetchParticipants(selectedSession.id);
  };

  const handleStartEdit = (p: Participant) => {
    setEditingId(p.id);
    setEditForm({
      display_name: p.display_name,
      discord_handle: p.discord_handle,
      twitter_handle: p.twitter_handle || "",
      project_link: p.project_link || "",
      description: p.description || "",
      avatar_url: p.avatar_url || "",
    });
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    await supabase
      .from("participants")
      .update({
        display_name: editForm.display_name,
        discord_handle: editForm.discord_handle,
        twitter_handle: editForm.twitter_handle || null,
        project_link: editForm.project_link || null,
        description: editForm.description || null,
        avatar_url: editForm.avatar_url || null,
      })
      .eq("id", editingId);
    setEditingId(null);
    if (selectedSession) fetchParticipants(selectedSession.id);
  };

  const textFields = [
    { key: "display_name", label: "Display Name *", placeholder: "John Doe" },
    { key: "discord_handle", label: "Discord Handle *", placeholder: "johndoe#1234" },
    { key: "twitter_handle", label: "Twitter/X Handle", placeholder: "@johndoe" },
    { key: "project_link", label: "Project Link", placeholder: "https://myproject.com" },
  ];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {view === "participants" && (
              <button
                onClick={() => {
                  setView("sessions");
                  setSelectedSession(null);
                  setShowAddParticipant(false);
                }}
                className="text-muted-foreground hover:text-foreground transition-colors mr-1"
              >
                <ChevronLeft size={20} />
              </button>
            )}
            <span className="font-display font-semibold text-foreground">
              {view === "sessions" ? "Admin Panel" : selectedSession?.week_label}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={signOut}
            className="text-muted-foreground hover:text-foreground gap-2"
          >
            <LogOut size={15} />
            Sign Out
          </Button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Sessions View */}
        {view === "sessions" && (
          <div className="space-y-6">
            <div>
              <h2 className="font-display font-semibold text-xl text-foreground mb-1">Weekly Sessions</h2>
              <p className="text-muted-foreground text-sm">Manage sessions and navigate to add participants.</p>
            </div>

            {/* Add Session Form */}
            <form onSubmit={handleAddSession} className="gradient-card border border-border rounded-xl p-5 space-y-4">
              <h3 className="font-display font-semibold text-foreground flex items-center gap-2">
                <Plus size={16} className="text-primary" /> New Session
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Week Label</Label>
                  <Input
                    value={newSessionLabel}
                    onChange={(e) => setNewSessionLabel(e.target.value)}
                    placeholder="Week of Feb 19, 2026"
                    className="bg-input border-border"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Session Date</Label>
                  <Input
                    type="date"
                    value={newSessionDate}
                    onChange={(e) => setNewSessionDate(e.target.value)}
                    className="bg-input border-border"
                  />
                </div>
              </div>
              <Button
                type="submit"
                disabled={addingSession || !newSessionLabel || !newSessionDate}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                size="sm"
              >
                {addingSession ? <Loader2 size={14} className="animate-spin mr-1" /> : null}
                Add Session
              </Button>
            </form>

            {/* Session List */}
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="animate-spin text-primary" size={28} />
              </div>
            ) : (
              <div className="space-y-3">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className="gradient-card border border-border rounded-xl p-4 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <CalendarDays size={16} className="text-primary shrink-0" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground text-sm truncate">{session.week_label}</span>
                          {session.is_current && (
                            <span className="shrink-0 text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full font-medium">
                              Current
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(session.session_date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {!session.is_current && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleSetCurrent(session.id)}
                          className="text-xs text-muted-foreground hover:text-primary h-8 px-2"
                        >
                          Set Current
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleSelectSession(session)}
                        className="text-xs text-primary h-8 px-2 gap-1"
                      >
                        <Users size={13} /> Manage
                      </Button>
                      <button
                        onClick={() => handleDeleteSession(session.id)}
                        className="text-muted-foreground hover:text-destructive transition-colors p-1.5"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
                {sessions.length === 0 && (
                  <p className="text-muted-foreground text-center py-8 text-sm">No sessions yet. Create one above.</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Participants View */}
        {view === "participants" && selectedSession && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display font-semibold text-xl text-foreground">Participants</h2>
                <p className="text-muted-foreground text-sm">{participants.length} builders in this session</p>
              </div>
              <Button
                onClick={() => setShowAddParticipant(!showAddParticipant)}
                className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
                size="sm"
              >
                <Plus size={14} /> Add Participant
              </Button>
            </div>

            {/* Add Participant Form */}
            {showAddParticipant && (
              <form
                onSubmit={handleAddParticipant}
                className="gradient-card border border-border rounded-xl p-5 space-y-4 animate-fade-in"
              >
                <h3 className="font-display font-semibold text-foreground">New Participant</h3>

                {/* Avatar upload */}
                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block">Profile Photo</Label>
                  <AvatarUpload
                    value={newParticipant.avatar_url}
                    onChange={(url) => setNewParticipant({ ...newParticipant, avatar_url: url })}
                    displayName={newParticipant.display_name}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {textFields.map(({ key, label, placeholder }) => (
                    <div key={key}>
                      <Label className="text-xs text-muted-foreground mb-1 block">{label}</Label>
                      <Input
                        value={newParticipant[key as keyof typeof newParticipant]}
                        onChange={(e) => setNewParticipant({ ...newParticipant, [key]: e.target.value })}
                        placeholder={placeholder}
                        className="bg-input border-border"
                        required={key === "display_name" || key === "discord_handle"}
                      />
                    </div>
                  ))}
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Description (max 300 chars)</Label>
                  <Textarea
                    value={newParticipant.description}
                    onChange={(e) => setNewParticipant({ ...newParticipant, description: e.target.value })}
                    placeholder="Short description of the project..."
                    maxLength={300}
                    rows={3}
                    className="bg-input border-border resize-none"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    type="submit"
                    disabled={addingParticipant}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                    size="sm"
                  >
                    {addingParticipant ? <Loader2 size={14} className="animate-spin mr-1" /> : null}
                    Add Participant
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAddParticipant(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            )}

            {/* Participants List */}
            <div className="space-y-3">
              {participants.map((p) => (
                <div key={p.id} className="gradient-card border border-border rounded-xl p-4">
                  {editingId === p.id ? (
                    <div className="space-y-4">
                      {/* Avatar upload in edit mode */}
                      <div>
                        <Label className="text-xs text-muted-foreground mb-2 block">Profile Photo</Label>
                        <AvatarUpload
                          value={editForm.avatar_url}
                          onChange={(url) => setEditForm({ ...editForm, avatar_url: url })}
                          displayName={editForm.display_name}
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {textFields.map(({ key, label, placeholder }) => (
                          <div key={key}>
                            <Label className="text-xs text-muted-foreground mb-1 block">{label}</Label>
                            <Input
                              value={editForm[key as keyof typeof editForm]}
                              onChange={(e) => setEditForm({ ...editForm, [key]: e.target.value })}
                              placeholder={placeholder}
                              className="bg-input border-border h-8 text-sm"
                            />
                          </div>
                        ))}
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground mb-1 block">Description</Label>
                        <Textarea
                          value={editForm.description}
                          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                          maxLength={300}
                          rows={2}
                          className="bg-input border-border resize-none text-sm"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleSaveEdit}
                          className="flex items-center gap-1 text-xs text-primary hover:opacity-80"
                        >
                          <Check size={13} /> Save
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="flex items-center gap-1 text-xs text-muted-foreground hover:opacity-80"
                        >
                          <X size={13} /> Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {p.avatar_url ? (
                          <img
                            src={p.avatar_url}
                            alt={p.display_name}
                            className="w-9 h-9 rounded-full object-cover border border-border shrink-0"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary text-xs font-semibold shrink-0">
                            {p.display_name.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-medium text-sm text-foreground">{p.display_name}</p>
                          <p className="text-xs text-muted-foreground truncate">#{p.discord_handle}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleStartEdit(p)}
                          className="text-muted-foreground hover:text-primary transition-colors p-1.5"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteParticipant(p.id)}
                          className="text-muted-foreground hover:text-destructive transition-colors p-1.5"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {participants.length === 0 && !showAddParticipant && (
                <p className="text-muted-foreground text-center py-8 text-sm">
                  No participants yet. Add the first one!
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
