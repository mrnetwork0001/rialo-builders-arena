import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Bell, BellOff, Loader2, Users } from "lucide-react";

interface Props {
  discordHandle: string;
}

function getVisitorKey(): string {
  try {
    let key = localStorage.getItem("rialo_visitor_key");
    if (!key) {
      key = crypto.randomUUID();
      localStorage.setItem("rialo_visitor_key", key);
    }
    return key;
  } catch {
    return crypto.randomUUID();
  }
}

function isFollowing(handle: string): boolean {
  try {
    const map = JSON.parse(localStorage.getItem("rialo_follows") || "{}");
    return !!map[handle];
  } catch { return false; }
}

function setFollowingLocal(handle: string, value: boolean) {
  try {
    const map = JSON.parse(localStorage.getItem("rialo_follows") || "{}");
    if (value) map[handle] = true;
    else delete map[handle];
    localStorage.setItem("rialo_follows", JSON.stringify(map));
  } catch {}
}

export function FollowBuilder({ discordHandle }: Props) {
  const [followerCount, setFollowerCount] = useState(0);
  const [followed, setFollowed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setFollowed(isFollowing(discordHandle));
    fetchCount();
  }, [discordHandle]);

  const fetchCount = async () => {
    const { count } = await (supabase as any)
      .from("builder_followers")
      .select("id", { count: "exact", head: true })
      .eq("discord_handle", discordHandle);
    setFollowerCount(count || 0);
  };

  const handleFollow = async () => {
    const visitorKey = getVisitorKey();
    setLoading(true);
    const { error } = await (supabase as any).from("builder_followers").insert({
      discord_handle: discordHandle,
      visitor_key: visitorKey,
      email: null,
    });
    setLoading(false);
    if (!error || error.code === "23505") {
      setFollowed(true);
      setFollowingLocal(discordHandle, true);
      if (!error) setFollowerCount((c) => c + 1);
    }
  };

  const handleUnfollow = async () => {
    const visitorKey = getVisitorKey();
    setLoading(true);
    await (supabase as any)
      .from("builder_followers")
      .delete()
      .eq("discord_handle", discordHandle)
      .eq("visitor_key", visitorKey);
    setLoading(false);
    setFollowed(false);
    setFollowingLocal(discordHandle, false);
    setFollowerCount((c) => Math.max(0, c - 1));
  };

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Users size={13} className="text-primary" />
        <span>
          <span className="text-foreground font-semibold">{followerCount}</span>{" "}
          follower{followerCount !== 1 ? "s" : ""}
        </span>
      </div>

      {followed ? (
        <button
          onClick={handleUnfollow}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-primary/15 border border-primary/30 text-primary hover:bg-destructive/15 hover:text-destructive hover:border-destructive/30 transition-all font-medium"
        >
          {loading ? <Loader2 size={12} className="animate-spin" /> : <BellOff size={12} />}
          Following
        </button>
      ) : (
        <button
          onClick={handleFollow}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-secondary hover:bg-primary/20 hover:text-primary border border-transparent hover:border-primary/30 text-muted-foreground transition-all font-medium"
        >
          {loading ? <Loader2 size={12} className="animate-spin" /> : <Bell size={12} />}
          Follow
        </button>
      )}
    </div>
  );
}
