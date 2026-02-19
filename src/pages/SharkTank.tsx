import rialoLogo from "@/assets/rialo-builders-arena-logo.png";
import { useAuth } from "@/contexts/AuthContext";
import { Users, CalendarDays, Settings, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";

export default function SharkTank() {
  const { isAdmin } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <header className="border-b border-border bg-card/30 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-28 flex items-center justify-between">
          <div className="flex items-center">
            <img src={rialoLogo} alt="Rialo Builders Arena" className="h-24 w-auto" />
          </div>
          <nav className="flex items-center gap-1">
            <Link to="/">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground text-sm font-medium">
                Builder's Hub
              </Button>
            </Link>
            <Button variant="default" size="sm" className="text-sm font-medium">
              Shark Tank
            </Button>
            {isAdmin && (
              <Link to="/admin">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground gap-2 text-xs">
                  <Settings size={14} />
                  Admin
                </Button>
              </Link>
            )}
          </nav>
        </div>
      </header>

      {/* Blurred content with Coming Soon overlay */}
      <div className="relative flex-1">
        {/* Blurred page content */}
        <div className="blur-sm pointer-events-none select-none">
          {/* Hero */}
          <section className="relative overflow-hidden py-16 md:py-24 px-4">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-primary/5 rounded-full blur-3xl" />
            </div>
            <div className="max-w-4xl mx-auto text-center relative">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-medium mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                Weekly Shark Tank
              </div>
              <h1 className="font-display font-bold text-4xl md:text-6xl text-foreground leading-tight mb-4">
                Rialo{" "}
                <span className="gradient-text-primary">Shark Tank</span>
                <br />
                Weekly Pitches
              </h1>
              <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
                Watch builders pitch their projects to investors and community sharks. A weekly event where ideas meet capital.
              </p>
            </div>
          </section>

          {/* Mock content */}
          <main className="flex-1 max-w-6xl mx-auto w-full px-4 pb-20">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
              <div className="flex items-center gap-3">
                <CalendarDays size={18} className="text-primary shrink-0" />
                <div>
                  <h2 className="font-display font-semibold text-lg text-foreground">Week 1</h2>
                  <p className="text-muted-foreground text-xs">Monday, January 1, 2026</p>
                </div>
              </div>
            </div>
            <div className="relative mb-8">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search pitches…" className="pl-9 max-w-md" disabled />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="rounded-xl border border-border bg-card p-5 h-40" />
              ))}
            </div>
          </main>
        </div>

        {/* Coming Soon overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
          <div className="text-center px-6 py-10 rounded-2xl border border-primary/30 bg-background/80 backdrop-blur-md shadow-xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-medium mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Coming Soon
            </div>
            <h2 className="font-display font-bold text-3xl md:text-4xl text-foreground mb-3">
              Rialo <span className="gradient-text-primary">Shark Tank</span>
            </h2>
            <p className="text-muted-foreground text-sm max-w-xs mx-auto">
              This feature is under construction. Stay tuned for weekly pitch events!
            </p>
          </div>
        </div>
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
