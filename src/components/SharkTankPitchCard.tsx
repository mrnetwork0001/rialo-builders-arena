import { ExternalLink, FileText, DollarSign, CheckCircle2, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PitchVoteBar } from "@/components/PitchVoteBar";

interface Feedback {
  id: string;
  shark_name: string;
  shark_avatar?: string;
  feedback: string;
  offer_amount?: string;
  offer_type?: string;
  is_accepted: boolean;
}

interface Pitch {
  id: string;
  builder_name: string;
  builder_avatar_url: string | null;
  builder_discord: string | null;
  builder_twitter: string | null;
  project_name: string;
  description: string | null;
  demo_link: string | null;
  pitch_deck_link: string | null;
  funding_ask: string | null;
  is_funded: boolean;
  funded_amount: string | null;
  status: string;
  feedbacks: Feedback[];
}

export function SharkTankPitchCard({ pitch }: { pitch: Pitch }) {
  const initials = pitch.builder_name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="gradient-card rounded-xl border border-border card-hover p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0 overflow-hidden">
          {pitch.builder_avatar_url ? (
            <img src={pitch.builder_avatar_url} alt={pitch.builder_name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-xs font-bold text-primary">{initials}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-display font-semibold text-foreground text-sm truncate">{pitch.project_name}</h3>
            {pitch.is_funded && (
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-[10px] gap-1">
                <CheckCircle2 size={10} /> Funded
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">by {pitch.builder_name}</p>
        </div>
      </div>

      {/* Description */}
      {pitch.description && (
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">{pitch.description}</p>
      )}

      {/* Funding Ask */}
      {pitch.funding_ask && (
        <div className="flex items-center gap-1.5 text-xs">
          <DollarSign size={12} className="text-primary" />
          <span className="text-muted-foreground">Asking:</span>
          <span className="text-foreground font-medium">{pitch.funding_ask}</span>
          {pitch.funded_amount && (
            <span className="text-green-400 ml-1">→ Got {pitch.funded_amount}</span>
          )}
        </div>
      )}

      {/* Links */}
      <div className="flex items-center gap-3">
        {pitch.demo_link && (
          <a href={pitch.demo_link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
            <ExternalLink size={11} /> Demo
          </a>
        )}
        {pitch.pitch_deck_link && (
          <a href={pitch.pitch_deck_link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-accent hover:underline">
            <FileText size={11} /> Pitch Deck
          </a>
        )}
      </div>

      {/* Shark Feedback */}
      {pitch.feedbacks.length > 0 && (
        <div className="space-y-2 border-t border-border pt-3">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Shark Feedback</p>
          {pitch.feedbacks.map((fb) => (
            <div key={fb.id} className="bg-muted/40 rounded-lg p-3 space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center overflow-hidden">
                  {fb.shark_avatar ? (
                    <img src={fb.shark_avatar} className="w-full h-full object-cover" />
                  ) : (
                    <User size={10} className="text-accent" />
                  )}
                </div>
                <span className="text-xs font-medium text-foreground">{fb.shark_name}</span>
                {fb.offer_amount && (
                  <Badge variant="outline" className="text-[9px] ml-auto border-primary/30 text-primary">
                    Offered {fb.offer_amount} {fb.offer_type && `(${fb.offer_type})`}
                  </Badge>
                )}
                {fb.is_accepted && (
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-[9px]">Accepted</Badge>
                )}
              </div>
              {fb.feedback && <p className="text-xs text-muted-foreground leading-relaxed">{fb.feedback}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Voting */}
      <div className="border-t border-border pt-3">
        <PitchVoteBar pitchId={pitch.id} />
      </div>
    </div>
  );
}
