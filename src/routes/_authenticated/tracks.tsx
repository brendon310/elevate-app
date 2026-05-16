import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Plus, Check } from "lucide-react";
import { motion } from "framer-motion";
import { listCatalog, listUserTracks, activateTracks } from "@/lib/elevate.functions";
import { trackHueGradient, trackHueVar } from "@/lib/categories";

export const Route = createFileRoute("/_authenticated/tracks")({ component: TracksPage });

function TracksPage() {
  const list = useServerFn(listCatalog);
  const listUT = useServerFn(listUserTracks);
  const act = useServerFn(activateTracks);
  const qc = useQueryClient();
  const { data: catalog } = useQuery({ queryKey: ["catalog"], queryFn: () => list() });
  const { data: ut } = useQuery({ queryKey: ["userTracks"], queryFn: () => listUT() });
  const activeIds = new Set((ut ?? []).map((u: any) => u.track_id));

  const m = useMutation({
    mutationFn: (id: string) => act({ data: { trackIds: [id] } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["userTracks"] }); toast.success("Track added"); },
    onError: (e: any) => toast.error(e.message),
  });

  const grouped = (catalog ?? []).reduce((acc: any, t: any) => { (acc[t.category] ||= []).push(t); return acc; }, {});

  return (
    <div className="max-w-5xl mx-auto px-5 py-8 pb-24">
      <p className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground font-mono">Library</p>
      <h1 className="mt-2 font-display text-4xl tracking-tight">Fifty <span className="text-electric">specialists</span>.</h1>
      <p className="mt-2 text-foreground/70">Pick the one that calls you today.</p>

      <div className="mt-10 space-y-10">
        {Object.entries(grouped).map(([cat, tracks]: any) => (
          <section key={cat}>
            <h2 className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground font-mono mb-4">{cat}</h2>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              {tracks.map((t: any, i: number) => {
                const on = activeIds.has(t.id);
                const seed = t.slug || t.name;
                const hueVar = trackHueVar(seed, cat);
                const grad = trackHueGradient(seed, cat);
                return (
                  <motion.div key={t.id}
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.02, duration: 0.4 }}
                    className="relative rounded-3xl p-4 depth-card btn-chunk overflow-hidden">
                    <div aria-hidden className="absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-60 blur-xl"
                      style={{ background: grad }}/>
                    <div className="relative flex items-start gap-3">
                      <div className="h-12 w-12 rounded-2xl flex items-center justify-center text-white font-display text-sm shrink-0"
                        style={{ background: grad, boxShadow: `0 8px 18px -6px color-mix(in oklab, var(${hueVar}) 60%, transparent)` }}>
                        {t.name.slice(0,2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-[14px] leading-tight">{t.name}</p>
                        <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2 leading-snug">{t.short_description}</p>
                      </div>
                    </div>
                    <div className="relative mt-3">
                      {on ? (
                        <Link to="/track/$slug" params={{slug:t.slug}} className="inline-flex items-center gap-1 text-xs font-semibold" style={{ color: `var(${hueVar})` }}>
                          <Check className="h-3 w-3"/> Active · open →
                        </Link>
                      ) : (
                        <button onClick={()=>m.mutate(t.id)} disabled={m.isPending}
                          className="btn-chunk inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-semibold text-white disabled:opacity-50"
                          style={{ background: grad }}>
                          <Plus className="h-3 w-3"/> Activate
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
