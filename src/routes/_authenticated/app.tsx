import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect } from "react";
import { Flame, Plus, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { listUserTracks } from "@/lib/elevate.functions";
import { CATEGORY_CLASS } from "@/lib/categories";

export const Route = createFileRoute("/_authenticated/app")({ component: Dashboard });

function Dashboard() {
  const fn = useServerFn(listUserTracks);
  const nav = useNavigate();
  const { data, isLoading } = useQuery({ queryKey: ["userTracks"], queryFn: () => fn() });

  useEffect(() => {
    if (!isLoading && data && data.length === 0) nav({ to: "/onboarding" });
  }, [isLoading, data, nav]);

  const score = data ? Math.min(100, Math.round(data.reduce((s:number,t:any)=>s+Math.min(30,t.current_streak||0),0) / Math.max(1, data.length) * 3.33)) : 0;

  return (
    <div className="container mx-auto px-6 py-10 max-w-5xl">
      <header className="flex items-end justify-between mb-10">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Welcome back</p>
          <h1 className="mt-2 font-display text-4xl md:text-5xl tracking-tight font-light">Your <span className="italic">elevate</span></h1>
        </div>
        <Link to="/tracks" className="inline-flex items-center gap-2 rounded-full grad-warm text-background px-4 py-2 text-sm font-medium shadow-[var(--shadow-glow)]">
          <Plus className="h-4 w-4"/> Add track
        </Link>
      </header>

      <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.2,0.8,0.2,1] }}
        className="warm-card rounded-[2rem] p-10 mb-10 relative overflow-hidden ambient-warm">
        <p className="text-[10px] uppercase tracking-[0.3em] text-primary">Elevate Score</p>
        <div className="mt-3 flex items-baseline gap-4">
          <span className="font-display italic text-[7rem] leading-none text-gradient font-light">{score}</span>
          <span className="text-muted-foreground text-sm flex items-center gap-1.5"><TrendingUp className="h-4 w-4"/>across {data?.length ?? 0} active {data?.length === 1 ? "path" : "paths"}</span>
        </div>
      </motion.section>

      <h2 className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-5">Active paths</h2>
      <div className="grid sm:grid-cols-2 gap-4">
        {data?.map((ut: any, i: number) => (
          <motion.div key={ut.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05, duration: 0.5 }}>
            <Link to="/track/$slug" params={{slug: ut.track.slug}}
              className="group block warm-card rounded-2xl p-5 hover:border-primary/40 transition-all hover:-translate-y-0.5">
              <div className="flex items-center justify-between">
                <div className={`h-11 w-11 rounded-xl ${CATEGORY_CLASS[ut.track.category]} flex items-center justify-center text-background font-display text-sm`}>
                  {ut.track.name.slice(0,2)}
                </div>
                <div className="flex items-baseline gap-1 text-primary">
                  <Flame className="h-4 w-4"/>
                  <span className="font-display italic text-2xl leading-none">{ut.current_streak}</span>
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground">d</span>
                </div>
              </div>
              <h3 className="mt-5 font-display text-xl leading-tight">{ut.track.name}</h3>
              <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground mt-1.5">{ut.track.category}</p>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
