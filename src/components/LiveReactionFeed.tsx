import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

interface FeedItem {
  id: string;
  emoji: string;
  participant_name: string;
  timestamp: number;
}

export function LiveReactionFeed() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [visible, setVisible] = useState<FeedItem[]>([]);
  const queueRef = useRef<FeedItem[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Rotate visible items from queue
  useEffect(() => {
    timerRef.current = setInterval(() => {
      const q = queueRef.current;
      if (q.length === 0) return;
      const next = q.shift()!;
      setVisible((prev) => [next, ...prev].slice(0, 5));
    }, 1800);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  // Load participant names
  const namesRef = useRef<Record<string, string>>({});
  useEffect(() => {
    const loadNames = async () => {
      const { data } = await (supabase as any).from("participants").select("id, display_name, project_title");
      if (data) {
        const map: Record<string, string> = {};
        for (const p of data) map[p.id] = p.project_title || p.display_name;
        namesRef.current = map;
      }
    };
    loadNames();
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel("live-reactions")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "reactions" },
        (payload) => {
          const row = payload.new as { id: string; emoji: string; participant_id: string };
          const name = namesRef.current[row.participant_id] || "a project";
          const item: FeedItem = {
            id: row.id,
            emoji: row.emoji,
            participant_name: name,
            timestamp: Date.now(),
          };
          queueRef.current.push(item);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  if (visible.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-1.5 items-end pointer-events-none">
      {visible.map((item, i) => (
        <div
          key={item.id + i}
          className="animate-fade-in flex items-center gap-2 bg-card/90 backdrop-blur-sm border border-border rounded-full px-3 py-1.5 text-xs text-muted-foreground shadow-lg"
          style={{ opacity: Math.max(0.4, 1 - i * 0.18) }}
        >
          <span className="text-base">{item.emoji}</span>
          <span>Someone reacted to <span className="text-foreground font-medium">{item.participant_name}</span></span>
        </div>
      ))}
    </div>
  );
}
