import { Badge } from "@/lib/badges";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface BuilderBadgesProps {
  badges: Badge[];
  size?: "sm" | "md";
}

export function BuilderBadges({ badges, size = "sm" }: BuilderBadgesProps) {
  if (badges.length === 0) return null;

  const emojiSize = size === "sm" ? "text-sm" : "text-base";
  const pillPadding = size === "sm" ? "px-1.5 py-0.5" : "px-2 py-1";

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex flex-wrap gap-1">
        {badges.map((badge) => (
          <Tooltip key={badge.id}>
            <TooltipTrigger asChild>
              <span
                className={`inline-flex items-center gap-1 ${pillPadding} rounded-full bg-primary/10 border border-primary/20 cursor-default`}
              >
                <span className={emojiSize}>{badge.emoji}</span>
                {size === "md" && (
                  <span className="text-xs font-medium text-primary">
                    {badge.label}
                  </span>
                )}
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              <p className="font-semibold">{badge.label}</p>
              <p className="text-muted-foreground">{badge.description}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}
