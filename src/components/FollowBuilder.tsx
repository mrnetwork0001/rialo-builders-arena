import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Bell, BellOff, Loader2, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { z } from "zod";

interface Props {
  discordHandle: string;
}

function getSubscribedEmail(handle: string): string | null {
  try {
    const map = JSON.parse(localStorage.getItem("rialo_follows") || "{}");
    return map[handle] || null;
  } catch { return null; }
}

function setSubscribedEmail(handle: string, email: string | null) {
  try {
    const map = JSON.parse(localStorage.getItem("rialo_follows") || "{}");
    if (email) map[handle] = email;
    else delete map[handle];
    localStorage.setItem("rialo_follows", JSON.stringify(map));
  } catch {}
}

export function FollowBuilder({ discordHandle }: Props) {
  const [followerCount, setFollowerCount] = useState(0);
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [subscribedEmail, setSubscribedEmailState] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const stored = getSubscribedEmail(discordHandle);
    setSubscribedEmailState(stored);
    fetchCount();
  }, [discordHandle]);

  const fetchCount = async () => {
    const { count } = await (supabase as any)
      .from("builder_followers")
      .select("id", { count: "exact", head: true })
      .eq("discord_handle", discordHandle);
    setFollowerCount(count || 0);
  };

  const handleSubscribe = async () => {
    const result = z.string().trim().email().safeParse(email);
    if (!result.success) {
      setEmailError("Enter a valid email address");
      return;
    }
    setEmailError("");
    setLoading(true);
    const { error } = await (supabase as any).from("builder_followers").insert({
      discord_handle: discordHandle,
      email: result.data,
    });
    setLoading(false);
    if (!error) {
      setSubscribedEmailState(result.data);
      setSubscribedEmail(discordHandle, result.data);
      setFollowerCount((c) => c + 1);
      setShowForm(false);
      setEmail("");
    } else if (error.code === "23505") {
      // already subscribed
      setSubscribedEmailState(result.data);
      setSubscribedEmail(discordHandle, result.data);
      setShowForm(false);
    } else {
      setEmailError("Failed to subscribe. Try again.");
    }
  };

  const handleUnsubscribe = async () => {
    if (!subscribedEmail) return;
    setLoading(true);
    await (supabase as any)
      .from("builder_followers")
      .delete()
      .eq("discord_handle", discordHandle)
      .eq("email", subscribedEmail);
    setLoading(false);
    setSubscribedEmailState(null);
    setSubscribedEmail(discordHandle, null);
    setFollowerCount((c) => Math.max(0, c - 1));
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Users size={13} className="text-primary" />
          <span>
            <span className="text-foreground font-semibold">{followerCount}</span>{" "}
            follower{followerCount !== 1 ? "s" : ""}
          </span>
        </div>

        {subscribedEmail ? (
          <button
            onClick={handleUnsubscribe}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-primary/15 border border-primary/30 text-primary hover:bg-destructive/15 hover:text-destructive hover:border-destructive/30 transition-all font-medium"
          >
            {loading ? <Loader2 size={12} className="animate-spin" /> : <BellOff size={12} />}
            Following
          </button>
        ) : (
          <button
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-secondary hover:bg-primary/20 hover:text-primary border border-transparent hover:border-primary/30 text-muted-foreground transition-all font-medium"
          >
            <Bell size={12} />
            Follow
          </button>
        )}
      </div>

      {showForm && !subscribedEmail && (
        <div className="flex gap-2 animate-fade-in">
          <div className="flex-1 min-w-0">
            <Input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setEmailError(""); }}
              placeholder="your@email.com"
              className="bg-input border-border h-8 text-xs"
              onKeyDown={(e) => e.key === "Enter" && handleSubscribe()}
            />
            {emailError && <p className="text-xs text-destructive mt-0.5">{emailError}</p>}
          </div>
          <Button
            size="sm"
            onClick={handleSubscribe}
            disabled={loading}
            className="h-8 px-3 text-xs bg-primary text-primary-foreground hover:bg-primary/90 shrink-0"
          >
            {loading ? <Loader2 size={12} className="animate-spin" /> : "Notify me"}
          </Button>
        </div>
      )}
    </div>
  );
}
