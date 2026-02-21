export interface Badge {
  id: string;
  label: string;
  emoji: string;
  description: string;
  minSessions: number;
}

export const BADGES: Badge[] = [
  { id: "og", label: "OG Builder", emoji: "🏗️", description: "Participated in their first session", minSessions: 1 },
  { id: "streak3", label: "3-Session Streak", emoji: "🔥", description: "Participated in 3+ sessions", minSessions: 3 },
  { id: "veteran", label: "Veteran", emoji: "⭐", description: "Participated in 5+ sessions", minSessions: 5 },
  { id: "legend", label: "Legend", emoji: "🏆", description: "Participated in 10+ sessions", minSessions: 10 },
];

export function getEarnedBadges(sessionCount: number): Badge[] {
  return BADGES.filter((b) => sessionCount >= b.minSessions);
}
