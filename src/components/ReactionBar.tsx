import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

const EMOJIS = ["👏", "🔥", "💡"] as const;
type Emoji = (typeof EMOJIS)[number];

function getVisitorKey(): string {
  let key = localStorage.getItem("rialo_visitor_key");
  if (!key) {
    key = crypto.randomUUID();
    localStorage.setItem("rialo_visitor_key", key);
  }
  return key;
}

interface ReactionCounts {
  "👏": number;
  "🔥": number;
  "💡": number;
}

interface Props {
  participantId: string;
}

export function ReactionBar({ participantId }: Props) {
  const [counts, setCounts] = useState<ReactionCounts>({ "👏": 0, "🔥": 0, "💡": 0 });
  const [myReactions, setMyReactions] = useState<Set<Emoji>>(new Set());
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<Emoji | null>(null);

  const fetchReactions = useCallback(async () => {
    const visitorKey = getVisitorKey();
    const { data } = await (supabase as any)
      .from("reactions")
      .select("emoji, visitor_key")
      .eq("participant_id", participantId);

    if (!data) return;

    const newCounts: ReactionCounts = { "👏": 0, "🔥": 0, "💡": 0 };
    const mine = new Set<Emoji>();
    for (const row of data) {
      if (EMOJIS.includes(row.emoji)) {
        newCounts[row.emoji as Emoji] = (newCounts[row.emoji as Emoji] || 0) + 1;
        if (row.visitor_key === visitorKey) mine.add(row.emoji as Emoji);
      }
    }
    setCounts(newCounts);
    setMyReactions(mine);
    setLoading(false);
  }, [participantId]);

  useEffect(() => {
    fetchReactions();
  }, [fetchReactions]);

  const toggle = async (emoji: Emoji) => {
    if (toggling) return;
    setToggling(emoji);
    const visitorKey = getVisitorKey();
    const alreadyReacted = myReactions.has(emoji);

    // Optimistic update
    setCounts((prev) => ({
      ...prev,
      [emoji]: Math.max(0, prev[emoji] + (alreadyReacted ? -1 : 1)),
    }));
    setMyReactions((prev) => {
      const next = new Set(prev);
      alreadyReacted ? next.delete(emoji) : next.add(emoji);
      return next;
    });

    if (alreadyReacted) {
      await (supabase as any)
        .from("reactions")
        .delete()
        .eq("participant_id", participantId)
        .eq("emoji", emoji)
        .eq("visitor_key", visitorKey);
    } else {
      await (supabase as any)
        .from("reactions")
        .insert({ participant_id: participantId, emoji, visitor_key: visitorKey });
    }

    setToggling(null);
  };

  if (loading) {
    return (
      <div className="flex gap-1.5 pt-2 border-t border-border">
        {EMOJIS.map((e) => (
          <div key={e} className="h-7 w-14 rounded-lg bg-secondary animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-1.5 pt-2 border-t border-border">
      {EMOJIS.map((emoji) => {
        const reacted = myReactions.has(emoji);
        return (
          <button
            key={emoji}
            onClick={() => toggle(emoji)}
            disabled={toggling === emoji}
            className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg transition-all font-medium select-none
              ${reacted
                ? "bg-primary/25 border border-primary/50 text-foreground scale-105"
                : "bg-secondary hover:bg-primary/10 border border-transparent text-muted-foreground hover:text-foreground"
              }`}
            title={reacted ? `Remove ${emoji} reaction` : `React with ${emoji}`}
          >
            <span>{emoji}</span>
            {counts[emoji] > 0 && (
              <span className={reacted ? "text-primary" : ""}>{counts[emoji]}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
