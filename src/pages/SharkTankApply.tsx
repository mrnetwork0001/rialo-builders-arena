import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import rialoLogo from "@/assets/rialo-builders-arena-logo.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";
import { Settings, CheckCircle2, Loader2, Camera, X, User } from "lucide-react";
import { z } from "zod";

const schema = z.object({
  display_name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  discord_handle: z.string().trim().min(2, "Discord handle required").max(50),
  twitter_handle: z.string().trim().max(50).optional(),
  project_name: z.string().trim().min(2, "Project name required").max(150),
  project_description: z.string().trim().max(1000).optional(),
  demo_link: z.string().trim().url("Must be a valid URL").optional().or(z.literal("")),
  pitch_deck_link: z.string().trim().url("Must be a valid URL").optional().or(z.literal("")),
  funding_ask: z.string().trim().max(100).optional(),
  funding_purpose: z.string().trim().max(500).optional(),
});

export default function SharkTankApply() {
  const { isAdmin } = useAuth();
  const [form, setForm] = useState({
    display_name: "",
    discord_handle: "",
    twitter_handle: "",
    project_name: "",
    project_description: "",
    demo_link: "",
    pitch_deck_link: "",
    funding_ask: "",
    funding_purpose: "",
  });
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarPreview, setAvatarPreview] = useState("");
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const set = (key: string, val: string) => {
    setForm((f) => ({ ...f, [key]: val }));
    if (errors[key]) setErrors((e) => { const n = { ...e }; delete n[key]; return n; });
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setErrors((err) => ({ ...err, avatar: "Image must be under 5MB" }));
      return;
    }
    setAvatarUploading(true);
    setErrors((err) => { const n = { ...err }; delete n.avatar; return n; });
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    const ext = file.name.split(".").pop();
    const path = `applicants/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (error) {
      setErrors((err) => ({ ...err, avatar: "Upload failed. Please try again." }));
      setAvatarPreview("");
    } else {
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      setAvatarUrl(data.publicUrl);
    }
    setAvatarUploading(false);
  };

  const removeAvatar = () => {
    setAvatarUrl("");
    setAvatarPreview("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = schema.safeParse(form);
    if (!result.success) {
      const errs: Record<string, string> = {};
      for (const issue of result.error.issues) errs[issue.path[0] as string] = issue.message;
      setErrors(errs);
      return;
    }
    setSubmitting(true);
    const { error } = await (supabase as any).from("shark_tank_applications").insert({
      display_name: form.display_name,
      discord_handle: form.discord_handle,
      twitter_handle: form.twitter_handle || null,
      project_name: form.project_name,
      project_description: form.project_description || null,
      demo_link: form.demo_link || null,
      pitch_deck_link: form.pitch_deck_link || null,
      funding_ask: form.funding_ask || null,
      funding_purpose: form.funding_purpose || null,
      avatar_url: avatarUrl || null,
    });
    setSubmitting(false);
    if (!error) {
      setSubmitted(true);
    } else {
      setErrors({ _: "Failed to submit. Please try again." });
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border bg-card/30 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-28 flex items-center justify-between">
          <Link to="/">
            <img src={rialoLogo} alt="Rialo Builders Arena" className="h-24 w-auto cursor-pointer" />
          </Link>
          <nav className="flex items-center gap-1">
            <Link to="/">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground hover:bg-nav-hover text-sm font-medium">Builder's Hub</Button>
            </Link>
            <Link to="/shark-tank">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground hover:bg-nav-hover text-sm font-medium">Shark Tank</Button>
            </Link>
            <Button variant="default" size="sm" className="text-sm font-medium">Pitch Application</Button>
            {isAdmin && (
              <Link to="/admin">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground hover:bg-nav-hover gap-2 text-xs">
                  <Settings size={14} /> Admin
                </Button>
              </Link>
            )}
            <ThemeToggle />
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-16">
        {submitted ? (
          <div className="text-center py-24 flex flex-col items-center gap-4 animate-fade-in">
            <CheckCircle2 size={56} className="text-primary" />
            <h1 className="font-display font-bold text-2xl text-foreground">Pitch Application Submitted!</h1>
            <p className="text-muted-foreground max-w-sm">
              Thanks for applying to pitch! The Rialo team will review your application and get back to you via Discord.
            </p>
            <Link to="/shark-tank">
              <Button variant="ghost" className="mt-2">Back to Shark Tank</Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-10 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-accent/30 bg-accent/10 text-accent text-xs font-medium mb-5">
                <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                Pitch Applications Open
              </div>
              <h1 className="font-display font-bold text-3xl md:text-4xl text-foreground mb-3">Apply to Pitch</h1>
              <p className="text-muted-foreground">
                Got a project that needs funding or mentorship? Submit your pitch and get in front of community sharks.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="gradient-card border border-border rounded-2xl p-8 space-y-5">
              {/* Avatar */}
              <div className="flex flex-col items-center gap-3 pb-2">
                <div className="relative group">
                  <div
                    onClick={() => !avatarUploading && fileInputRef.current?.click()}
                    className={`w-24 h-24 rounded-full border-2 border-dashed flex items-center justify-center cursor-pointer transition-colors overflow-hidden
                      ${avatarPreview ? "border-accent" : "border-border hover:border-accent/60 bg-muted/40"}`}
                  >
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : avatarUploading ? (
                      <Loader2 size={22} className="animate-spin text-muted-foreground" />
                    ) : (
                      <div className="flex flex-col items-center gap-1 text-muted-foreground">
                        <User size={22} />
                        <Camera size={14} />
                      </div>
                    )}
                  </div>
                  {avatarPreview && !avatarUploading && (
                    <button type="button" onClick={removeAvatar} className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center">
                      <X size={11} />
                    </button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{avatarUploading ? "Uploading…" : "Profile picture (optional, max 5MB)"}</p>
                {errors.avatar && <p className="text-xs text-destructive">{errors.avatar}</p>}
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Full Name *</Label>
                  <Input value={form.display_name} onChange={(e) => set("display_name", e.target.value)} placeholder="John Doe" className="bg-input border-border" />
                  {errors.display_name && <p className="text-xs text-destructive mt-1">{errors.display_name}</p>}
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Discord Handle *</Label>
                  <Input value={form.discord_handle} onChange={(e) => set("discord_handle", e.target.value)} placeholder="johndoe" className="bg-input border-border" />
                  {errors.discord_handle && <p className="text-xs text-destructive mt-1">{errors.discord_handle}</p>}
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Twitter / X Handle</Label>
                  <Input value={form.twitter_handle} onChange={(e) => set("twitter_handle", e.target.value)} placeholder="@johndoe" className="bg-input border-border" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Project Name *</Label>
                  <Input value={form.project_name} onChange={(e) => set("project_name", e.target.value)} placeholder="My DeFi Protocol" className="bg-input border-border" />
                  {errors.project_name && <p className="text-xs text-destructive mt-1">{errors.project_name}</p>}
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Demo Link</Label>
                  <Input value={form.demo_link} onChange={(e) => set("demo_link", e.target.value)} placeholder="https://myproject.com" className="bg-input border-border" />
                  {errors.demo_link && <p className="text-xs text-destructive mt-1">{errors.demo_link}</p>}
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Pitch Deck Link</Label>
                  <Input value={form.pitch_deck_link} onChange={(e) => set("pitch_deck_link", e.target.value)} placeholder="https://docs.google.com/..." className="bg-input border-border" />
                  {errors.pitch_deck_link && <p className="text-xs text-destructive mt-1">{errors.pitch_deck_link}</p>}
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Funding Ask</Label>
                  <Input value={form.funding_ask} onChange={(e) => set("funding_ask", e.target.value)} placeholder="$5,000 or 2 ETH" className="bg-input border-border" />
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Project Description</Label>
                <Textarea value={form.project_description} onChange={(e) => set("project_description", e.target.value)} placeholder="What are you building? What problem does it solve?" rows={3} className="bg-input border-border resize-none" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">What will the funding be used for?</Label>
                <Textarea value={form.funding_purpose} onChange={(e) => set("funding_purpose", e.target.value)} placeholder="Development, marketing, audits…" rows={2} className="bg-input border-border resize-none" />
              </div>
              {errors._ && <p className="text-xs text-destructive">{errors._}</p>}
              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? <><Loader2 size={15} className="animate-spin mr-2" /> Submitting…</> : "Submit Pitch Application"}
              </Button>
            </form>
          </>
        )}
      </main>

      <footer className="border-t border-border py-6 px-4 text-center">
        <p className="text-muted-foreground text-sm">
          Built by{" "}
          <a href="https://x.com/encrypt_wizard" target="_blank" rel="noopener noreferrer" className="text-primary font-medium hover:underline">MrNetwork</a>
        </p>
      </footer>
    </div>
  );
}
