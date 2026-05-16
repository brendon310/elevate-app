import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect } from "react";
import { Flame, Plus, TrendingUp } from "lucide-react";
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
    <div className="container mx-auto px-6 py-8 max-w-5xl">
      <header className="flex items-end justify-between mb-8">
        <div>
          <p className="text-sm text-muted-foreground">Welcome back</p>
          <h1 className="text-3xl font-bold tracking-tight">Your Elevate</h1>
        </div>
        <Link to="/tracks" className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
          <Plus className="h-4 w-4"/> Add track
        </Link>
      </header>

      <section className="glass rounded-3xl p-8 mb-8 relative overflow-hidden">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full grad-productivity opacity-30 blur-3xl"/>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Elevate Score</p>
        <div className="mt-2 flex items-baseline gap-3">
          <span className="text-6xl font-bold text-gradient">{score}</span>
          <span className="text-muted-foreground text-sm flex items-center gap-1"><TrendingUp className="h-4 w-4"/>across {data?.length ?? 0} active tracks</span>
        </div>
      </section>

      <h2 className="text-sm uppercase tracking-widest text-muted-foreground mb-4">Active tracks</h2>
      <div className="grid sm:grid-cols-2 gap-4">
        {data?.map((ut: any) => (
          <Link key={ut.id} to="/track/$slug" params={{slug: ut.track.slug}} className="group glass rounded-2xl p-5 hover:border-primary/30 transition">
            <div className="flex items-center justify-between">
              <div className={`h-10 w-10 rounded-xl ${CATEGORY_CLASS[ut.track.category]} flex items-center justify-center text-background font-bold text-xs`}>
                {ut.track.name.slice(0,2).toUpperCase()}
              </div>
              <div className="flex items-center gap-1 text-sm text-primary">
                <Flame className="h-4 w-4"/>{ut.current_streak}d
              </div>
            </div>
            <h3 className="mt-4 font-semibold">{ut.track.name}</h3>
            <p className="text-xs text-muted-foreground mt-1">{ut.track.category}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
