import { useState } from "react";
import { Link } from "react-router-dom";
import { ExternalLink, Twitter, Copy, Check, ChevronDown, ChevronUp } from "lucide-react";
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

interface ParticipantCardProps {
  participant: Participant;
}

export function ParticipantCard({ participant }: ParticipantCardProps) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const CHAR_LIMIT = 180;

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
          <Link
            to={`/builders/${encodeURIComponent(participant.discord_handle)}`}
            className="font-display font-semibold text-foreground text-base leading-tight hover:text-primary transition-colors"
          >
            {participant.display_name}
          </Link>
          <div className="flex items-center gap-1 text-muted-foreground text-xs mt-0.5">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-3 h-3 fill-muted-foreground/70 shrink-0" aria-label="Discord">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
            </svg>
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

      {/* Project Title */}
      {participant.project_title && (
        <p className="text-foreground/80 text-sm font-semibold leading-snug -mb-1">
          {participant.project_title}
        </p>
      )}

      {/* Description */}
      {participant.description && (
        <div className="flex-1">
          <p className="text-muted-foreground text-sm leading-relaxed">
            {expanded || participant.description.length <= CHAR_LIMIT
              ? participant.description
              : participant.description.slice(0, CHAR_LIMIT).trimEnd() + "…"}
          </p>
          {participant.description.length > CHAR_LIMIT && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 text-xs text-primary hover:opacity-80 transition-opacity mt-1 font-medium"
            >
              {expanded ? (
                <><ChevronUp size={12} /> Read less</>
              ) : (
                <><ChevronDown size={12} /> Read more</>
              )}
            </button>
          )}
        </div>
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

      {/* Reactions */}
      <ReactionBar participantId={participant.id} />
    </div>
  );
}
