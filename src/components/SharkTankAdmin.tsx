import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus, Trash2, ChevronLeft, Loader2, CalendarDays, Edit2, Check, X, Upload, Camera,
  CheckCircle2, XCircle, Clock, Search, DollarSign, Video, Play, User
} from "lucide-react";

interface STSession {
  id: string; week_label: string; session_date: string; is_current: boolean;
  stream_link: string | null; replay_link: string | null; description: string | null;
}
interface Shark {
  id: string; display_name: string; title: string | null; avatar_url: string | null;
  bio: string | null; twitter_handle: string | null; is_active: boolean; sort_order: number;
}
interface Pitch {
  id: string; session_id: string; builder_name: string; builder_avatar_url: string | null;
  builder_discord: string | null; builder_twitter: string | null; project_name: string;
  description: string | null; demo_link: string | null; pitch_deck_link: string | null;
  funding_ask: string | null; is_funded: boolean; funded_amount: string | null; status: string; sort_order: number;
}
interface STApplication {
  id: string; display_name: string; discord_handle: string; twitter_handle: string | null;
  project_name: string; project_description: string | null; demo_link: string | null;
  pitch_deck_link: string | null; funding_ask: string | null; funding_purpose: string | null;
  avatar_url: string | null; status: string; admin_notes: string | null; created_at: string;
}
interface Feedback {
  id: string; pitch_id: string; shark_id: string; feedback: string | null;
  offer_amount: string | null; offer_type: string | null; is_accepted: boolean;
}

function AvatarUpload({ value, onChange, displayName }: { value: string; onChange: (url: string) => void; displayName?: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) { setError("Please select an image file."); return; }
    if (file.size > 5 * 1024 * 1024) { setError("Image must be under 5MB."); return; }
    setError(""); setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (uploadError) setError(uploadError.message);
    else { const { data } = supabase.storage.from("avatars").getPublicUrl(path); onChange(data.publicUrl); }
    setUploading(false);
  };
  return (
    <div className="flex items-center gap-3">
      <div className="shrink-0">
        {value ? <img src={value} alt="Avatar" className="w-12 h-12 rounded-full object-cover border-2 border-primary/30" />
        : <div className="w-12 h-12 rounded-full bg-primary/10 border-2 border-dashed border-primary/30 flex items-center justify-center text-primary/50">
            {displayName ? <span className="text-sm font-semibold text-primary/60">{displayName.slice(0, 2).toUpperCase()}</span> : <Camera size={16} />}
          </div>}
      </div>
      <div className="flex-1 min-w-0">
        <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading}
          className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg border border-border bg-input hover:bg-primary/10 hover:border-primary/40 text-muted-foreground hover:text-primary transition-colors w-full disabled:opacity-60">
          {uploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
          {uploading ? "Uploading…" : value ? "Change" : "Upload"}
        </button>
        {value && <button type="button" onClick={() => onChange("")} className="text-xs text-muted-foreground hover:text-destructive mt-1 ml-1">Remove</button>}
        {error && <p className="text-xs text-destructive mt-1">{error}</p>}
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }} />
      </div>
    </div>
  );
}

export function SharkTankAdmin({ onBack }: { onBack: () => void }) {
  const [view, setView] = useState<"sessions" | "pitches" | "sharks" | "applications">("sessions");
  const [sessions, setSessions] = useState<STSession[]>([]);
  const [sharks, setSharks] = useState<Shark[]>([]);
  const [pitches, setPitches] = useState<Pitch[]>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [applications, setApplications] = useState<STApplication[]>([]);
  const [selectedSession, setSelectedSession] = useState<STSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [appSearch, setAppSearch] = useState("");

  // New session form
  const [newLabel, setNewLabel] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newStreamLink, setNewStreamLink] = useState("");
  const [newReplayLink, setNewReplayLink] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [adding, setAdding] = useState(false);

  // New shark form
  const [showAddShark, setShowAddShark] = useState(false);
  const [sharkForm, setSharkForm] = useState({ display_name: "", title: "", avatar_url: "", bio: "", twitter_handle: "" });
  const [addingShark, setAddingShark] = useState(false);

  // New pitch form
  const [showAddPitch, setShowAddPitch] = useState(false);
  const [pitchForm, setPitchForm] = useState({ builder_name: "", builder_avatar_url: "", builder_discord: "", builder_twitter: "", project_name: "", description: "", demo_link: "", pitch_deck_link: "", funding_ask: "" });
  const [addingPitch, setAddingPitch] = useState(false);

  // New feedback form
  const [fbPitchId, setFbPitchId] = useState<string | null>(null);
  const [fbForm, setFbForm] = useState({ shark_id: "", feedback: "", offer_amount: "", offer_type: "" });
  const [addingFb, setAddingFb] = useState(false);

  // Applications
  const [appsLoading, setAppsLoading] = useState(false);
  const [updatingApp, setUpdatingApp] = useState<string | null>(null);

  // Approve modal
  const [approveModal, setApproveModal] = useState<{ app: STApplication } | null>(null);
  const [approveSessionId, setApproveSessionId] = useState("");
  const [approving, setApproving] = useState(false);

  useEffect(() => { fetchSessions(); fetchSharks(); }, []);

  const fetchSessions = async () => {
    setLoading(true);
    const { data } = await supabase.from("shark_tank_sessions").select("*").order("session_date", { ascending: false });
    setSessions((data as STSession[]) || []);
    setLoading(false);
  };

  const fetchSharks = async () => {
    const { data } = await supabase.from("shark_tank_sharks").select("*").order("sort_order");
    setSharks((data as Shark[]) || []);
  };

  const fetchPitches = async (sessionId: string) => {
    const { data } = await supabase.from("shark_tank_pitches").select("*").eq("session_id", sessionId).order("sort_order");
    setPitches((data as Pitch[]) || []);
    // Fetch feedbacks
    if (data && data.length > 0) {
      const ids = data.map((p: any) => p.id);
      const { data: fbData } = await supabase.from("shark_tank_feedback").select("*").in("pitch_id", ids);
      setFeedbacks((fbData as Feedback[]) || []);
    } else { setFeedbacks([]); }
  };

  const fetchApplications = async () => {
    setAppsLoading(true);
    const { data } = await supabase.from("shark_tank_applications").select("*").order("created_at", { ascending: false });
    setApplications((data as STApplication[]) || []);
    setAppsLoading(false);
  };

  const handleAddSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel || !newDate) return;
    setAdding(true);
    await supabase.from("shark_tank_sessions").insert({
      week_label: newLabel, session_date: newDate, is_current: false,
      stream_link: newStreamLink || null, replay_link: newReplayLink || null, description: newDesc || null,
    });
    setNewLabel(""); setNewDate(""); setNewStreamLink(""); setNewReplayLink(""); setNewDesc("");
    fetchSessions();
    setAdding(false);
  };

  const handleDeleteSession = async (id: string) => {
    if (!confirm("Delete this session and all its pitches?")) return;
    await supabase.from("shark_tank_sessions").delete().eq("id", id);
    fetchSessions();
  };

  const handleSetCurrent = async (id: string) => {
    await supabase.from("shark_tank_sessions").update({ is_current: true }).eq("id", id);
    fetchSessions();
  };

  const handleSelectSession = (s: STSession) => {
    setSelectedSession(s);
    fetchPitches(s.id);
    setView("pitches");
  };

  const handleAddShark = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingShark(true);
    await supabase.from("shark_tank_sharks").insert({
      display_name: sharkForm.display_name, title: sharkForm.title || null,
      avatar_url: sharkForm.avatar_url || null, bio: sharkForm.bio || null,
      twitter_handle: sharkForm.twitter_handle || null,
    });
    setSharkForm({ display_name: "", title: "", avatar_url: "", bio: "", twitter_handle: "" });
    setShowAddShark(false);
    fetchSharks();
    setAddingShark(false);
  };

  const handleDeleteShark = async (id: string) => {
    if (!confirm("Delete this shark?")) return;
    await supabase.from("shark_tank_sharks").delete().eq("id", id);
    fetchSharks();
  };

  const handleAddPitch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSession) return;
    setAddingPitch(true);
    await supabase.from("shark_tank_pitches").insert({
      session_id: selectedSession.id, builder_name: pitchForm.builder_name,
      builder_avatar_url: pitchForm.builder_avatar_url || null,
      builder_discord: pitchForm.builder_discord || null, builder_twitter: pitchForm.builder_twitter || null,
      project_name: pitchForm.project_name, description: pitchForm.description || null,
      demo_link: pitchForm.demo_link || null, pitch_deck_link: pitchForm.pitch_deck_link || null,
      funding_ask: pitchForm.funding_ask || null, status: "active",
    });
    setPitchForm({ builder_name: "", builder_avatar_url: "", builder_discord: "", builder_twitter: "", project_name: "", description: "", demo_link: "", pitch_deck_link: "", funding_ask: "" });
    setShowAddPitch(false);
    fetchPitches(selectedSession.id);
    setAddingPitch(false);
  };

  const handleDeletePitch = async (id: string) => {
    if (!confirm("Delete this pitch?")) return;
    await supabase.from("shark_tank_pitches").delete().eq("id", id);
    if (selectedSession) fetchPitches(selectedSession.id);
  };

  const handleToggleFunded = async (p: Pitch) => {
    const funded_amount = !p.is_funded ? prompt("Enter funded amount (e.g. $5,000):") : null;
    await supabase.from("shark_tank_pitches").update({ is_funded: !p.is_funded, funded_amount: funded_amount || null }).eq("id", p.id);
    if (selectedSession) fetchPitches(selectedSession.id);
  };

  const handleAddFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fbPitchId || !fbForm.shark_id) return;
    setAddingFb(true);
    await supabase.from("shark_tank_feedback").insert({
      pitch_id: fbPitchId, shark_id: fbForm.shark_id,
      feedback: fbForm.feedback || null, offer_amount: fbForm.offer_amount || null,
      offer_type: fbForm.offer_type || null,
    });
    setFbForm({ shark_id: "", feedback: "", offer_amount: "", offer_type: "" });
    setFbPitchId(null);
    if (selectedSession) fetchPitches(selectedSession.id);
    setAddingFb(false);
  };

  const handleDeleteFeedback = async (id: string) => {
    await supabase.from("shark_tank_feedback").delete().eq("id", id);
    if (selectedSession) fetchPitches(selectedSession.id);
  };

  const handleAppStatus = async (id: string, status: string) => {
    setUpdatingApp(id);
    await supabase.from("shark_tank_applications").update({ status }).eq("id", id);
    setApplications((prev) => prev.map((a) => a.id === id ? { ...a, status } : a));
    setUpdatingApp(null);
  };

  const handleDeleteApp = async (id: string) => {
    if (!confirm("Delete this application?")) return;
    setUpdatingApp(id);
    await supabase.from("shark_tank_applications").delete().eq("id", id);
    setApplications((prev) => prev.filter((a) => a.id !== id));
    setUpdatingApp(null);
  };

  const handleApproveApp = async () => {
    if (!approveModal || !approveSessionId) return;
    setApproving(true);
    const { app } = approveModal;
    await supabase.from("shark_tank_pitches").insert({
      session_id: approveSessionId, builder_name: app.display_name,
      builder_avatar_url: app.avatar_url || null, builder_discord: app.discord_handle,
      builder_twitter: app.twitter_handle || null, project_name: app.project_name,
      description: app.project_description || null, demo_link: app.demo_link || null,
      pitch_deck_link: app.pitch_deck_link || null, funding_ask: app.funding_ask || null,
      status: "active",
    });
    await supabase.from("shark_tank_applications").update({ status: "approved" }).eq("id", app.id);
    setApplications((prev) => prev.map((a) => a.id === app.id ? { ...a, status: "approved" } : a));
    setApproving(false);
    setApproveModal(null);
    setApproveSessionId("");
  };

  const filteredApps = appSearch
    ? applications.filter((a) => {
        const q = appSearch.toLowerCase();
        return a.display_name.toLowerCase().includes(q) || a.discord_handle.toLowerCase().includes(q) || a.project_name.toLowerCase().includes(q);
      })
    : applications;

  return (
    <>
    <div className="min-h-screen">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={view === "sessions" ? onBack : () => { setView("sessions"); setSelectedSession(null); }} className="text-muted-foreground hover:text-foreground transition-colors mr-1">
              <ChevronLeft size={20} />
            </button>
            <span className="font-display font-semibold text-foreground">
              🦈 Shark Tank Admin {view === "pitches" && selectedSession ? `— ${selectedSession.week_label}` : view === "sharks" ? "— Sharks" : view === "applications" ? "— Applications" : ""}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {view === "sessions" && (
              <>
                <Button variant="ghost" size="sm" onClick={() => { setView("sharks"); }} className="text-xs gap-1">🦈 Sharks</Button>
                <Button variant="ghost" size="sm" onClick={() => { setView("applications"); fetchApplications(); }} className="text-xs gap-1">
                  📋 Applications
                  {applications.filter((a) => a.status === "pending").length > 0 && (
                    <span className="bg-accent text-accent-foreground rounded-full text-xs w-4 h-4 flex items-center justify-center font-bold ml-1">
                      {applications.filter((a) => a.status === "pending").length}
                    </span>
                  )}
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Sessions View */}
        {view === "sessions" && (
          <div className="space-y-6">
            <div>
              <h2 className="font-display font-semibold text-xl text-foreground mb-1">Shark Tank Sessions</h2>
              <p className="text-muted-foreground text-sm">Manage weekly pitch sessions.</p>
            </div>

            <form onSubmit={handleAddSession} className="gradient-card border border-border rounded-xl p-5 space-y-4">
              <h3 className="font-display font-semibold text-foreground flex items-center gap-2"><Plus size={16} className="text-primary" /> New Session</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div><Label className="text-xs text-muted-foreground mb-1 block">Week Label *</Label><Input value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="Week 1" className="bg-input border-border" /></div>
                <div><Label className="text-xs text-muted-foreground mb-1 block">Session Date *</Label><Input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="bg-input border-border" /></div>
                <div><Label className="text-xs text-muted-foreground mb-1 block">Stream Link</Label><Input value={newStreamLink} onChange={(e) => setNewStreamLink(e.target.value)} placeholder="https://twitter.com/spaces/..." className="bg-input border-border" /></div>
                <div><Label className="text-xs text-muted-foreground mb-1 block">Replay Link</Label><Input value={newReplayLink} onChange={(e) => setNewReplayLink(e.target.value)} placeholder="https://youtube.com/..." className="bg-input border-border" /></div>
              </div>
              <div><Label className="text-xs text-muted-foreground mb-1 block">Description</Label><Textarea value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Session description..." rows={2} className="bg-input border-border resize-none" /></div>
              <Button type="submit" disabled={adding || !newLabel || !newDate} size="sm">{adding ? <Loader2 size={14} className="animate-spin mr-1" /> : null}Add Session</Button>
            </form>

            {loading ? <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary" size={28} /></div> : (
              <div className="space-y-3">
                {sessions.map((s) => (
                  <div key={s.id} className="gradient-card border border-border rounded-xl p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <CalendarDays size={16} className="text-primary shrink-0" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground text-sm truncate">{s.week_label}</span>
                          {s.is_current && <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full font-medium shrink-0">Current</span>}
                        </div>
                        <span className="text-xs text-muted-foreground">{new Date(s.session_date).toLocaleDateString()}</span>
                        <div className="flex gap-2 mt-0.5">
                          {s.stream_link && <span className="text-[10px] text-primary flex items-center gap-0.5"><Play size={8} />Stream</span>}
                          {s.replay_link && <span className="text-[10px] text-accent flex items-center gap-0.5"><Video size={8} />Replay</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {!s.is_current && <Button size="sm" variant="ghost" onClick={() => handleSetCurrent(s.id)} className="text-xs text-muted-foreground hover:text-primary h-8 px-2">Set Current</Button>}
                      <Button size="sm" variant="ghost" onClick={() => handleSelectSession(s)} className="text-xs text-primary h-8 px-2 gap-1">Manage Pitches</Button>
                      <button onClick={() => handleDeleteSession(s.id)} className="text-muted-foreground hover:text-destructive transition-colors p-1.5"><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))}
                {sessions.length === 0 && <p className="text-muted-foreground text-center py-8 text-sm">No sessions yet.</p>}
              </div>
            )}
          </div>
        )}

        {/* Pitches View */}
        {view === "pitches" && selectedSession && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display font-semibold text-xl text-foreground">Pitches</h2>
                <p className="text-muted-foreground text-sm">{pitches.length} pitches in this session</p>
              </div>
              <Button onClick={() => setShowAddPitch(!showAddPitch)} size="sm" className="gap-2"><Plus size={14} /> Add Pitch</Button>
            </div>

            {showAddPitch && (
              <form onSubmit={handleAddPitch} className="gradient-card border border-border rounded-xl p-5 space-y-4 animate-fade-in">
                <h3 className="font-display font-semibold text-foreground">New Pitch</h3>
                <div><Label className="text-xs text-muted-foreground mb-2 block">Builder Photo</Label>
                  <AvatarUpload value={pitchForm.builder_avatar_url} onChange={(url) => setPitchForm({ ...pitchForm, builder_avatar_url: url })} displayName={pitchForm.builder_name} /></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div><Label className="text-xs text-muted-foreground mb-1 block">Builder Name *</Label><Input value={pitchForm.builder_name} onChange={(e) => setPitchForm({ ...pitchForm, builder_name: e.target.value })} placeholder="John Doe" className="bg-input border-border" required /></div>
                  <div><Label className="text-xs text-muted-foreground mb-1 block">Project Name *</Label><Input value={pitchForm.project_name} onChange={(e) => setPitchForm({ ...pitchForm, project_name: e.target.value })} placeholder="My DeFi App" className="bg-input border-border" required /></div>
                  <div><Label className="text-xs text-muted-foreground mb-1 block">Discord</Label><Input value={pitchForm.builder_discord} onChange={(e) => setPitchForm({ ...pitchForm, builder_discord: e.target.value })} className="bg-input border-border" /></div>
                  <div><Label className="text-xs text-muted-foreground mb-1 block">Twitter</Label><Input value={pitchForm.builder_twitter} onChange={(e) => setPitchForm({ ...pitchForm, builder_twitter: e.target.value })} className="bg-input border-border" /></div>
                  <div><Label className="text-xs text-muted-foreground mb-1 block">Demo Link</Label><Input value={pitchForm.demo_link} onChange={(e) => setPitchForm({ ...pitchForm, demo_link: e.target.value })} className="bg-input border-border" /></div>
                  <div><Label className="text-xs text-muted-foreground mb-1 block">Pitch Deck Link</Label><Input value={pitchForm.pitch_deck_link} onChange={(e) => setPitchForm({ ...pitchForm, pitch_deck_link: e.target.value })} className="bg-input border-border" /></div>
                  <div><Label className="text-xs text-muted-foreground mb-1 block">Funding Ask</Label><Input value={pitchForm.funding_ask} onChange={(e) => setPitchForm({ ...pitchForm, funding_ask: e.target.value })} placeholder="$5,000" className="bg-input border-border" /></div>
                </div>
                <div><Label className="text-xs text-muted-foreground mb-1 block">Description</Label><Textarea value={pitchForm.description} onChange={(e) => setPitchForm({ ...pitchForm, description: e.target.value })} rows={3} className="bg-input border-border resize-none" /></div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={addingPitch} size="sm">{addingPitch ? <Loader2 size={14} className="animate-spin mr-1" /> : null}Add Pitch</Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setShowAddPitch(false)}>Cancel</Button>
                </div>
              </form>
            )}

            <div className="space-y-3">
              {pitches.map((p) => {
                const pFeedbacks = feedbacks.filter((fb) => fb.pitch_id === p.id);
                return (
                  <div key={p.id} className="gradient-card border border-border rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {p.builder_avatar_url ? <img src={p.builder_avatar_url} className="w-9 h-9 rounded-full object-cover border border-border shrink-0" /> :
                          <div className="w-9 h-9 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary text-xs font-semibold shrink-0">{p.builder_name.slice(0, 2).toUpperCase()}</div>}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm text-foreground">{p.project_name}</p>
                            {p.is_funded && <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full font-medium">Funded</span>}
                          </div>
                          <p className="text-xs text-muted-foreground">by {p.builder_name} {p.funding_ask && `• Asking: ${p.funding_ask}`}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button onClick={() => handleToggleFunded(p)} className="text-xs px-2 py-1 rounded border border-border hover:border-primary/40 text-muted-foreground hover:text-primary transition-colors">
                          <DollarSign size={12} className="inline" /> {p.is_funded ? "Unfund" : "Mark Funded"}
                        </button>
                        <button onClick={() => { setFbPitchId(p.id); setFbForm({ shark_id: sharks[0]?.id || "", feedback: "", offer_amount: "", offer_type: "" }); }}
                          className="text-xs px-2 py-1 rounded border border-border hover:border-accent/40 text-muted-foreground hover:text-accent transition-colors">
                          + Feedback
                        </button>
                        <button onClick={() => handleDeletePitch(p.id)} className="text-muted-foreground hover:text-destructive transition-colors p-1.5"><Trash2 size={14} /></button>
                      </div>
                    </div>
                    {/* Feedback list */}
                    {pFeedbacks.length > 0 && (
                      <div className="space-y-1 pl-12">
                        {pFeedbacks.map((fb) => {
                          const shark = sharks.find((s) => s.id === fb.shark_id);
                          return (
                            <div key={fb.id} className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 rounded px-3 py-1.5">
                              <span className="font-medium text-foreground">{shark?.display_name || "?"}</span>
                              {fb.feedback && <span>— {fb.feedback.slice(0, 60)}{fb.feedback.length > 60 ? "…" : ""}</span>}
                              {fb.offer_amount && <span className="text-primary ml-auto">{fb.offer_amount}</span>}
                              <button onClick={() => handleDeleteFeedback(fb.id)} className="text-destructive/60 hover:text-destructive ml-1"><X size={10} /></button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
              {pitches.length === 0 && <p className="text-muted-foreground text-center py-8 text-sm">No pitches yet.</p>}
            </div>
          </div>
        )}

        {/* Sharks View */}
        {view === "sharks" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display font-semibold text-xl text-foreground">Shark Panel</h2>
                <p className="text-muted-foreground text-sm">Manage judges and investors.</p>
              </div>
              <Button onClick={() => setShowAddShark(!showAddShark)} size="sm" className="gap-2"><Plus size={14} /> Add Shark</Button>
            </div>

            {showAddShark && (
              <form onSubmit={handleAddShark} className="gradient-card border border-border rounded-xl p-5 space-y-4 animate-fade-in">
                <h3 className="font-display font-semibold text-foreground">New Shark</h3>
                <div><Label className="text-xs text-muted-foreground mb-2 block">Photo</Label>
                  <AvatarUpload value={sharkForm.avatar_url} onChange={(url) => setSharkForm({ ...sharkForm, avatar_url: url })} displayName={sharkForm.display_name} /></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div><Label className="text-xs text-muted-foreground mb-1 block">Name *</Label><Input value={sharkForm.display_name} onChange={(e) => setSharkForm({ ...sharkForm, display_name: e.target.value })} className="bg-input border-border" required /></div>
                  <div><Label className="text-xs text-muted-foreground mb-1 block">Title</Label><Input value={sharkForm.title} onChange={(e) => setSharkForm({ ...sharkForm, title: e.target.value })} placeholder="Angel Investor" className="bg-input border-border" /></div>
                  <div><Label className="text-xs text-muted-foreground mb-1 block">Twitter</Label><Input value={sharkForm.twitter_handle} onChange={(e) => setSharkForm({ ...sharkForm, twitter_handle: e.target.value })} className="bg-input border-border" /></div>
                </div>
                <div><Label className="text-xs text-muted-foreground mb-1 block">Bio</Label><Textarea value={sharkForm.bio} onChange={(e) => setSharkForm({ ...sharkForm, bio: e.target.value })} rows={2} className="bg-input border-border resize-none" /></div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={addingShark} size="sm">{addingShark ? <Loader2 size={14} className="animate-spin mr-1" /> : null}Add Shark</Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setShowAddShark(false)}>Cancel</Button>
                </div>
              </form>
            )}

            <div className="space-y-3">
              {sharks.map((s) => (
                <div key={s.id} className="gradient-card border border-border rounded-xl p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {s.avatar_url ? <img src={s.avatar_url} className="w-9 h-9 rounded-full object-cover border border-border shrink-0" /> :
                      <div className="w-9 h-9 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center text-accent text-xs font-semibold shrink-0">🦈</div>}
                    <div className="min-w-0">
                      <p className="font-medium text-sm text-foreground">{s.display_name}</p>
                      <p className="text-xs text-muted-foreground truncate">{s.title || "Shark"}</p>
                    </div>
                  </div>
                  <button onClick={() => handleDeleteShark(s.id)} className="text-muted-foreground hover:text-destructive transition-colors p-1.5"><Trash2 size={14} /></button>
                </div>
              ))}
              {sharks.length === 0 && <p className="text-muted-foreground text-center py-8 text-sm">No sharks yet.</p>}
            </div>
          </div>
        )}

        {/* Applications View */}
        {view === "applications" && (
          <div className="space-y-6">
            <div>
              <h2 className="font-display font-semibold text-xl text-foreground mb-1">Pitch Applications</h2>
              <p className="text-muted-foreground text-sm">Review pitch applications from builders.</p>
            </div>
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <Input value={appSearch} onChange={(e) => setAppSearch(e.target.value)} placeholder="Search applications…" className="pl-9 bg-input border-border" />
            </div>
            {appsLoading ? <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary" size={28} /></div> :
              filteredApps.length === 0 ? <p className="text-center text-muted-foreground py-12 text-sm">{appSearch ? "No matches." : "No applications yet."}</p> : (
              <div className="space-y-3">
                {filteredApps.map((app) => (
                  <div key={app.id} className="gradient-card border border-border rounded-xl p-5 space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 min-w-0">
                        {app.avatar_url ? <img src={app.avatar_url} className="w-10 h-10 rounded-full object-cover border border-border shrink-0 mt-0.5" /> :
                          <div className="w-10 h-10 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center text-accent text-xs font-semibold shrink-0 mt-0.5">{app.display_name.slice(0, 2).toUpperCase()}</div>}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-foreground text-sm">{app.display_name}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${app.status === "pending" ? "bg-yellow-500/15 text-yellow-400 border border-yellow-500/20" : app.status === "approved" ? "bg-primary/15 text-primary border border-primary/20" : "bg-destructive/15 text-destructive border border-destructive/20"}`}>
                              {app.status === "pending" && <Clock size={10} className="inline mr-1" />}
                              {app.status === "approved" && <CheckCircle2 size={10} className="inline mr-1" />}
                              {app.status === "rejected" && <XCircle size={10} className="inline mr-1" />}
                              {app.status}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-xs text-muted-foreground">
                            <span>dc: {app.discord_handle}</span>
                            {app.twitter_handle && <span>{app.twitter_handle}</span>}
                          </div>
                          <p className="text-xs text-foreground mt-1.5 font-medium">{app.project_name}</p>
                          {app.project_description && <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{app.project_description}</p>}
                          {app.funding_ask && <p className="text-xs text-primary mt-0.5">Asking: {app.funding_ask}</p>}
                          {app.funding_purpose && <p className="text-xs text-muted-foreground mt-0.5">Purpose: {app.funding_purpose}</p>}
                        </div>
                      </div>
                      <div className="flex gap-1.5 shrink-0 flex-col items-end">
                        {app.status !== "approved" && (
                          <button onClick={() => { setApproveModal({ app }); setApproveSessionId(sessions[0]?.id ?? ""); }} disabled={updatingApp === app.id}
                            className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-primary/15 text-primary hover:bg-primary/25 border border-primary/20 transition-colors font-medium">
                            <CheckCircle2 size={11} /> Approve & Add
                          </button>
                        )}
                        {app.status !== "rejected" && (
                          <button onClick={() => handleAppStatus(app.id, "rejected")} disabled={updatingApp === app.id}
                            className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/20 transition-colors font-medium">
                            {updatingApp === app.id ? <Loader2 size={11} className="animate-spin" /> : <XCircle size={11} />} Reject
                          </button>
                        )}
                        <button onClick={() => handleDeleteApp(app.id)} disabled={updatingApp === app.id}
                          className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/25 border border-destructive/20 transition-colors font-medium">
                          {updatingApp === app.id ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={11} />} Delete
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground/60">Submitted {new Date(app.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>

    {/* Feedback Modal */}
    {fbPitchId && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
        <form onSubmit={handleAddFeedback} className="gradient-card border border-border rounded-2xl p-6 w-full max-w-sm shadow-2xl space-y-4">
          <h3 className="font-display font-semibold text-foreground text-lg">Add Shark Feedback</h3>
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">Shark *</Label>
            <select value={fbForm.shark_id} onChange={(e) => setFbForm({ ...fbForm, shark_id: e.target.value })}
              className="w-full h-9 rounded-md border border-input bg-input px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
              {sharks.map((s) => <option key={s.id} value={s.id}>{s.display_name}</option>)}
            </select>
          </div>
          <div><Label className="text-xs text-muted-foreground mb-1 block">Feedback</Label><Textarea value={fbForm.feedback} onChange={(e) => setFbForm({ ...fbForm, feedback: e.target.value })} rows={3} className="bg-input border-border resize-none" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs text-muted-foreground mb-1 block">Offer Amount</Label><Input value={fbForm.offer_amount} onChange={(e) => setFbForm({ ...fbForm, offer_amount: e.target.value })} placeholder="$5,000" className="bg-input border-border" /></div>
            <div><Label className="text-xs text-muted-foreground mb-1 block">Offer Type</Label><Input value={fbForm.offer_type} onChange={(e) => setFbForm({ ...fbForm, offer_type: e.target.value })} placeholder="Equity, Grant…" className="bg-input border-border" /></div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="ghost" size="sm" onClick={() => setFbPitchId(null)}>Cancel</Button>
            <Button type="submit" size="sm" disabled={addingFb || !fbForm.shark_id}>{addingFb ? <Loader2 size={13} className="animate-spin mr-1" /> : null}Add Feedback</Button>
          </div>
        </form>
      </div>
    )}

    {/* Approve Modal */}
    {approveModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
        <div className="gradient-card border border-border rounded-2xl p-6 w-full max-w-sm shadow-2xl space-y-5">
          <div>
            <h3 className="font-display font-semibold text-foreground text-lg">Approve & Add as Pitch</h3>
            <p className="text-muted-foreground text-xs mt-1">Select the session to add <span className="font-medium text-foreground">{approveModal.app.display_name}</span>'s pitch.</p>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border">
            {approveModal.app.avatar_url ? <img src={approveModal.app.avatar_url} className="w-10 h-10 rounded-full object-cover border border-border shrink-0" /> :
              <div className="w-10 h-10 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center text-accent text-xs font-semibold shrink-0">{approveModal.app.display_name.slice(0, 2).toUpperCase()}</div>}
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">{approveModal.app.display_name}</p>
              <p className="text-xs text-muted-foreground truncate">{approveModal.app.project_name}</p>
              {approveModal.app.funding_ask && <p className="text-xs text-primary">Asking: {approveModal.app.funding_ask}</p>}
            </div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">Select Session *</Label>
            {sessions.length === 0 ? <p className="text-xs text-destructive">No sessions found.</p> : (
              <select value={approveSessionId} onChange={(e) => setApproveSessionId(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-input px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                {sessions.map((s) => <option key={s.id} value={s.id}>{s.week_label} ({new Date(s.session_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}){s.is_current ? " — Current" : ""}</option>)}
              </select>
            )}
          </div>
          <div className="flex gap-2 justify-end pt-1">
            <Button variant="ghost" size="sm" onClick={() => { setApproveModal(null); setApproveSessionId(""); }} disabled={approving}>Cancel</Button>
            <Button size="sm" onClick={handleApproveApp} disabled={approving || !approveSessionId || sessions.length === 0}>
              {approving ? <><Loader2 size={13} className="animate-spin mr-1" /> Adding…</> : "Approve & Add"}
            </Button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
