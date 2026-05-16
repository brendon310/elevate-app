import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Flame, ArrowLeft, Send, Check } from "lucide-react";
import { getTrackDetail, logCheckIn, sendCoachMessage, activateTracks } from "@/lib/elevate.functions";
import { CATEGORY_CLASS } from "@/lib/categories";

export const Route = createFileRoute("/_authenticated/track/")({ component: TrackDetail });

function TrackDetail() {
  const { slug } = Route.useParams();
  const getDetail = useServerFn(getTrackDetail);
  const logFn = useServerFn(logCheckIn);
  const sendFn = useServerFn(sendCoachMessage);
  const actFn = useServerFn(activateTracks);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["track", slug], queryFn: () => getDetail({ data: { slug } }) });
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [data?.messages?.length]);

  const checkIn = useMutation({
    mutationFn: () => logFn({ data: { userTrackId: data!.userTrack!.id, completed: true } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["track", slug] }); qc.invalidateQueries({ queryKey: ["userTracks"] }); toast.success("Checked in 🔥"); },
    onError: (e: any) => toast.error(e.message),
  });

  const sendMsg = useMutation({
    mutationFn: (content: string) => sendFn({ data: { userTrackId: data!.userTrack!.id, content } }),
    onSuccess: () => { setInput(""); qc.invalidateQueries({ queryKey: ["track", slug] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const activate = useMutation({
    mutationFn: () => actFn({ data: { trackIds: [data!.catalog.id] } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["track", slug] }),
  });

  if (isLoading || !data) return <div className="p-10 text-muted-foreground">Loading…</div>;
  const { catalog, userTrack, logs, messages } = data;

  // Heatmap: last 84 days
  const today = new Date();
  const cells = Array.from({ length: 84 }).map((_, i) => {
    const d = new Date(today); d.setDate(d.getDate() - (83 - i));
    const ds = d.toISOString().slice(0,10);
    const log = (logs ?? []).find((l: any) => l.log_date === ds);
    return { date: ds, on: !!log?.completed };
  });

  return (
    <div className="container mx-auto px-6 py-8 max-w-4xl">
      <Link to="/app" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"><ArrowLeft className="h-4 w-4"/> Back</Link>

      <header className="glass rounded-3xl p-6 relative overflow-hidden">
        <div className={`absolute -right-10 -top-10 h-40 w-40 rounded-full ${CATEGORY_CLASS[catalog.category]} opacity-40 blur-3xl`}/>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">{catalog.category}</p>
        <h1 className="text-3xl font-bold tracking-tight mt-1">{catalog.name}</h1>
        <p className="text-sm text-muted-foreground mt-2 max-w-xl">{catalog.short_description}</p>
        <p className="text-[11px] text-muted-foreground/70 mt-2">Frameworks: {catalog.frameworks}</p>

        {userTrack ? (
          <div className="mt-5 flex items-center gap-4">
            <div className="flex items-center gap-2 text-2xl font-bold"><Flame className="h-6 w-6 text-primary"/>{userTrack.current_streak}<span className="text-sm font-normal text-muted-foreground">day streak</span></div>
            <button onClick={()=>checkIn.mutate()} disabled={checkIn.isPending} className="rounded-full bg-primary text-primary-foreground px-5 py-2 text-sm font-semibold disabled:opacity-50 inline-flex items-center gap-1">
              <Check className="h-4 w-4"/> Check in today
            </button>
          </div>
        ) : (
          <button onClick={()=>activate.mutate()} disabled={activate.isPending} className="mt-5 rounded-full bg-primary text-primary-foreground px-5 py-2 text-sm font-semibold">
            Activate this track
          </button>
        )}
      </header>

      {userTrack && (
        <>
          <section className="mt-6 glass rounded-2xl p-5">
            <h2 className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Last 84 days</h2>
            <div className="grid grid-cols-[repeat(28,minmax(0,1fr))] gap-1">
              {cells.map((c, i) => (
                <div key={i} title={c.date} className={`aspect-square rounded-[3px] ${c.on ? "bg-primary" : "bg-accent"}`} />
              ))}
            </div>
          </section>

          <section className="mt-6 glass rounded-2xl p-5 flex flex-col h-[500px]">
            <h2 className="text-xs uppercase tracking-widest text-muted-foreground mb-3">AI Coach</h2>
            <div className="flex-1 overflow-y-auto space-y-3 pr-2">
              {messages.length === 0 && (
                <p className="text-sm text-muted-foreground">Say hi to your {catalog.name.toLowerCase()} coach. Share where you're starting from, your motivation, and what's gotten in the way before.</p>
              )}
              {messages.map((m: any) => (
                <div key={m.id} className={m.role === "user" ? "flex justify-end" : ""}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${m.role==="user"?"bg-primary text-primary-foreground":"bg-accent text-foreground"}`}>
                    {m.content}
                  </div>
                </div>
              ))}
              {sendMsg.isPending && <div className="text-xs text-muted-foreground animate-pulse">Coach is thinking…</div>}
              <div ref={endRef} />
            </div>
            <form onSubmit={(e)=>{e.preventDefault(); if(input.trim()) sendMsg.mutate(input.trim());}} className="mt-3 flex gap-2">
              <input value={input} onChange={(e)=>setInput(e.target.value)} placeholder="Message your coach…"
                className="flex-1 rounded-full bg-input border border-border px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" />
              <button type="submit" disabled={!input.trim() || sendMsg.isPending} className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-50">
                <Send className="h-4 w-4"/>
              </button>
            </form>
          </section>
        </>
      )}
    </div>
  );
}
