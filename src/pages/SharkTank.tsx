import { useState, useEffect, useRef } from "react";
import rialoLogo from "@/assets/rialo-builders-arena-logo.png";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { CalendarDays, Settings, Search, ChevronLeft, ChevronRight, Trophy, Play, Video, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Link } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SharkTankPitchCard } from "@/components/SharkTankPitchCard";
import { SharkPanel } from "@/components/SharkPanel";
import { format } from "date-fns";

const TYPEWRITER_TEXT = "Rialo Shark Tank";

interface STSession {
  id: string;
  week_label: string;
  session_date: string;
  is_current: boolean;
  stream_link: string | null;
  replay_link: string | null;
  description: string | null;
}

interface Shark {
  id: string;
  display_name: string;
  title: string | null;
  avatar_url: string | null;
  bio: string | null;
  twitter_handle: string | null;
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
  sort_order: number;
}

interface Feedback {
  id: string;
  pitch_id: string;
  shark_id: string;
  feedback: string | null;
  offer_amount: string | null;
  offer_type: string | null;
  is_accepted: boolean;
}

export default function SharkTank() {
  const { isAdmin } = useAuth();
  const [typedText, setTypedText] = useState("");
  const typewriterRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [sessions, setSessions] = useState<STSession[]>([]);
  const [sessionIdx, setSessionIdx] = useState(0);
  const [sharks, setSharks] = useState<Shark[]>([]);
  const [pitches, setPitches] = useState<Pitch[]>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("pitches");

  // Typewriter
  useEffect(() => {
    let i = 0;
    let deleting = false;
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

  // Fetch sessions
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data: sessData } = await supabase
        .from("shark_tank_sessions")
        .select("*")
        .order("session_date", { ascending: false });

      if (sessData && sessData.length > 0) {
        setSessions(sessData);
        const currentIdx = sessData.findIndex((s) => s.is_current);
        setSessionIdx(currentIdx >= 0 ? currentIdx : 0);
      }

      const { data: sharkData } = await supabase
        .from("shark_tank_sharks")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");
      if (sharkData) setSharks(sharkData);

      setLoading(false);
    };
    load();
  }, []);

  // Fetch pitches when session changes
  useEffect(() => {
    if (sessions.length === 0) return;
    const session = sessions[sessionIdx];
    const loadPitches = async () => {
      const { data: pitchData } = await supabase
        .from("shark_tank_pitches")
        .select("*")
        .eq("session_id", session.id)
        .order("sort_order");
      if (pitchData) {
        setPitches(pitchData);
        // Fetch feedbacks for these pitches
        const pitchIds = pitchData.map((p) => p.id);
        if (pitchIds.length > 0) {
          const { data: fbData } = await supabase
            .from("shark_tank_feedback")
            .select("*")
            .in("pitch_id", pitchIds);
          if (fbData) setFeedbacks(fbData);
          else setFeedbacks([]);
        } else {
          setFeedbacks([]);
        }
      }
    };
    loadPitches();
  }, [sessions, sessionIdx]);

  const currentSession = sessions[sessionIdx] || null;

  // Leaderboard: past pitches that got funded
  const [leaderboard, setLeaderboard] = useState<Pitch[]>([]);
  useEffect(() => {
    const loadLeaderboard = async () => {
      const { data } = await supabase
        .from("shark_tank_pitches")
        .select("*")
        .eq("is_funded", true)
        .order("created_at", { ascending: false })
        .limit(10);
      if (data) setLeaderboard(data);
    };
    loadLeaderboard();
  }, []);

  const filteredPitches = pitches.filter((p) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      p.project_name.toLowerCase().includes(q) ||
      p.builder_name.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q)
    );
  });

  const pitchesWithFeedback = filteredPitches.map((p) => ({
    ...p,
    feedbacks: feedbacks
      .filter((fb) => fb.pitch_id === p.id)
      .map((fb) => {
        const shark = sharks.find((s) => s.id === fb.shark_id);
        return {
          id: fb.id,
          shark_name: shark?.display_name || "Unknown Shark",
          shark_avatar: shark?.avatar_url || undefined,
          feedback: fb.feedback || "",
          offer_amount: fb.offer_amount || undefined,
          offer_type: fb.offer_type || undefined,
          is_accepted: fb.is_accepted,
        };
      }),
  }));

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
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground hover:bg-nav-hover text-sm font-medium">
                Builder's Hub
              </Button>
            </Link>
            <Button variant="default" size="sm" className="text-sm font-medium">
              Shark Tank
            </Button>
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

      <div className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden py-16 md:py-24 px-4">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-accent/5 rounded-full blur-3xl" />
          </div>
          <div className="max-w-4xl mx-auto text-center relative">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-accent/30 bg-accent/10 text-accent text-xs font-medium mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              Weekly Shark Tank
            </div>
            <h1 className="font-display font-bold text-4xl md:text-6xl text-foreground leading-tight mb-4">
              <span className="gradient-text-primary">{typedText}</span>
              <span className="inline-block w-[3px] h-[1em] bg-primary align-middle animate-pulse ml-0.5" />
              <br />
              Weekly Pitches
            </h1>
            <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto leading-relaxed mb-6">
              Watch builders pitch their projects to investors and community sharks. Vote for your favorites and help surface the best projects.
            </p>
            <Link to="/shark-tank/apply">
              <Button size="lg" className="gap-2">
                🎤 Apply to Pitch
              </Button>
            </Link>
          </div>
        </section>

        <main className="flex-1 max-w-6xl mx-auto w-full px-4 pb-20">
          <Tabs value={tab} onValueChange={setTab} className="space-y-6">
            <TabsList className="bg-muted/60">
              <TabsTrigger value="pitches">🎯 Pitches</TabsTrigger>
              <TabsTrigger value="sharks">🦈 Sharks</TabsTrigger>
              <TabsTrigger value="leaderboard">🏆 Winners</TabsTrigger>
            </TabsList>

            {/* Pitches Tab */}
            <TabsContent value="pitches" className="space-y-6">
              {/* Session navigation */}
              {currentSession && (
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <CalendarDays size={18} className="text-primary shrink-0" />
                    <div>
                      <h2 className="font-display font-semibold text-lg text-foreground">{currentSession.week_label}</h2>
                      <p className="text-muted-foreground text-xs">
                        {format(new Date(currentSession.session_date + "T00:00:00"), "EEEE, MMMM d, yyyy")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {currentSession.stream_link && (
                      <a href={currentSession.stream_link} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                          <Play size={12} /> Watch Live
                        </Button>
                      </a>
                    )}
                    {currentSession.replay_link && (
                      <a href={currentSession.replay_link} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                          <Video size={12} /> Replay
                        </Button>
                      </a>
                    )}
                    <Button
                      variant="ghost" size="icon"
                      disabled={sessionIdx >= sessions.length - 1}
                      onClick={() => setSessionIdx((i) => i + 1)}
                    >
                      <ChevronLeft size={16} />
                    </Button>
                    <span className="text-xs text-muted-foreground">
                      {sessionIdx + 1}/{sessions.length}
                    </span>
                    <Button
                      variant="ghost" size="icon"
                      disabled={sessionIdx <= 0}
                      onClick={() => setSessionIdx((i) => i - 1)}
                    >
                      <ChevronRight size={16} />
                    </Button>
                  </div>
                </div>
              )}

              {currentSession?.description && (
                <p className="text-sm text-muted-foreground bg-muted/30 rounded-lg px-4 py-3 border border-border">
                  {currentSession.description}
                </p>
              )}

              {/* Shark Panel inline */}
              <SharkPanel sharks={sharks} />

              {/* Search */}
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search pitches…"
                  className="pl-9 max-w-md"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              {/* Pitch cards */}
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => <div key={i} className="rounded-xl border border-border bg-card p-5 h-48 animate-pulse" />)}
                </div>
              ) : sessions.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-muted-foreground text-lg mb-2">No Shark Tank sessions yet</p>
                  <p className="text-muted-foreground text-sm">Check back soon for the first weekly pitches!</p>
                </div>
              ) : pitchesWithFeedback.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-muted-foreground">No pitches for this session yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pitchesWithFeedback.map((pitch) => (
                    <SharkTankPitchCard key={pitch.id} pitch={pitch} />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Sharks Tab */}
            <TabsContent value="sharks" className="space-y-6">
              <h2 className="font-display font-semibold text-xl text-foreground">Meet the Sharks</h2>
              {sharks.length === 0 ? (
                <p className="text-muted-foreground text-center py-12">Shark panel coming soon!</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sharks.map((shark) => (
                    <div key={shark.id} className="gradient-card rounded-xl border border-border p-6 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-accent/10 border border-accent/30 flex items-center justify-center overflow-hidden">
                          {shark.avatar_url ? (
                            <img src={shark.avatar_url} alt={shark.display_name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-lg">🦈</span>
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{shark.display_name}</p>
                          {shark.title && <p className="text-xs text-muted-foreground">{shark.title}</p>}
                        </div>
                      </div>
                      {shark.bio && <p className="text-sm text-muted-foreground leading-relaxed">{shark.bio}</p>}
                      {shark.twitter_handle && (
                        <a
                          href={`https://x.com/${shark.twitter_handle.replace("@", "")}`}
                          target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                        >
                          <ExternalLink size={10} /> @{shark.twitter_handle.replace("@", "")}
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Leaderboard/Winners Tab */}
            <TabsContent value="leaderboard" className="space-y-6">
              <div className="flex items-center gap-2 mb-2">
                <Trophy size={20} className="text-primary" />
                <h2 className="font-display font-semibold text-xl text-foreground">Funded Projects</h2>
              </div>
              {leaderboard.length === 0 ? (
                <p className="text-muted-foreground text-center py-12">No funded projects yet. Be the first to get backed!</p>
              ) : (
                <div className="space-y-3">
                  {leaderboard.map((pitch, idx) => (
                    <div key={pitch.id} className="gradient-card rounded-xl border border-border p-5 flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                        #{idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground text-sm truncate">{pitch.project_name}</h3>
                        <p className="text-xs text-muted-foreground">by {pitch.builder_name}</p>
                      </div>
                      {pitch.funded_amount && (
                        <Badge className="bg-primary/20 text-primary border-primary/30 text-xs shrink-0">
                          {pitch.funded_amount}
                        </Badge>
                      )}
                      {pitch.demo_link && (
                        <a href={pitch.demo_link} target="_blank" rel="noopener noreferrer">
                          <Button variant="ghost" size="icon" className="shrink-0">
                            <ExternalLink size={14} />
                          </Button>
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </main>
      </div>

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
