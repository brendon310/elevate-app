import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Sparkles, Brain, Flame, Trophy, ArrowRight } from "lucide-react";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/")({ component: Landing });

function Landing() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  useEffect(() => { if (!loading && user) nav({ to: "/app" }); }, [user, loading, nav]);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <div className="absolute inset-x-0 top-0 -z-10 h-[600px] bg-[radial-gradient(60%_60%_at_50%_0%,oklch(0.30_0.10_60_/_0.5),transparent)]" />
      <header className="container mx-auto flex items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl grad-productivity flex items-center justify-center shadow-[var(--shadow-glow)]">
            <Sparkles className="h-5 w-5 text-background" />
          </div>
          <span className="font-semibold tracking-tight text-lg">Elevate</span>
        </div>
        <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground">Sign in</Link>
      </header>

      <main className="container mx-auto px-6">
        <section className="pt-16 pb-24 max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            50 specialist AI coaches, one app
          </div>
          <h1 className="mt-6 text-5xl md:text-7xl font-bold tracking-tight">
            Your <span className="text-gradient">personal growth</span> companion.
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-xl mx-auto">
            Quit smoking. Build strength. Meditate. Read more. Each habit gets its own world-class AI coach that remembers your entire journey.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link to="/login" className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 shadow-[var(--shadow-glow)]">
              Start your journey <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        <section className="grid md:grid-cols-3 gap-4 pb-24 max-w-5xl mx-auto">
          {[
            { i: Brain, t: "Specialist AI per habit", d: "Each of the 50 tracks has its own coach trained on real frameworks: CBT, MBSR, progressive overload, Allen Carr, GTD, and more." },
            { i: Flame, t: "Streaks that respect you", d: "Daily check-ins, mood tracking, and freeze days so a bad week doesn't burn down months of progress." },
            { i: Trophy, t: "Elevate Score", d: "One composite score across every active habit. See momentum, patterns, and weekly AI insights." },
          ].map(({ i: Icon, t, d }) => (
            <div key={t} className="glass rounded-2xl p-6">
              <Icon className="h-6 w-6 text-primary" />
              <h3 className="mt-4 font-semibold">{t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{d}</p>
            </div>
          ))}
        </section>

        <section className="pb-24 text-center max-w-2xl mx-auto">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Five categories. Fifty habits.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-2 text-xs">
            {["Fitness & Body","Mental Health","Quit Bad Habits","Mind & Learning","Productivity & Life"].map((c) => (
              <span key={c} className="rounded-full border border-border bg-card/50 px-3 py-1.5">{c}</span>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        Built with Elevate © {new Date().getFullYear()}
      </footer>
    </div>
  );
}
