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
