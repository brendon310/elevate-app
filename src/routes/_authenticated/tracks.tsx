import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { listCatalog, listUserTracks, activateTracks } from "@/lib/elevate.functions";
import { CATEGORY_CLASS } from "@/lib/categories";

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
    <div className="container mx-auto px-6 py-8 max-w-5xl">
      <h1 className="text-3xl font-bold tracking-tight">All Tracks</h1>
      <p className="text-muted-foreground mt-1">50 specialist AI coaches.</p>

      <div className="mt-8 space-y-8">
        {Object.entries(grouped).map(([cat, tracks]: any) => (
          <section key={cat}>
            <h2 className="text-xs uppercase tracking-widest text-muted-foreground mb-3">{cat}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {tracks.map((t: any) => {
                const on = activeIds.has(t.id);
                return (
                  <div key={t.id} className="glass rounded-xl p-4 flex items-start gap-3">
                    <div className={`h-10 w-10 rounded-lg ${CATEGORY_CLASS[t.category]} flex items-center justify-center text-background text-xs font-bold shrink-0`}>
                      {t.name.slice(0,2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{t.name}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{t.short_description}</p>
                      <div className="mt-2 flex gap-2">
                        {on ? (
                          <Link to="/track/$slug" params={{slug:t.slug}} className="text-xs text-primary hover:underline">Open →</Link>
                        ) : (
                          <button onClick={()=>m.mutate(t.id)} disabled={m.isPending} className="inline-flex items-center gap-1 text-xs text-primary hover:underline disabled:opacity-50">
                            <Plus className="h-3 w-3"/> Activate
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
