import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Check } from "lucide-react";
import { listCatalog, activateTracks } from "@/lib/elevate.functions";
import { CATEGORY_CLASS } from "@/lib/categories";

export const Route = createFileRoute("/_authenticated/onboarding")({ component: Onboarding });

function Onboarding() {
  const list = useServerFn(listCatalog);
  const act = useServerFn(activateTracks);
  const nav = useNavigate();
  const { data } = useQuery({ queryKey: ["catalog"], queryFn: () => list() });
  const [picked, setPicked] = useState<string[]>([]);
  const m = useMutation({
    mutationFn: (ids: string[]) => act({ data: { trackIds: ids } }),
    onSuccess: () => { toast.success("Your tracks are ready"); nav({ to: "/app" }); },
    onError: (e: any) => toast.error(e.message),
  });

  const toggle = (id: string) => setPicked(p => p.includes(id) ? p.filter(x=>x!==id) : p.length < 5 ? [...p, id] : p);

  const grouped = (data ?? []).reduce((acc: any, t: any) => { (acc[t.category] ||= []).push(t); return acc; }, {});

  return (
    <div className="container mx-auto px-6 py-10 max-w-4xl">
      <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Pick your <span className="text-gradient">top 5</span></h1>
      <p className="mt-2 text-muted-foreground">Start small. You can add more anytime. {picked.length}/5 selected.</p>

      <div className="mt-8 space-y-8">
        {Object.entries(grouped).map(([cat, tracks]: any) => (
          <section key={cat}>
            <h2 className="text-xs uppercase tracking-widest text-muted-foreground mb-3">{cat}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {tracks.map((t: any) => {
                const on = picked.includes(t.id);
                return (
                  <button key={t.id} onClick={()=>toggle(t.id)}
                    className={`relative text-left rounded-xl p-3 border transition ${on ? "border-primary bg-accent" : "border-border bg-card/50 hover:border-primary/30"}`}>
                    <div className={`h-8 w-8 rounded-lg ${CATEGORY_CLASS[t.category]} flex items-center justify-center text-background text-[10px] font-bold mb-2`}>
                      {t.name.slice(0,2).toUpperCase()}
                    </div>
                    <p className="text-sm font-medium">{t.name}</p>
                    <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{t.short_description}</p>
                    {on && <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center"><Check className="h-3 w-3"/></div>}
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <div className="sticky bottom-4 mt-10 flex justify-center">
        <button disabled={picked.length===0 || m.isPending} onClick={()=>m.mutate(picked)}
          className="rounded-full bg-primary text-primary-foreground px-8 py-3 font-semibold shadow-[var(--shadow-glow)] disabled:opacity-40">
          {m.isPending ? "Activating…" : `Activate ${picked.length} track${picked.length===1?"":"s"}`}
        </button>
      </div>
    </div>
  );
}
