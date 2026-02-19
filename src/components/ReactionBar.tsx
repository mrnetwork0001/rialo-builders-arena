import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import confetti from "canvas-confetti";

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
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({});

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
    const prevReaction = EMOJIS.find((e) => myReactions.has(e) && e !== emoji) ?? null;

    // Confetti on new reaction
    if (!alreadyReacted) {
      const btn = buttonRefs.current[emoji];
      if (btn) {
        const rect = btn.getBoundingClientRect();
        confetti({
          particleCount: 40,
          spread: 60,
          startVelocity: 20,
          ticks: 60,
          gravity: 1.2,
          origin: {
            x: (rect.left + rect.width / 2) / window.innerWidth,
            y: (rect.top + rect.height / 2) / window.innerHeight,
          },
          colors: ["#00e5b4", "#a855f7", "#f59e0b", "#ec4899", "#3b82f6"],
          scalar: 0.8,
        });
      }
    }

    // Optimistic update
    setCounts((prev) => {
      const next = { ...prev };
      if (alreadyReacted) {
        next[emoji] = Math.max(0, next[emoji] - 1);
      } else {
        next[emoji] = next[emoji] + 1;
        if (prevReaction) next[prevReaction] = Math.max(0, next[prevReaction] - 1);
      }
      return next;
    });
    setMyReactions(() => {
      if (alreadyReacted) return new Set();
      return new Set([emoji]);
    });

    // Remove previous reaction if switching
    if (prevReaction) {
      await (supabase as any)
        .from("reactions")
        .delete()
        .eq("participant_id", participantId)
        .eq("emoji", prevReaction)
        .eq("visitor_key", visitorKey);
    }

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

  const sortedEmojis = [...EMOJIS].sort((a, b) => counts[b] - counts[a]);

  return (
    <div className="flex gap-1.5 pt-2 border-t border-border">
      {sortedEmojis.map((emoji) => {
        const reacted = myReactions.has(emoji);
        return (
          <button
            key={emoji}
            ref={(el) => { buttonRefs.current[emoji] = el; }}
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
