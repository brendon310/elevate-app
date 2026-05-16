import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Flame, ArrowLeft, Send, Check, Lock, Sparkles, Trophy, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  getJourney, startJourney, completeJourneyDay, ensureDaysGenerated,
  getReEntryMessage, getMilestoneMessage, sendCoachMessage, getTrackDetail,
} from "@/lib/elevate.functions";
import { CATEGORY_CLASS } from "@/lib/categories";

export const Route = createFileRoute("/_authenticated/track/$slug")({ component: TrackDetail });

const DURATIONS = [
  { v: 30, l: "30 days" }, { v: 60, l: "60 days" }, { v: 90, l: "90 days" },
  { v: 180, l: "6 months" }, { v: 365, l: "1 year" },
];
const STARTS = [
  { v: "beginner", l: "Beginner" },
  { v: "been_trying", l: "Been trying" },
  { v: "relapsed", l: "Relapsed" },
  { v: "intermediate", l: "Intermediate" },
  { v: "advanced", l: "Advanced" },
];
const MILESTONES = [1,3,7,14,21,30,60,90,180,365];

function TrackDetail() {
  const { slug } = Route.useParams();
  const qc = useQueryClient();
  const getJ = useServerFn(getJourney);
  const { data, isLoading } = useQuery({ queryKey: ["journey", slug], queryFn: () => getJ({ data: { slug } }) });

  if (isLoading || !data) return <div className="p-10 text-muted-foreground">Loading…</div>;

  // No journey yet → onboarding
  if (!data.journey) {
    return <JourneyOnboarding slug={slug} catalog={data.catalog} onDone={() => qc.invalidateQueries({ queryKey: ["journey", slug] })} />;
  }

  return <JourneyView slug={slug} data={data} />;
}

function JourneyOnboarding({ slug, catalog, onDone }: any) {
  const startFn = useServerFn(startJourney);
  const [totalDays, setTotalDays] = useState<number>(30);
  const [custom, setCustom] = useState("");
  const [startingPoint, setStartingPoint] = useState("beginner");
  const [motivation, setMotivation] = useState("");
  const [obstacle, setObstacle] = useState("");

  const mut = useMutation({
    mutationFn: () => startFn({ data: {
      trackId: catalog.id,
      totalDays: custom ? Math.max(7, Math.min(365, Number(custom) || 30)) : totalDays,
      startingPoint: startingPoint as any,
      motivation, obstacle,
    } }),
    onSuccess: () => { toast.success("Your journey is ready"); onDone(); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="container mx-auto px-6 py-8 max-w-2xl">
      <Link to="/app" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"><ArrowLeft className="h-4 w-4"/> Back</Link>
      <div className="glass rounded-3xl p-6 relative overflow-hidden">
        <div className={`absolute -right-10 -top-10 h-40 w-40 rounded-full ${CATEGORY_CLASS[catalog.category]} opacity-40 blur-3xl`}/>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">{catalog.category}</p>
        <h1 className="text-3xl font-bold tracking-tight mt-1">{catalog.name}</h1>
        <p className="text-sm text-muted-foreground mt-2">Let's build your personalized journey.</p>
      </div>

      <section className="mt-6 glass rounded-2xl p-5 space-y-6">
        <div>
          <h3 className="text-sm font-semibold mb-3">How long do you want this journey to be?</h3>
          <div className="flex flex-wrap gap-2">
            {DURATIONS.map(d => (
              <button key={d.v} onClick={() => { setTotalDays(d.v); setCustom(""); }}
                className={`px-4 py-2 rounded-full text-sm border ${!custom && totalDays === d.v ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-accent"}`}>
                {d.l}
              </button>
            ))}
            <input value={custom} onChange={e=>setCustom(e.target.value.replace(/\D/g,""))}
              placeholder="Custom (days)" className="px-4 py-2 rounded-full text-sm bg-transparent border border-border w-36" />
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold mb-3">What's your starting point?</h3>
          <div className="flex flex-wrap gap-2">
            {STARTS.map(s => (
              <button key={s.v} onClick={()=>setStartingPoint(s.v)}
                className={`px-4 py-2 rounded-full text-sm border ${startingPoint === s.v ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-accent"}`}>
                {s.l}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold mb-2">Your main motivation</h3>
          <textarea value={motivation} onChange={e=>setMotivation(e.target.value.slice(0,400))}
            placeholder="Max 2 sentences — what's driving this?"
            className="w-full rounded-xl bg-input border border-border p-3 text-sm outline-none focus:ring-2 focus:ring-ring min-h-[72px]" />
        </div>

        <div>
          <h3 className="text-sm font-semibold mb-2">Your biggest obstacle</h3>
          <textarea value={obstacle} onChange={e=>setObstacle(e.target.value.slice(0,400))}
            placeholder="Max 2 sentences — what gets in the way?"
            className="w-full rounded-xl bg-input border border-border p-3 text-sm outline-none focus:ring-2 focus:ring-ring min-h-[72px]" />
        </div>

        <button onClick={()=>mut.mutate()} disabled={mut.isPending}
          className="w-full rounded-full bg-primary text-primary-foreground px-5 py-3 text-sm font-semibold disabled:opacity-50 inline-flex items-center justify-center gap-2">
          <Sparkles className="h-4 w-4"/> {mut.isPending ? "Generating your journey…" : "Begin journey"}
        </button>
        <p className="text-[11px] text-muted-foreground text-center">Your first 10 days are generated now. Future days unlock as you progress.</p>
      </section>
    </div>
  );
}

function JourneyView({ slug, data }: any) {
  const qc = useQueryClient();
  const { catalog, userTrack, journey, days, currentDayNumber, missedDays } = data;
  const completeFn = useServerFn(completeJourneyDay);
  const ensureFn = useServerFn(ensureDaysGenerated);
  const reentryFn = useServerFn(getReEntryMessage);
  const milestoneFn = useServerFn(getMilestoneMessage);
  const detailFn = useServerFn(getTrackDetail);
  const sendFn = useServerFn(sendCoachMessage);

  const today = useMemo(() => (days as any[]).find((d:any) => d.day_number === currentDayNumber), [days, currentDayNumber]);
  const [openDay, setOpenDay] = useState<any | null>(null);
  const [note, setNote] = useState("");
  const [milestone, setMilestone] = useState<{ day: number; message: string; science: string } | null>(null);
  const [reentry, setReentry] = useState<string | null>(null);
  const [burst, setBurst] = useState(false);

  // Auto-generate next chunk when within 3 days of edge
  useEffect(() => {
    if (!journey) return;
    const need = Math.min(journey.total_days, currentDayNumber + 5);
    if (need > journey.generated_through) {
      ensureFn({ data: { journeyId: journey.id, throughDay: need } })
        .then(() => qc.invalidateQueries({ queryKey: ["journey", slug] }))
        .catch(()=>{});
    }
  }, [journey, currentDayNumber]);

  // Re-entry message
  useEffect(() => {
    if (missedDays >= 2 && !reentry) {
      reentryFn({ data: { slug, missedDays } }).then(r => setReentry(r.message)).catch(()=>{});
    }
  }, [missedDays, slug]);

  // Chat (per track)
  const { data: chat } = useQuery({ queryKey: ["track-chat", slug], queryFn: () => detailFn({ data: { slug } }) });
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chat?.messages?.length]);
  const sendMsg = useMutation({
    mutationFn: (content: string) => sendFn({ data: { userTrackId: userTrack.id, content } }),
    onSuccess: () => { setInput(""); qc.invalidateQueries({ queryKey: ["track-chat", slug] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const complete = useMutation({
    mutationFn: (dayId: string) => completeFn({ data: { dayId, note: note.trim() || undefined } }),
    onSuccess: async (r: any) => {
      setNote(""); setOpenDay(null);
      setBurst(true); setTimeout(()=>setBurst(false), 1200);
      qc.invalidateQueries({ queryKey: ["journey", slug] });
      qc.invalidateQueries({ queryKey: ["userTracks"] });
      if (r?.milestoneHit) {
        try {
          const m = await milestoneFn({ data: { slug, dayNumber: r.milestoneHit } });
          setMilestone({ day: r.milestoneHit, message: m.message, science: m.science });
        } catch {}
      } else {
        toast.success("Day complete 🔥");
      }
    },
    onError: (e: any) => toast.error(e.message),
  });

  const progress = Math.round((days.filter((d:any)=>d.completed_at).length / journey.total_days) * 100);
  const identityVerb = catalog.name.toLowerCase().split(/\s+/).slice(-1)[0].replace(/[^a-z]/g,"");
  const hasIdentity = userTrack.current_streak >= 21;

  return (
    <div className="container mx-auto px-6 py-8 max-w-4xl relative">
      {/* particle burst */}
      <AnimatePresence>
        {burst && (
          <div className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center">
            {Array.from({ length: 28 }).map((_, i) => {
              const angle = (i / 28) * Math.PI * 2;
              const dist = 120 + Math.random() * 100;
              return (
                <motion.span key={i}
                  initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                  animate={{ x: Math.cos(angle)*dist, y: Math.sin(angle)*dist, opacity: 0, scale: 0.4 }}
                  transition={{ duration: 0.9, ease: [0.2,0.8,0.2,1] }}
                  className="absolute h-2 w-2 rounded-full"
                  style={{ background: i % 2 ? "var(--primary)" : "var(--secondary)" }}/>
              );
            })}
          </div>
        )}
      </AnimatePresence>

      <Link to="/app" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"><ArrowLeft className="h-4 w-4"/> Back</Link>

      <motion.header initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="warm-card rounded-[2rem] p-8 relative overflow-hidden ambient-warm">
        <p className="text-[10px] uppercase tracking-[0.3em] text-primary">{catalog.category}</p>
        <h1 className="font-display text-4xl md:text-5xl tracking-tight mt-2 font-light">{catalog.name}</h1>
        {hasIdentity && (
          <p className="mt-3 font-display italic text-base text-foreground/80">
            You are someone who {identityVerb}s.
          </p>
        )}
        <div className="mt-6 flex flex-wrap items-end gap-6">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Streak</p>
            <div className="flex items-baseline gap-1.5 mt-1">
              <Flame className="h-5 w-5 text-primary self-center"/>
              <span className="font-display italic text-4xl text-gradient leading-none">{userTrack.current_streak}</span>
              <span className="text-xs text-muted-foreground">days</span>
            </div>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Day</p>
            <p className="font-display italic text-3xl mt-1 leading-none">{currentDayNumber}<span className="text-muted-foreground text-base"> / {journey.total_days}</span></p>
          </div>
          <div className="flex-1 min-w-[160px]">
            <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">{progress}% complete</p>
            <div className="mt-2 h-1.5 w-full rounded-full bg-accent/60 overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }}
                transition={{ type: "spring", stiffness: 70, damping: 18 }}
                className="h-full grad-warm" />
            </div>
          </div>
        </div>
      </motion.header>

      {reentry && (
        <section className="mt-4 glass rounded-2xl p-5 border border-primary/30">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-widest text-primary mb-1">Welcome back</p>
              <p className="text-sm whitespace-pre-wrap">{reentry}</p>
            </div>
            <button onClick={()=>setReentry(null)} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4"/></button>
          </div>
        </section>
      )}

      {today && (
        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-6 warm-card rounded-[2rem] p-8 relative overflow-hidden">
          <p className="text-[10px] uppercase tracking-[0.3em] text-primary">Today · Day {today.day_number}</p>
          <h2 className="font-display text-3xl mt-2 leading-tight">{today.title}</h2>
          <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{today.description}</p>

          <div className="mt-5 grid gap-3">
            <div className="rounded-2xl bg-accent/50 p-4">
              <p className="text-[11px] uppercase tracking-widest text-muted-foreground mb-1">Today's task</p>
              <p className="text-sm">{today.task}</p>
            </div>
            <div className="rounded-2xl bg-accent/50 p-4">
              <p className="text-[11px] uppercase tracking-widest text-muted-foreground mb-1">Reflection</p>
              <p className="text-sm">{today.reflection}</p>
            </div>
            <div className="rounded-2xl bg-accent/50 p-4">
              <p className="text-[11px] uppercase tracking-widest text-muted-foreground mb-1">Science</p>
              <p className="text-sm">{today.science}</p>
            </div>
          </div>

          {!today.completed_at ? (
            <div className="mt-5">
              <textarea value={note} onChange={e=>setNote(e.target.value)}
                placeholder={today.checkin_prompt}
                className="w-full rounded-2xl bg-input border border-border p-4 text-sm outline-none focus:ring-2 focus:ring-ring min-h-[88px] transition" />
              <button onClick={()=>complete.mutate(today.id)} disabled={complete.isPending}
                className={`mt-4 rounded-full grad-warm text-background px-6 py-3 text-sm font-medium shadow-[var(--shadow-glow)] disabled:opacity-50 inline-flex items-center gap-2 ${complete.isPending ? "breathe" : ""}`}>
                <Check className="h-4 w-4"/> {complete.isPending ? "Listening…" : `Complete day ${today.day_number}`}
              </button>
            </div>
          ) : (
            <div className="mt-5 text-sm text-primary inline-flex items-center gap-2 font-display italic"><Check className="h-4 w-4"/> Completed</div>
          )}
        </motion.section>
      )}

      <section className="mt-6 glass rounded-2xl p-5">
        <h2 className="text-xs uppercase tracking-widest text-muted-foreground mb-4">Journey map</h2>
        <div className="relative pl-6">
          <div className="absolute left-2 top-2 bottom-2 w-px bg-border"/>
          <div className="space-y-2 max-h-[480px] overflow-y-auto pr-2">
            {Array.from({ length: journey.total_days }).map((_, i) => {
              const dayNum = i + 1;
              const d = (days as any[]).find(x => x.day_number === dayNum);
              const isPast = dayNum < currentDayNumber;
              const isToday = dayNum === currentDayNumber;
              const isLocked = !d;
              const isMilestone = MILESTONES.includes(dayNum);
              return (
                <button key={dayNum} onClick={()=> d && setOpenDay(d)} disabled={!d}
                  className={`relative w-full text-left rounded-xl px-3 py-2 transition flex items-center gap-3 ${isToday ? "bg-primary/10 ring-1 ring-primary/40" : "hover:bg-accent/50"} ${isLocked ? "opacity-50 cursor-default" : ""}`}>
                  <span className={`absolute -left-[18px] top-1/2 -translate-y-1/2 h-3 w-3 rounded-full ${d?.completed_at ? "bg-primary" : isToday ? "bg-primary ring-4 ring-primary/20" : "bg-border"}`}/>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] uppercase tracking-widest text-muted-foreground">Day {dayNum}</span>
                      {isMilestone && <Trophy className="h-3 w-3 text-primary"/>}
                      {isLocked && <Lock className="h-3 w-3 text-muted-foreground"/>}
                    </div>
                    <p className="text-sm font-medium truncate">{d?.title ?? "Coming soon"}</p>
                  </div>
                  {d?.completed_at && <Check className="h-4 w-4 text-primary shrink-0"/>}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* AI coach chat */}
      <section className="mt-6 glass rounded-2xl p-5 flex flex-col h-[500px]">
        <h2 className="text-xs uppercase tracking-widest text-muted-foreground mb-3">AI Coach</h2>
        <div className="flex-1 overflow-y-auto space-y-3 pr-2">
          {(chat?.messages ?? []).length === 0 && (
            <p className="text-sm text-muted-foreground">Your coach knows your journey, your motivation, and your obstacle. Ask anything.</p>
          )}
          {(chat?.messages ?? []).map((m: any) => (
            <div key={m.id} className={m.role === "user" ? "flex justify-end" : ""}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${m.role==="user"?"bg-primary text-primary-foreground":"bg-accent text-foreground"}`}>{m.content}</div>
            </div>
          ))}
          {sendMsg.isPending && <div className="text-xs text-muted-foreground animate-pulse">Coach is thinking…</div>}
          <div ref={endRef}/>
        </div>
        <form onSubmit={(e)=>{e.preventDefault(); if(input.trim()) sendMsg.mutate(input.trim());}} className="mt-3 flex gap-2">
          <input value={input} onChange={(e)=>setInput(e.target.value)} placeholder="Message your coach…"
            className="flex-1 rounded-full bg-input border border-border px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" />
          <button type="submit" disabled={!input.trim() || sendMsg.isPending} className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-50">
            <Send className="h-4 w-4"/>
          </button>
        </form>
      </section>

      {/* Day detail modal */}
      {openDay && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4" onClick={()=>setOpenDay(null)}>
          <div className="glass rounded-3xl w-full max-w-lg p-6 max-h-[85vh] overflow-y-auto" onClick={e=>e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground">Day {openDay.day_number}</p>
                <h3 className="text-xl font-bold mt-1">{openDay.title}</h3>
              </div>
              <button onClick={()=>setOpenDay(null)} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4"/></button>
            </div>
            <p className="text-sm text-muted-foreground mt-3">{openDay.description}</p>
            <div className="mt-4 space-y-3">
              <div className="rounded-xl bg-accent/50 p-3"><p className="text-[11px] uppercase tracking-widest text-muted-foreground mb-1">Task</p><p className="text-sm">{openDay.task}</p></div>
              <div className="rounded-xl bg-accent/50 p-3"><p className="text-[11px] uppercase tracking-widest text-muted-foreground mb-1">Reflection</p><p className="text-sm">{openDay.reflection}</p></div>
              <div className="rounded-xl bg-accent/50 p-3"><p className="text-[11px] uppercase tracking-widest text-muted-foreground mb-1">Science</p><p className="text-sm">{openDay.science}</p></div>
              {openDay.user_note && (
                <div className="rounded-xl bg-primary/10 p-3"><p className="text-[11px] uppercase tracking-widest text-primary mb-1">Your note</p><p className="text-sm whitespace-pre-wrap">{openDay.user_note}</p></div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Milestone modal */}
      {milestone && (
        <div className="fixed inset-0 z-50 bg-background/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass rounded-3xl w-full max-w-md p-8 text-center relative overflow-hidden">
            <div className="absolute -top-20 -right-20 h-60 w-60 rounded-full bg-primary opacity-20 blur-3xl"/>
            <div className="relative">
              <div className="mx-auto h-20 w-20 rounded-full bg-primary/20 flex items-center justify-center">
                <Trophy className="h-10 w-10 text-primary"/>
              </div>
              <p className="text-xs uppercase tracking-widest text-primary mt-4">Milestone unlocked</p>
              <h2 className="text-3xl font-bold mt-1">Day {milestone.day}</h2>
              <p className="text-sm mt-4 whitespace-pre-wrap">{milestone.message}</p>
              {milestone.science && (
                <div className="mt-5 rounded-xl bg-accent/50 p-3 text-left">
                  <p className="text-[11px] uppercase tracking-widest text-muted-foreground mb-1">What's happening</p>
                  <p className="text-sm">{milestone.science}</p>
                </div>
              )}
              <div className="mt-6 flex gap-2">
                <button onClick={()=>setMilestone(null)} className="flex-1 rounded-full bg-primary text-primary-foreground px-5 py-2.5 text-sm font-semibold">Continue</button>
                <button onClick={()=>{
                  const text = `Day ${milestone.day} on ${catalog.name} — ${milestone.message}`;
                  if (navigator.share) navigator.share({ text }).catch(()=>{});
                  else { navigator.clipboard.writeText(text); toast.success("Copied"); }
                }} className="flex-1 rounded-full border border-border px-5 py-2.5 text-sm font-semibold hover:bg-accent">Share</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}