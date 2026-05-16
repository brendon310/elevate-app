import { motion } from "framer-motion";
import { Flame, Zap, AlertTriangle, Sparkles } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  computeMomentum,
  evolutionFor,
  detectFlow,
  atRiskTracks,
  maxStreak,
  type TrackLike,
} from "@/lib/momentum";

function useCountUp(target: number, duration = 900) {
  const [v, setV] = useState(0);
  useEffect(() => {
    const start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setV(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return v;
}

export function MomentumHero({ tracks }: { tracks: TrackLike[] }) {
  const m = computeMomentum(tracks);
  const evo = evolutionFor(maxStreak(tracks));
  const inFlow = detectFlow(tracks);
  const atRisk = atRiskTracks(tracks);
  const animated = useCountUp(m.score);
  const pct = m.score / 1000;

  // SVG arc
  const size = 168;
  const stroke = 12;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;

  return (
    <div className="space-y-3 mb-7">
      {/* Hero card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="rounded-3xl p-5 depth-card relative overflow-hidden"
      >
        <div aria-hidden className="absolute -right-16 -top-16 h-56 w-56 rounded-full opacity-20 blur-3xl"
          style={{ background: "radial-gradient(circle, oklch(0.875 0.185 95), transparent 60%)" }} />

        <div className="flex items-center gap-5 relative">
          <div className="relative shrink-0" style={{ width: size, height: size }}>
            {/* Evolution ring */}
            <div className={`absolute inset-0 rounded-full ${evo.ringClass}`} style={{ padding: 3 }}>
              <div className="h-full w-full rounded-full bg-card" />
            </div>
            {/* Progress arc */}
            <svg width={size} height={size} className="absolute inset-0 -rotate-90">
              <circle cx={size/2} cy={size/2} r={r} stroke="oklch(0.92 0 0)" strokeWidth={stroke} fill="none" />
              <motion.circle
                cx={size/2} cy={size/2} r={r}
                stroke="oklch(0.18 0 0)"
                strokeWidth={stroke}
                strokeLinecap="round"
                fill="none"
                strokeDasharray={c}
                initial={{ strokeDashoffset: c }}
                animate={{ strokeDashoffset: c - c * pct }}
                transition={{ type: "spring", stiffness: 50, damping: 18 }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-[9px] uppercase tracking-[0.3em] text-muted-foreground font-mono">Momentum</p>
              <p className="font-display text-[3.25rem] leading-none num text-foreground num-rise">{animated}</p>
              <p className="text-[10px] text-muted-foreground font-mono">/ 1000</p>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-foreground text-background px-2.5 py-1 text-[10px] font-mono uppercase tracking-[0.2em] mb-2">
              <Sparkles className="h-3 w-3" /> {evo.label}
            </div>
            <h2 className="font-display text-2xl leading-tight tracking-tight">
              {m.score >= 700 ? "You're on fire." : m.score >= 400 ? "Momentum is building." : m.score >= 150 ? "You've started. Don't stop." : "Today is day one."}
            </h2>
            {evo.next && (
              <p className="mt-2 text-xs text-muted-foreground">
                <span className="num font-semibold text-foreground">{evo.daysToNext}</span> day{evo.daysToNext === 1 ? "" : "s"} to <span className="font-semibold text-foreground">{evolutionFor(evo.next).label}</span>
              </p>
            )}
            <div className="mt-3 grid grid-cols-4 gap-1.5">
              <Meter label="Today" v={m.today} max={250} />
              <Meter label="Streak" v={m.consistency} max={400} />
              <Meter label="Depth" v={m.longevity} max={200} />
              <Meter label="Breadth" v={m.breadth} max={150} />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Flow Mode banner */}
      {inFlow && (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flow-banner rounded-2xl p-3.5 flex items-center gap-3 text-white"
        >
          <Zap className="h-5 w-5 shrink-0" fill="currentColor" />
          <div className="flex-1 min-w-0">
            <p className="font-display text-sm leading-tight">You are in flow right now.</p>
            <p className="text-[11px] opacity-90">Protect this. Don't break the rhythm.</p>
          </div>
        </motion.div>
      )}

      {/* At-risk streak intervention */}
      {atRisk.map((t) => (
        <motion.div
          key={t.id}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          className="rounded-2xl p-3.5 border-2 border-[color:var(--secondary)] bg-card flex items-center gap-3"
        >
          <AlertTriangle className="h-5 w-5 text-[color:var(--secondary)] shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm leading-tight">
              Your <span className="num">{t.current_streak}</span>-day streak on <span className="truncate">{t.track?.name}</span> is at risk.
            </p>
            <p className="text-[11px] text-muted-foreground">Check in today. I know you can do this.</p>
          </div>
          {t.track?.slug && (
            <Link
              to="/track/$slug"
              params={{ slug: t.track.slug }}
              className="shrink-0 rounded-full bg-[color:var(--secondary)] text-white px-3 py-1.5 text-xs font-semibold flex items-center gap-1"
            >
              <Flame className="h-3 w-3" /> Save it
            </Link>
          )}
        </motion.div>
      ))}
    </div>
  );
}

function Meter({ label, v, max }: { label: string; v: number; max: number }) {
  const pct = Math.min(100, (v / max) * 100);
  return (
    <div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: [0.2, 0.9, 0.2, 1] }}
          className="h-full bg-foreground rounded-full"
        />
      </div>
      <p className="mt-1 text-[9px] uppercase tracking-[0.2em] text-muted-foreground font-mono">{label}</p>
    </div>
  );
}