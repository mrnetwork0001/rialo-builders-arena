import { useState } from "react";
import { ExternalLink, Twitter, Copy, Check } from "lucide-react";

interface Participant {
  id: string;
  display_name: string;
  avatar_url: string | null;
  discord_handle: string;
  twitter_handle: string | null;
  project_link: string | null;
  description: string | null;
}

interface ParticipantCardProps {
  participant: Participant;
}

export function ParticipantCard({ participant }: ParticipantCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(participant.discord_handle);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  const initials = participant.display_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="relative gradient-card rounded-xl border border-border card-hover p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        {participant.avatar_url ? (
          <img
            src={participant.avatar_url}
            alt={participant.display_name}
            className="w-12 h-12 rounded-full object-cover border-2 border-primary/30"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-primary/20 border-2 border-primary/30 flex items-center justify-center text-primary font-display font-semibold text-sm">
            {initials}
          </div>
        )}
        <div>
          <h3 className="font-display font-semibold text-foreground text-base leading-tight">
            {participant.display_name}
          </h3>
          <div className="flex items-center gap-1 text-muted-foreground text-xs mt-0.5">
            <span className="font-medium text-muted-foreground/70">dc:</span>
            <span>{participant.discord_handle}</span>
            <button
              onClick={handleCopy}
              className="ml-1 p-0.5 rounded hover:text-primary transition-colors"
              title="Copy Discord handle"
            >
              {copied ? <Check size={11} className="text-primary" /> : <Copy size={11} />}
            </button>
          </div>
        </div>
      </div>

      {/* Description */}
      {participant.description && (
        <p className="text-muted-foreground text-sm leading-relaxed flex-1 line-clamp-4">
          {participant.description}
        </p>
      )}

      {/* Links */}
      <div className="flex flex-wrap gap-2 mt-auto pt-2 border-t border-border">
        {participant.twitter_handle && (
          <a
            href={`https://twitter.com/${participant.twitter_handle.replace("@", "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-secondary hover:bg-primary/20 hover:text-primary text-muted-foreground transition-colors"
          >
            <Twitter size={12} />
            <span>{participant.twitter_handle.startsWith("@") ? participant.twitter_handle : `@${participant.twitter_handle}`}</span>
          </a>
        )}
        {participant.project_link && (
          <a
            href={participant.project_link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-primary/20 hover:bg-primary/30 text-primary transition-colors font-medium"
          >
            <ExternalLink size={12} />
            <span>View Project</span>
          </a>
        )}
      </div>
    </div>
  );
}
