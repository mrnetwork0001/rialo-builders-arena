import { useState, useEffect, useRef } from "react";
import rialoLogo from "@/assets/rialo-builders-arena-logo.png";
import { supabase } from "@/integrations/supabase/client";
import { ParticipantCard } from "@/components/ParticipantCard";
import { FeaturedBuilder } from "@/components/FeaturedBuilder";
import { useAuth } from "@/contexts/AuthContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LiveReactionFeed } from "@/components/LiveReactionFeed";
import { ChevronLeft, ChevronRight, Search, Users, CalendarDays, Settings, Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface Session {
  id: string;
  week_label: string;
  session_date: string;
  is_current: boolean;
}

interface Participant {
  id: string;
  session_id: string;
  display_name: string;
  avatar_url: string | null;
  discord_handle: string;
  twitter_handle: string | null;
  project_link: string | null;
  project_title: string | null;
  description: string | null;
  is_featured: boolean;
}

const TYPEWRITER_TEXT = "Rialo Builder's Hub";

export default function Index() {
  const { isAdmin } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionIndex, setCurrentSessionIndex] = useState(0);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [participantsLoading, setParticipantsLoading] = useState(false);
  const [sessionCounts, setSessionCounts] = useState<Record<string, number>>({});
  const [typedText, setTypedText] = useState("");
  const typewriterRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let i = 0;
    let deleting = false;
    setTypedText("");
    const tick = () => {
      if (!deleting) {
        i++;
        setTypedText(TYPEWRITER_TEXT.slice(0, i));
        if (i === TYPEWRITER_TEXT.length) {
          typewriterRef.current = setTimeout(() => { deleting = true; tick(); }, 1500);
          return;
        }
      } else {
        i--;
        setTypedText(TYPEWRITER_TEXT.slice(0, i));
        if (i === 0) {
          typewriterRef.current = setTimeout(() => { deleting = false; tick(); }, 400);
          return;
        }
      }
      typewriterRef.current = setTimeout(tick, deleting ? 45 : 80);
    };
    typewriterRef.current = setTimeout(tick, 400);
    return () => { if (typewriterRef.current) clearTimeout(typewriterRef.current); };
  }, []);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("timeout")), 10000)
      );
      const query = supabase
        .from("weekly_sessions")
        .select("*")
        .order("session_date", { ascending: false });

      const { data, error } = await Promise.race([query, timeout]) as Awaited<typeof query>;

      if (error) throw error;

      if (data && data.length > 0) {
        setSessions(data);
        const currentIdx = data.findIndex((s) => s.is_current);
        const startIdx = currentIdx >= 0 ? currentIdx : 0;
        setCurrentSessionIndex(startIdx);
        fetchParticipants(data[startIdx].id);
      }
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };

  const fetchParticipants = async (sessionId: string) => {
    setParticipantsLoading(true);
    const { data } = await supabase
      .from("participants")
      .select("*")
      .eq("session_id", sessionId)
      .order("sort_order")
      .order("created_at");
    setParticipants(data || []);

    // Fetch session counts for badges
    if (data && data.length > 0) {
      const handles = [...new Set(data.map((p) => p.discord_handle))];
      const { data: allEntries } = await supabase
        .from("participants")
        .select("discord_handle, session_id")
        .in("discord_handle", handles);
      const counts: Record<string, number> = {};
      if (allEntries) {
        for (const entry of allEntries) {
          // Count unique sessions per handle
          if (!counts[entry.discord_handle]) counts[entry.discord_handle] = 0;
        }
        // Group by handle -> unique session_ids
        const handleSessions: Record<string, Set<string>> = {};
        for (const entry of allEntries) {
          if (!handleSessions[entry.discord_handle]) handleSessions[entry.discord_handle] = new Set();
          handleSessions[entry.discord_handle].add(entry.session_id);
        }
        for (const [handle, sessions] of Object.entries(handleSessions)) {
          counts[handle] = sessions.size;
        }
      }
      setSessionCounts(counts);
    }

    setParticipantsLoading(false);
  };

  const handlePrev = () => {
    const nextIdx = currentSessionIndex + 1;
    if (nextIdx < sessions.length) {
      setCurrentSessionIndex(nextIdx);
      setCurrentPage(1);
      fetchParticipants(sessions[nextIdx].id);
    }
  };

  const handleNext = () => {
    const nextIdx = currentSessionIndex - 1;
    if (nextIdx >= 0) {
      setCurrentSessionIndex(nextIdx);
      setCurrentPage(1);
      fetchParticipants(sessions[nextIdx].id);
    }
  };

  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 6;

  const currentSession = sessions[currentSessionIndex];
  const filteredParticipants = participants.filter((p) =>
    p.display_name.toLowerCase().includes(search.toLowerCase()) ||
    p.discord_handle.toLowerCase().includes(search.toLowerCase()) ||
    (p.description || "").toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filteredParticipants.length / PAGE_SIZE);
  const pagedParticipants = filteredParticipants.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  return (
    <div className="min-h-screen flex flex-col">
      <LiveReactionFeed />
      {/* Navigation */}
      <header className="border-b border-border bg-card/30 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-28 flex items-center justify-between">
          <Link to="/">
            <img src={rialoLogo} alt="Rialo Builders Arena" className="h-24 w-auto cursor-pointer" />
          </Link>
          <nav className="flex items-center gap-1">
            <Button variant="default" size="sm" className="text-sm font-medium">
              Builder's Hub
            </Button>
            <Link to="/shark-tank">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground hover:bg-nav-hover text-sm font-medium">
                Shark Tank
              </Button>
            </Link>
            <Link to="/apply">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground hover:bg-nav-hover text-sm font-medium">
                Apply
              </Button>
            </Link>
            {isAdmin && (
              <Link to="/admin">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground hover:bg-nav-hover gap-2 text-xs">
                  <Settings size={14} />
                  Admin
                </Button>
              </Link>
            )}
            <ThemeToggle />
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden py-16 md:py-24 px-4">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute top-1/3 right-1/4 w-[300px] h-[200px] bg-accent/5 rounded-full blur-3xl" />
        </div>

        <div className="max-w-4xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-medium mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            Weekly Builder Showcase
          </div>

          <h1 className="font-display font-bold text-4xl md:text-6xl text-foreground leading-tight mb-4">
            <span className="gradient-text-primary">
              {typedText}
              <span className="animate-pulse">|</span>
            </span>
            <br />
            Weekly Participants
          </h1>

          <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            Discover builders and their projects. Rialo Builder's Hub is a weekly event on the Rialo Discord where community members showcase products and applications they've built for the Rialo ecosystem.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 pb-20">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <div className="w-10 h-10 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
            <p className="text-muted-foreground text-sm">Loading sessions…</p>
          </div>
        ) : loadError ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <p className="text-muted-foreground text-sm">Failed to load sessions. Please check your connection.</p>
            <Button size="sm" onClick={fetchSessions}>Try Again</Button>
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-24">
            <Users className="mx-auto text-muted-foreground mb-3" size={40} />
            <p className="text-muted-foreground">No sessions yet. Check back soon!</p>
          </div>
        ) : (
          <>
            {/* Session Navigation */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
              <div className="flex items-center gap-3">
                <CalendarDays size={18} className="text-primary shrink-0" />
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-display font-semibold text-lg text-foreground">
                      {currentSession?.week_label}
                    </h2>
                    {currentSession?.is_current && (
                      <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full font-medium">
                        Current Week
                      </span>
                    )}
                  </div>
                  <p className="text-muted-foreground text-xs">
                    {currentSession && new Date(currentSession.session_date).toLocaleDateString("en-US", {
                      weekday: "long", year: "numeric", month: "long", day: "numeric",
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrev}
                  disabled={currentSessionIndex >= sessions.length - 1}
                  className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-xs text-muted-foreground font-medium px-2">
                  {currentSessionIndex + 1} / {sessions.length}
                </span>
                <button
                  onClick={handleNext}
                  disabled={currentSessionIndex <= 0}
                  className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            {/* Search */}
            <div className="relative mb-8">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                placeholder="Search builders by name, handle, or project…"
                className="pl-9 bg-input border-border focus:border-primary max-w-md"
              />
            </div>

            {/* Featured Builder Spotlight */}
            {!participantsLoading && !search && (() => {
              const featured = participants.find((p) => p.is_featured);
              if (!featured) return null;
              return (
                <div className="mb-8">
                  <div className="flex items-center gap-2 mb-3">
                    <Star size={15} className="text-primary fill-primary" />
                    <h3 className="text-sm font-semibold text-foreground">Featured Builder of the Week</h3>
                  </div>
                  <FeaturedBuilder participant={featured} />
                </div>
              );
            })()}

            {/* Divider between featured and participants */}
            {!participantsLoading && !search && participants.some((p) => p.is_featured) && (
              <div className="flex items-center gap-3 mb-8">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground font-medium px-2">All Builders This Week</span>
                <div className="flex-1 h-px bg-border" />
              </div>
            )}

            {/* Participants Grid */}
            {participantsLoading ? (
              <div className="flex justify-center py-16">
                <div className="w-8 h-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
              </div>
            ) : filteredParticipants.length === 0 ? (
              <div className="text-center py-16">
                <Users className="mx-auto text-muted-foreground mb-3 opacity-40" size={36} />
                <p className="text-muted-foreground text-sm">
                  {search ? "No builders match your search." : "No participants for this week yet."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
                {pagedParticipants.map((participant) => (
                  <ParticipantCard key={participant.id} participant={participant} sessionCount={sessionCounts[participant.discord_handle] || 1} />
                ))}
              </div>
            )}

            {/* Pagination */}
            {!participantsLoading && totalPages > 1 && (
              <div className="flex items-center justify-center gap-1 mt-8">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={15} />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 rounded-lg border text-xs font-medium transition-colors ${
                      page === currentPage
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:text-foreground hover:border-primary/50"
                    }`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight size={15} />
                </button>
              </div>
            )}

            {/* Count */}
            {!participantsLoading && filteredParticipants.length > 0 && (
              <p className="text-center text-muted-foreground text-xs mt-4">
                Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredParticipants.length)} of {filteredParticipants.length} builder{filteredParticipants.length !== 1 ? "s" : ""}
                {search && ` matching "${search}"`}
              </p>
            )}
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
