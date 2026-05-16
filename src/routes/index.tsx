import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { ArrowRight } from "lucide-react";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/")({ component: Landing });

function Landing() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  useEffect(() => { if (!loading && user) nav({ to: "/app" }); }, [user, loading, nav]);

  return (
    <div className="relative min-h-screen overflow-x-hidden text-foreground">
      {/* warm ambient backdrop */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[900px]
        bg-[radial-gradient(70%_60%_at_50%_-10%,oklch(0.45_0.18_40_/_0.45),transparent_70%),radial-gradient(40%_50%_at_85%_10%,oklch(0.55_0.15_70_/_0.25),transparent_60%)]" />

      <header className="container mx-auto flex items-center justify-between px-6 py-7">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-full grad-warm flex items-center justify-center shadow-[var(--shadow-glow)]">
            <span className="font-display italic text-background text-lg leading-none">e</span>
          </div>
          <span className="font-display text-[17px] tracking-tight">Elevate</span>
        </div>
        <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground transition">Sign in</Link>
      </header>

      <main className="container mx-auto px-6 relative">
        <section className="pt-20 pb-32 max-w-4xl">
          <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">A transformation engine · est. 2026</p>
          <h1 className="mt-6 font-display text-[clamp(3rem,9vw,7.5rem)] leading-[0.95] tracking-[-0.04em] font-light">
            Become<br/>
            <span className="italic font-normal text-gradient">who you</span><br/>
            already are.
          </h1>
          <p className="mt-10 text-lg text-muted-foreground max-w-xl leading-relaxed">
            Fifty specialist AI coaches. One quiet companion that remembers everything.
            Built for the version of you that's already begun.
          </p>
          <div className="mt-12 flex flex-wrap items-center gap-5">
            <Link to="/login" className="group inline-flex items-center gap-2 rounded-full grad-warm px-7 py-3.5 text-sm font-medium text-background shadow-[var(--shadow-glow)] hover:opacity-95 transition">
              Begin <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition" />
            </Link>
            <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline">
              Already on the path →
            </Link>
          </div>
        </section>

        {/* editorial trio — overlapping */}
        <section className="relative pb-32 max-w-5xl">
          <div className="grid md:grid-cols-12 gap-6">
            <article className="md:col-span-7 warm-card rounded-[2rem] p-8 md:p-10 relative ambient-warm">
              <p className="text-[10px] uppercase tracking-[0.3em] text-primary">01 — Specialist coaches</p>
              <h3 className="mt-4 font-display text-3xl md:text-4xl leading-tight">
                Each habit, its own <span className="italic">world-class mind</span>.
              </h3>
              <p className="mt-4 text-sm text-muted-foreground leading-relaxed max-w-md">
                CBT for anxiety. Allen Carr for nicotine. Progressive overload for strength.
                Every coach is trained in the actual framework behind the change.
              </p>
            </article>
            <article className="md:col-span-5 md:mt-12 warm-card rounded-[2rem] p-8">
              <p className="text-[10px] uppercase tracking-[0.3em] text-primary">02 — Streaks that breathe</p>
              <h3 className="mt-4 font-display text-3xl leading-tight italic">Shielded, not shamed.</h3>
              <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
                Life happens. Earn Shields. Spend them. Your story keeps its shape.
              </p>
            </article>
            <article className="md:col-span-5 md:-mt-6 warm-card rounded-[2rem] p-8">
              <p className="text-[10px] uppercase tracking-[0.3em] text-primary">03 — Identity, not points</p>
              <h3 className="mt-4 font-display text-3xl leading-tight">
                <span className="italic">You are becoming</span> someone.
              </h3>
              <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
                Day 21: you are a person who meditates. We track who, not what.
              </p>
            </article>
            <article className="md:col-span-7 warm-card rounded-[2rem] p-8 md:p-10">
              <p className="text-[10px] uppercase tracking-[0.3em] text-primary">04 — A letter, every Sunday</p>
              <h3 className="mt-4 font-display text-3xl md:text-4xl leading-tight">
                Not a dashboard. <span className="italic">A letter.</span>
              </h3>
              <p className="mt-4 text-sm text-muted-foreground leading-relaxed max-w-md">
                Each week, your coach writes to you. Personally. With memory.
                With warmth. With something to believe about who you're becoming.
              </p>
            </article>
          </div>
        </section>

        <section className="pb-24 max-w-3xl">
          <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Five worlds. Fifty paths.</p>
          <div className="mt-6 flex flex-wrap gap-2 text-xs">
            {["Fitness & Body","Mental Health","Quit Bad Habits","Mind & Learning","Productivity & Life"].map((c) => (
              <span key={c} className="rounded-full border border-primary/15 bg-card/40 px-4 py-2 text-foreground/80">{c}</span>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-border/60 py-10 text-center">
        <p className="font-display italic text-sm text-muted-foreground">Elevate · {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}
