import { User } from "lucide-react";

interface Shark {
  id: string;
  display_name: string;
  title: string | null;
  avatar_url: string | null;
  bio: string | null;
  twitter_handle: string | null;
}

export function SharkPanel({ sharks }: { sharks: Shark[] }) {
  if (sharks.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">🦈 Shark Panel</h3>
      <div className="flex flex-wrap gap-3">
        {sharks.map((shark) => (
          <div
            key={shark.id}
            className="gradient-card rounded-xl border border-border p-4 flex items-center gap-3 min-w-[200px] flex-1 max-w-xs"
          >
            <div className="w-10 h-10 rounded-full bg-accent/10 border border-accent/30 flex items-center justify-center overflow-hidden shrink-0">
              {shark.avatar_url ? (
                <img src={shark.avatar_url} alt={shark.display_name} className="w-full h-full object-cover" />
              ) : (
                <User size={16} className="text-accent" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{shark.display_name}</p>
              {shark.title && <p className="text-[11px] text-muted-foreground truncate">{shark.title}</p>}
              {shark.twitter_handle && (
                <a
                  href={`https://x.com/${shark.twitter_handle.replace("@", "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-primary hover:underline"
                >
                  @{shark.twitter_handle.replace("@", "")}
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
