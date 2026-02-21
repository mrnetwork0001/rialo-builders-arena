import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import confetti from "canvas-confetti";

const EMOJIS = ["🔥", "💰", "🚀", "👏"] as const;
type Emoji = (typeof EMOJIS)[number];

function getVisitorKey(): string {
  let key = localStorage.getItem("visitor_key");
  if (!key) {
    key = crypto.randomUUID();
    localStorage.setItem("visitor_key", key);
  }
  return key;
}

interface VoteCounts { "🔥": number; "💰": number; "🚀": number; "👏": number; }

export function PitchVoteBar({ pitchId }: { pitchId: string }) {
  const [counts, setCounts] = useState<VoteCounts>({ "🔥": 0, "💰": 0, "🚀": 0, "👏": 0 });
  const [myVote, setMyVote] = useState<Emoji | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchVotes = async () => {
    const { data } = await supabase
      .from("shark_tank_votes")
      .select("emoji, visitor_key")
      .eq("pitch_id", pitchId);
    if (data) {
      const c: VoteCounts = { "🔥": 0, "💰": 0, "🚀": 0, "👏": 0 };
      const vk = getVisitorKey();
      let mine: Emoji | null = null;
      for (const r of data) {
        if (r.emoji in c) c[r.emoji as Emoji]++;
        if (r.visitor_key === vk) mine = r.emoji as Emoji;
      }
      setCounts(c);
      setMyVote(mine);
    }
    setLoading(false);
  };

  useEffect(() => { fetchVotes(); }, [pitchId]);

  const toggle = async (emoji: Emoji) => {
    const vk = getVisitorKey();
    if (myVote) {
      setCounts((c) => ({ ...c, [myVote]: Math.max(0, c[myVote] - 1) }));
      await supabase.from("shark_tank_votes").delete().eq("pitch_id", pitchId).eq("visitor_key", vk);
    }
    if (myVote === emoji) {
      setMyVote(null);
      return;
    }
    setCounts((c) => ({ ...c, [emoji]: c[emoji] + 1 }));
    setMyVote(emoji);
    await supabase.from("shark_tank_votes").insert({ pitch_id: pitchId, visitor_key: vk, emoji });
    confetti({ particleCount: 30, spread: 50, origin: { y: 0.8 }, colors: ["#00e5b0", "#7c3aed", "#fbbf24"] });
  };

  if (loading) return <div className="flex gap-2">{EMOJIS.map((e) => <div key={e} className="h-8 w-14 rounded-full bg-muted animate-pulse" />)}</div>;

  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {EMOJIS.map((emoji) => (
        <button
          key={emoji}
          onClick={() => toggle(emoji)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all
            ${myVote === emoji
              ? "bg-primary/20 border border-primary/50 text-primary scale-105"
              : "bg-muted/60 border border-border hover:border-primary/30 text-muted-foreground hover:text-foreground"
            }`}
        >
          <span className="text-sm">{emoji}</span>
          <span>{counts[emoji]}</span>
        </button>
      ))}
      {total > 0 && <span className="text-[10px] text-muted-foreground ml-1">{total} votes</span>}
    </div>
  );
}
