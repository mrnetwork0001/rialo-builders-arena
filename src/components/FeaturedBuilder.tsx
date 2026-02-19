import { Star, ExternalLink, Twitter, Copy, Check } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { ReactionBar } from "@/components/ReactionBar";

interface Participant {
  id: string;
  display_name: string;
  avatar_url: string | null;
  discord_handle: string;
  twitter_handle: string | null;
  project_link: string | null;
  project_title: string | null;
  description: string | null;
}

export function FeaturedBuilder({ participant }: { participant: Participant }) {
  const [copied, setCopied] = useState(false);
  const initials = participant.display_name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleCopy = () => {
    navigator.clipboard.writeText(participant.discord_handle);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative rounded-2xl border border-primary/40 bg-gradient-to-br from-primary/10 via-card to-accent/5 p-6 overflow-hidden shadow-lg">
      {/* Glow behind */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-10 -left-10 w-52 h-52 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-10 -right-10 w-52 h-52 bg-accent/10 rounded-full blur-3xl" />
      </div>

      <div className="relative flex flex-col sm:flex-row gap-6">
        {/* Avatar */}
        <div className="shrink-0 flex flex-col items-center gap-2">
          {participant.avatar_url ? (
            <img
              src={participant.avatar_url}
              alt={participant.display_name}
              className="w-20 h-20 rounded-2xl object-cover border-2 border-primary/40 shadow-md"
            />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-primary/20 border-2 border-primary/40 flex items-center justify-center text-primary text-2xl font-bold shadow-md">
              {initials}
            </div>
          )}
          {/* Star badge */}
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary bg-primary/15 border border-primary/30 px-2.5 py-1 rounded-full">
            <Star size={11} className="fill-primary" />
            Featured
          </span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div>
              <Link
                to={`/builders/${encodeURIComponent(participant.discord_handle)}`}
                className="font-display font-bold text-xl text-foreground hover:text-primary transition-colors"
              >
                {participant.display_name}
              </Link>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mt-0.5 group"
              >
                {copied ? <Check size={11} className="text-primary" /> : <Copy size={11} />}
                <span className="group-hover:underline">{participant.discord_handle}</span>
              </button>
            </div>
            <div className="flex items-center gap-2">
              {participant.twitter_handle && (
                <a
                  href={`https://x.com/${participant.twitter_handle.replace("@", "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  <Twitter size={15} />
                </a>
              )}
              {participant.project_link && (
                <a
                  href={participant.project_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-primary border border-primary/30 hover:bg-primary/10 px-2.5 py-1 rounded-lg transition-colors font-medium"
                >
                  <ExternalLink size={11} /> View Project
                </a>
              )}
            </div>
          </div>

          {participant.project_title && (
            <p className="text-sm font-semibold text-foreground mt-2">{participant.project_title}</p>
          )}
          {participant.description && (
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed line-clamp-3">
              {participant.description}
            </p>
          )}

          <div className="mt-4">
            <ReactionBar participantId={participant.id} />
          </div>
        </div>
      </div>
    </div>
  );
}
