import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import rialoLogo from "@/assets/rialo-builders-arena-logo.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";
import { Settings, CheckCircle2, Loader2 } from "lucide-react";
import { z } from "zod";

const schema = z.object({
  display_name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  discord_handle: z.string().trim().min(2, "Discord handle required").max(50),
  email: z.string().trim().email("Invalid email address"),
  twitter_handle: z.string().trim().max(50).optional(),
  project_title: z.string().trim().max(150).optional(),
  project_description: z.string().trim().max(1000).optional(),
  project_link: z.string().trim().url("Must be a valid URL").optional().or(z.literal("")),
});

export default function ApplyPage() {
  const { isAdmin } = useAuth();
  const [form, setForm] = useState({
    display_name: "",
    discord_handle: "",
    email: "",
    twitter_handle: "",
    project_title: "",
    project_description: "",
    project_link: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const set = (key: string, val: string) => {
    setForm((f) => ({ ...f, [key]: val }));
    if (errors[key]) setErrors((e) => { const n = { ...e }; delete n[key]; return n; });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = schema.safeParse(form);
    if (!result.success) {
      const errs: Record<string, string> = {};
      for (const issue of result.error.issues) {
        errs[issue.path[0] as string] = issue.message;
      }
      setErrors(errs);
      return;
    }
    setSubmitting(true);
    const { error } = await (supabase as any).from("session_applications").insert({
      display_name: form.display_name,
      discord_handle: form.discord_handle,
      email: form.email,
      twitter_handle: form.twitter_handle || null,
      project_title: form.project_title || null,
      project_description: form.project_description || null,
      project_link: form.project_link || null,
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
            <Button variant="default" size="sm" className="text-sm font-medium">Apply</Button>
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
            <h1 className="font-display font-bold text-2xl text-foreground">Application Submitted!</h1>
            <p className="text-muted-foreground max-w-sm">
              Thanks for applying! The Rialo team will review your application and get back to you via Discord or email.
            </p>
            <Link to="/">
              <Button variant="ghost" className="mt-2">Back to Builder's Hub</Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-10 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-medium mb-5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                Open Applications
              </div>
              <h1 className="font-display font-bold text-3xl md:text-4xl text-foreground mb-3">Apply to Builder's Hub</h1>
              <p className="text-muted-foreground">
                Want to showcase your project? Fill in the form and the Rialo team will reach out to confirm your spot.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="gradient-card border border-border rounded-2xl p-8 space-y-5">
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
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Email *</Label>
                  <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="you@example.com" className="bg-input border-border" />
                  {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Twitter / X Handle</Label>
                  <Input value={form.twitter_handle} onChange={(e) => set("twitter_handle", e.target.value)} placeholder="@johndoe" className="bg-input border-border" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Project Title</Label>
                  <Input value={form.project_title} onChange={(e) => set("project_title", e.target.value)} placeholder="My Awesome App" className="bg-input border-border" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Project Link</Label>
                  <Input value={form.project_link} onChange={(e) => set("project_link", e.target.value)} placeholder="https://myproject.com" className="bg-input border-border" />
                  {errors.project_link && <p className="text-xs text-destructive mt-1">{errors.project_link}</p>}
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Tell us about your project</Label>
                <Textarea value={form.project_description} onChange={(e) => set("project_description", e.target.value)} placeholder="What are you building? What problem does it solve?" rows={4} className="bg-input border-border resize-none" />
              </div>
              {errors._ && <p className="text-xs text-destructive">{errors._}</p>}
              <Button type="submit" disabled={submitting} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                {submitting ? <><Loader2 size={15} className="animate-spin mr-2" /> Submitting…</> : "Submit Application"}
              </Button>
            </form>
          </>
        )}
      </main>

      <footer className="border-t border-border py-6 px-4 text-center">
        <p className="text-muted-foreground text-sm">
          Built by{" "}
          <a href="https://x.com/encrypt_wizard" target="_blank" rel="noopener noreferrer" className="text-primary font-medium hover:underline">
            MrNetwork
          </a>
        </p>
      </footer>
    </div>
  );
}
