import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import rialoLogo from "@/assets/rialo-builders-arena-logo.png";
import { Button } from "@/components/ui/button";
import { Settings, ExternalLink, Twitter, ArrowLeft, CalendarDays, Copy, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { ReactionBar } from "@/components/ReactionBar";
import { FollowBuilder } from "@/components/FollowBuilder";
import { ThemeToggle } from "@/components/ThemeToggle";

interface ParticipantWithSession {
  id: string;
  display_name: string;
  avatar_url: string | null;
  discord_handle: string;
  twitter_handle: string | null;
  project_link: string | null;
  project_title: string | null;
  description: string | null;
  session: {
    id: string;
    week_label: string;
    session_date: string;
    is_current: boolean | null;
  } | null;
}

export default function BuilderProfile() {
  const { discordHandle } = useParams<{ discordHandle: string }>();
  const { isAdmin } = useAuth();
  const [entries, setEntries] = useState<ParticipantWithSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!discordHandle) return;
    fetchBuilderEntries(discordHandle);
  }, [discordHandle]);

  const fetchBuilderEntries = async (handle: string) => {
    const { data } = await supabase
      .from("participants")
      .select(`
        *,
        session:session_id (
          id,
          week_label,
          session_date,
          is_current
        )
      `)
      .eq("discord_handle", handle);

    const sorted = ((data as ParticipantWithSession[]) || []).sort((a, b) => {
      const dateA = a.session?.session_date ?? "";
      const dateB = b.session?.session_date ?? "";
      return dateB.localeCompare(dateA);
    });

    setEntries(sorted);
    setLoading(false);
  };

  const profile = entries[0];

  const ENTRIES_PER_PAGE = 4;
  const [timelinePage, setTimelinePage] = useState(1);
  const totalPages = Math.ceil(entries.length / ENTRIES_PER_PAGE);
  const paginatedEntries = entries.slice(
    (timelinePage - 1) * ENTRIES_PER_PAGE,
    timelinePage * ENTRIES_PER_PAGE
  );

  const handleCopy = () => {
    if (!profile) return;
    navigator.clipboard.writeText(profile.discord_handle);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const initials = profile?.display_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) ?? "?";

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <header className="border-b border-border bg-card/30 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-28 flex items-center justify-between">
          <Link to="/">
            <img src={rialoLogo} alt="Rialo Builders Arena" className="h-24 w-auto cursor-pointer" />
          </Link>
          <nav className="flex items-center gap-1">
            <Link to="/">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground text-sm font-medium">
                Builder's Hub
              </Button>
            </Link>
            <Link to="/shark-tank">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground text-sm font-medium">
                Shark Tank
              </Button>
            </Link>
            <Link to="/apply">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground text-sm font-medium">
                Apply
              </Button>
            </Link>
            {isAdmin && (
              <Link to="/admin">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground gap-2 text-xs">
                  <Settings size={14} />
                  Admin
                </Button>
              </Link>
            )}
            <ThemeToggle />
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 pb-20">
        {/* Back link */}
        <div className="pt-6 mb-8">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={14} />
            Back to Builder's Hub
          </Link>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <div className="w-10 h-10 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
            <p className="text-muted-foreground text-sm">Loading profile…</p>
          </div>
        ) : !profile ? (
          <div className="text-center py-24">
            <p className="text-muted-foreground">Builder not found.</p>
            <Link to="/">
              <Button variant="ghost" className="mt-4">Go back home</Button>
            </Link>
          </div>
        ) : (
          <>
            {/* Profile Header */}
            <div className="gradient-card rounded-2xl border border-border p-8 mb-10 flex flex-col sm:flex-row items-start sm:items-center gap-6">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.display_name}
                  className="w-20 h-20 rounded-full object-cover border-2 border-primary/40 shrink-0"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-primary/20 border-2 border-primary/40 flex items-center justify-center text-primary font-display font-bold text-2xl shrink-0">
                  {initials}
                </div>
              )}

              <div className="flex-1 min-w-0">
                <h1 className="font-display font-bold text-2xl md:text-3xl text-foreground">
                  {profile.display_name}
                </h1>
                <div className="flex flex-wrap items-center gap-3 mt-2">
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
                    title="Copy Discord handle"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-muted-foreground/60 shrink-0" aria-label="Discord">
                      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                    </svg>
                    <span>{profile.discord_handle}</span>
                    {copied ? <Check size={13} className="text-primary" /> : <Copy size={13} />}
                  </button>
                  {profile.twitter_handle && (
                    <a
                      href={`https://twitter.com/${profile.twitter_handle.replace("@", "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Twitter size={13} />
                      {profile.twitter_handle.startsWith("@") ? profile.twitter_handle : `@${profile.twitter_handle}`}
                    </a>
                  )}
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <span className="text-xs px-2.5 py-1 rounded-full bg-primary/15 text-primary font-medium border border-primary/20">
                    {entries.length} session{entries.length !== 1 ? "s" : ""} participated
                  </span>
                  <FollowBuilder discordHandle={profile.discord_handle} />
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div>
              <h2 className="font-display font-semibold text-lg text-foreground mb-6 flex items-center gap-2">
                <CalendarDays size={18} className="text-primary" />
                Project Timeline
              </h2>

              <div className="relative">
                {/* Vertical line */}
                <div className="absolute left-3.5 top-2 bottom-2 w-px bg-border" />

                <div className="flex flex-col gap-6">
                  {paginatedEntries.map((entry) => (
                    <div key={entry.id} className="relative pl-10">
                      {/* Dot */}
                      <div className={`absolute left-0 top-5 w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs
                        ${entry.session?.is_current
                          ? "border-primary bg-primary/20 text-primary"
                          : "border-border bg-card text-muted-foreground"
                        }`}
                      >
                        <div className={`w-2 h-2 rounded-full ${entry.session?.is_current ? "bg-primary animate-pulse" : "bg-muted-foreground/40"}`} />
                      </div>

                      {/* Card */}
                      <div className="gradient-card rounded-xl border border-border p-5">
                        {/* Session label */}
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-xs font-semibold text-primary uppercase tracking-wide">
                            {entry.session?.week_label ?? "Unknown session"}
                          </span>
                          {entry.session?.is_current && (
                            <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full font-medium">
                              Current Week
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground ml-auto">
                            {entry.session?.session_date
                              ? new Date(entry.session.session_date).toLocaleDateString("en-US", {
                                  year: "numeric", month: "short", day: "numeric",
                                })
                              : ""}
                          </span>
                        </div>

                        {/* Project title */}
                        {entry.project_title && (
                          <h3 className="font-display font-semibold text-base text-foreground mb-1">
                            {entry.project_title}
                          </h3>
                        )}

                        {/* Description */}
                        {entry.description && (
                          <p className="text-muted-foreground text-sm leading-relaxed mb-3">
                            {entry.description}
                          </p>
                        )}

                        {/* Links + Reactions */}
                        <div className="flex flex-wrap gap-2 mb-3">
                          {entry.twitter_handle && (
                            <a
                              href={`https://twitter.com/${entry.twitter_handle.replace("@", "")}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-secondary hover:bg-primary/20 hover:text-primary text-muted-foreground transition-colors"
                            >
                              <Twitter size={12} />
                              {entry.twitter_handle.startsWith("@") ? entry.twitter_handle : `@${entry.twitter_handle}`}
                            </a>
                          )}
                          {entry.project_link && (
                            <a
                              href={entry.project_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-primary/20 hover:bg-primary/30 text-primary transition-colors font-medium"
                            >
                              <ExternalLink size={12} />
                              View Project
                            </a>
                          )}
                        </div>

                        <ReactionBar participantId={entry.id} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pagination — only shown when entries exceed 4 */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setTimelinePage((p) => Math.max(1, p - 1))}
                    disabled={timelinePage === 1}
                    className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
                  >
                    <ChevronLeft size={15} />
                    Previous
                  </Button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setTimelinePage(page)}
                        className={`w-8 h-8 rounded-full text-sm font-medium transition-colors
                          ${page === timelinePage
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                          }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setTimelinePage((p) => Math.min(totalPages, p + 1))}
                    disabled={timelinePage === totalPages}
                    className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
                  >
                    Next
                    <ChevronRight size={15} />
                  </Button>
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6 px-4 text-center">
        <p className="text-muted-foreground text-sm">
          Built by{" "}
          <a
            href="https://x.com/encrypt_wizard"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary font-medium hover:underline"
          >
            MrNetwork
          </a>
        </p>
      </footer>
    </div>
  );
}
