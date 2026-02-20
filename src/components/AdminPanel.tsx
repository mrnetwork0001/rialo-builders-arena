import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, ChevronLeft, LogOut, Loader2, CalendarDays, Users, Edit2, Check, X, Upload, Camera, GripVertical, ClipboardList, CheckCircle2, XCircle, Clock, Star } from "lucide-react";

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
  project_title: string | null;
  description: string | null;
  is_featured: boolean;
}

const emptyParticipant = {
  display_name: "",
  discord_handle: "",
  twitter_handle: "",
  project_link: "",
  project_title: "",
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
interface Application {
  id: string;
  display_name: string;
  discord_handle: string;
  twitter_handle: string | null;
  email: string;
  project_title: string | null;
  project_description: string | null;
  project_link: string | null;
  avatar_url: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
}

export function AdminPanel() {
  const { signOut } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"sessions" | "participants" | "applications">("sessions");

  // New session form
  const [newSessionLabel, setNewSessionLabel] = useState("");
  const [newSessionDate, setNewSessionDate] = useState("");
  const [addingSession, setAddingSession] = useState(false);

  // Applications
  const [applications, setApplications] = useState<Application[]>([]);
  const [applicationsLoading, setApplicationsLoading] = useState(false);
  const [updatingApp, setUpdatingApp] = useState<string | null>(null);

  // Approve modal
  const [approveModal, setApproveModal] = useState<{ app: Application } | null>(null);
  const [approveSessionId, setApproveSessionId] = useState<string>("");
  const [approving, setApproving] = useState(false);

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

  const fetchApplications = async () => {
    setApplicationsLoading(true);
    const { data } = await (supabase as any)
      .from("session_applications")
      .select("*")
      .order("created_at", { ascending: false });
    setApplications(data || []);
    setApplicationsLoading(false);
  };

  const handleUpdateApplicationStatus = async (id: string, status: string) => {
    setUpdatingApp(id);
    await (supabase as any).from("session_applications").update({ status }).eq("id", id);
    setApplications((prev) => prev.map((a) => a.id === id ? { ...a, status } : a));
    setUpdatingApp(null);
  };

  const handleDeleteApplication = async (id: string) => {
    if (!confirm("Delete this application? This cannot be undone.")) return;
    setUpdatingApp(id);
    await (supabase as any).from("session_applications").delete().eq("id", id);
    setApplications((prev) => prev.filter((a) => a.id !== id));
    setUpdatingApp(null);
  };

  const handleApproveWithSession = async () => {
    if (!approveModal || !approveSessionId) return;
    setApproving(true);
    const { app } = approveModal;

    // Create participant from application data
    await (supabase as any).from("participants").insert({
      session_id: approveSessionId,
      display_name: app.display_name,
      discord_handle: app.discord_handle,
      twitter_handle: app.twitter_handle || null,
      project_title: app.project_title || null,
      project_link: app.project_link || null,
      description: app.project_description || null,
      avatar_url: app.avatar_url || null,
      is_featured: false,
    });

    // Mark application as approved
    await (supabase as any).from("session_applications").update({ status: "approved" }).eq("id", app.id);
    setApplications((prev) => prev.map((a) => a.id === app.id ? { ...a, status: "approved" } : a));

    setApproving(false);
    setApproveModal(null);
    setApproveSessionId("");
  };



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
      .order("sort_order")
      .order("created_at");
    setParticipants(data || []);
  };

  // Drag state
  const dragIndex = useRef<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = (index: number) => {
    dragIndex.current = index;
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = async (dropIndex: number) => {
    const fromIndex = dragIndex.current;
    if (fromIndex === null || fromIndex === dropIndex) {
      setDragOverIndex(null);
      dragIndex.current = null;
      return;
    }
    const reordered = [...participants];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(dropIndex, 0, moved);
    setParticipants(reordered);
    setDragOverIndex(null);
    dragIndex.current = null;

    // Persist new order
    await Promise.all(
      reordered.map((p, i) =>
        supabase.from("participants").update({ sort_order: i + 1 }).eq("id", p.id)
      )
    );
  };

  const handleDragEnd = () => {
    setDragOverIndex(null);
    dragIndex.current = null;
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
    } else {
      alert(`Failed to add session: ${error.message}`);
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
    const { data: inserted, error } = await supabase.from("participants").insert({
      session_id: selectedSession.id,
      display_name: newParticipant.display_name,
      discord_handle: newParticipant.discord_handle,
      twitter_handle: newParticipant.twitter_handle || null,
      project_link: newParticipant.project_link || null,
      project_title: newParticipant.project_title || null,
      description: newParticipant.description || null,
      avatar_url: newParticipant.avatar_url || null,
    }).select("id").single();
    if (!error && inserted) {
      setNewParticipant(emptyParticipant);
      setShowAddParticipant(false);
      fetchParticipants(selectedSession.id);
      // Notify followers asynchronously (fire-and-forget)
      supabase.functions.invoke("notify-followers", {
        body: { participant_id: inserted.id },
      }).catch((err) => console.warn("notify-followers failed:", err));
    }
    setAddingParticipant(false);
  };

  const handleDeleteParticipant = async (id: string) => {
    if (!confirm("Delete this participant?")) return;
    await supabase.from("participants").delete().eq("id", id);
    if (selectedSession) fetchParticipants(selectedSession.id);
  };

  const handleToggleFeatured = async (p: Participant) => {
    const newVal = !p.is_featured;
    // Unfeature all in this session first, then set the chosen one
    if (newVal) {
      await supabase.from("participants").update({ is_featured: false }).eq("session_id", p.session_id);
    }
    await supabase.from("participants").update({ is_featured: newVal }).eq("id", p.id);
    if (selectedSession) fetchParticipants(selectedSession.id);
  };

  const handleStartEdit = (p: Participant) => {
    setEditingId(p.id);
    setEditForm({
      display_name: p.display_name,
      discord_handle: p.discord_handle,
      twitter_handle: p.twitter_handle || "",
      project_link: p.project_link || "",
      project_title: p.project_title || "",
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
        project_title: editForm.project_title || null,
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
    { key: "project_title", label: "Project Title", placeholder: "My Awesome App" },
    { key: "project_link", label: "Project Link", placeholder: "https://myproject.com" },
  ];

  return (
    <>
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
              {view === "sessions" ? "Admin Panel" : view === "applications" ? "Applications" : selectedSession?.week_label}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {view !== "applications" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setView("applications"); fetchApplications(); }}
                className="text-muted-foreground hover:text-primary gap-2 text-xs"
              >
                <ClipboardList size={14} />
                Applications
                {applications.filter((a) => a.status === "pending").length > 0 && (
                  <span className="bg-primary text-primary-foreground rounded-full text-xs w-4 h-4 flex items-center justify-center font-bold">
                    {applications.filter((a) => a.status === "pending").length}
                  </span>
                )}
              </Button>
            )}
            {view === "applications" && (
              <Button variant="ghost" size="sm" onClick={() => setView("sessions")} className="text-muted-foreground hover:text-foreground text-xs gap-1">
                <ChevronLeft size={14} /> Sessions
              </Button>
            )}
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
                  <Label className="text-xs text-muted-foreground mb-1 block">Description</Label>
                  <Textarea
                    value={newParticipant.description}
                    onChange={(e) => setNewParticipant({ ...newParticipant, description: e.target.value })}
                    placeholder="Description of the project..."
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
              {participants.map((p, index) => (
                <div
                  key={p.id}
                  draggable={editingId !== p.id}
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDrop={() => handleDrop(index)}
                  onDragEnd={handleDragEnd}
                  className={`gradient-card border rounded-xl p-4 transition-all ${
                    dragOverIndex === index
                      ? "border-primary/60 bg-primary/5 scale-[1.01]"
                      : "border-border"
                  }`}
                >
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
                          rows={3}
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
                        <GripVertical size={15} className="text-muted-foreground/40 hover:text-muted-foreground cursor-grab active:cursor-grabbing shrink-0" />
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
                          <div className="flex items-center gap-1.5">
                            <p className="font-medium text-sm text-foreground">{p.display_name}</p>
                            {p.is_featured && (
                              <span className="text-xs text-primary font-medium bg-primary/10 px-1.5 py-0.5 rounded-full border border-primary/20">⭐ Featured</span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">dc: {p.discord_handle}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          title={p.is_featured ? "Unfeature builder" : "Feature this builder"}
                          onClick={() => handleToggleFeatured(p)}
                          className={`transition-colors p-1.5 ${p.is_featured ? "text-primary" : "text-muted-foreground hover:text-primary"}`}
                        >
                          <Star size={14} className={p.is_featured ? "fill-primary" : ""} />
                        </button>
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

        {/* Applications View */}
        {view === "applications" && (
          <div className="space-y-6">
            <div>
              <h2 className="font-display font-semibold text-xl text-foreground mb-1">Builder Applications</h2>
              <p className="text-muted-foreground text-sm">Review and approve applications from builders who want to join a session.</p>
            </div>

            {applicationsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="animate-spin text-primary" size={28} />
              </div>
            ) : applications.length === 0 ? (
              <p className="text-center text-muted-foreground py-12 text-sm">No applications yet.</p>
            ) : (
              <div className="space-y-3">
                {applications.map((app) => (
                  <div key={app.id} className="gradient-card border border-border rounded-xl p-5 space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 min-w-0">
                        {/* Avatar thumbnail */}
                        {app.avatar_url ? (
                          <img src={app.avatar_url} alt={app.display_name} className="w-10 h-10 rounded-full object-cover border border-border shrink-0 mt-0.5" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary text-xs font-semibold shrink-0 mt-0.5">
                            {app.display_name.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-foreground text-sm">{app.display_name}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                              ${app.status === "pending" ? "bg-yellow-500/15 text-yellow-400 border border-yellow-500/20"
                              : app.status === "approved" ? "bg-primary/15 text-primary border border-primary/20"
                              : "bg-destructive/15 text-destructive border border-destructive/20"}`}
                            >
                              {app.status === "pending" && <Clock size={10} className="inline mr-1" />}
                              {app.status === "approved" && <CheckCircle2 size={10} className="inline mr-1" />}
                              {app.status === "rejected" && <XCircle size={10} className="inline mr-1" />}
                              {app.status}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-xs text-muted-foreground">
                            <span>dc: {app.discord_handle}</span>
                            <span>{app.email}</span>
                            {app.twitter_handle && <span>{app.twitter_handle}</span>}
                          </div>
                          {app.project_title && (
                            <p className="text-xs text-foreground mt-1.5 font-medium">{app.project_title}</p>
                          )}
                          {app.project_description && (
                            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{app.project_description}</p>
                          )}
                          {app.project_link && (
                            <a href={app.project_link} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline mt-0.5 block truncate">{app.project_link}</a>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1.5 shrink-0 flex-col items-end">
                        {app.status !== "approved" && (
                          <button
                            onClick={() => { setApproveModal({ app }); setApproveSessionId(sessions[0]?.id ?? ""); }}
                            disabled={updatingApp === app.id}
                            className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-primary/15 text-primary hover:bg-primary/25 border border-primary/20 transition-colors font-medium"
                          >
                            <CheckCircle2 size={11} />
                            Approve & Add
                          </button>
                        )}
                        {app.status !== "rejected" && (
                          <button
                            onClick={() => handleUpdateApplicationStatus(app.id, "rejected")}
                            disabled={updatingApp === app.id}
                            className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/20 transition-colors font-medium"
                          >
                            {updatingApp === app.id ? <Loader2 size={11} className="animate-spin" /> : <XCircle size={11} />}
                            Reject
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteApplication(app.id)}
                          disabled={updatingApp === app.id}
                          title="Delete application"
                          className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/25 border border-destructive/20 transition-colors font-medium"
                        >
                          {updatingApp === app.id ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={11} />}
                          Delete
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground/60">
                      Submitted {new Date(app.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>

    {/* ── Approve Modal ──────────────────────────────────────────────────── */}
    {approveModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
        <div className="gradient-card border border-border rounded-2xl p-6 w-full max-w-sm shadow-2xl space-y-5">
          <div>
            <h3 className="font-display font-semibold text-foreground text-lg">Approve & Add to Session</h3>
            <p className="text-muted-foreground text-xs mt-1">
              Select the week to add <span className="font-medium text-foreground">{approveModal.app.display_name}</span> as a participant.
            </p>
          </div>

          {/* Avatar + name preview */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border">
            {approveModal.app.avatar_url ? (
              <img src={approveModal.app.avatar_url} alt={approveModal.app.display_name} className="w-10 h-10 rounded-full object-cover border border-border shrink-0" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary text-xs font-semibold shrink-0">
                {approveModal.app.display_name.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">{approveModal.app.display_name}</p>
              <p className="text-xs text-muted-foreground truncate">dc: {approveModal.app.discord_handle}</p>
              {approveModal.app.project_title && <p className="text-xs text-muted-foreground truncate">{approveModal.app.project_title}</p>}
            </div>
          </div>

          {/* Session selector */}
          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">Select Week *</Label>
            {sessions.length === 0 ? (
              <p className="text-xs text-destructive">No sessions found. Create a session first.</p>
            ) : (
              <select
                value={approveSessionId}
                onChange={(e) => setApproveSessionId(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-input px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {sessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.week_label} ({new Date(s.session_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}){s.is_current ? " — Current" : ""}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="flex gap-2 justify-end pt-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setApproveModal(null); setApproveSessionId(""); }}
              disabled={approving}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleApproveWithSession}
              disabled={approving || !approveSessionId || sessions.length === 0}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {approving ? <><Loader2 size={13} className="animate-spin mr-1" /> Adding…</> : "Approve & Add"}
            </Button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}

