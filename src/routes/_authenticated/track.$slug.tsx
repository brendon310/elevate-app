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
  validateCheckin,
} from "@/lib/elevate.functions";
import { CATEGORY_CLASS, trackHueGradient, trackHueVar } from "@/lib/categories";

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
  const [validationError, setValidationError] = useState<string | null>(null);
  const [validationState, setValidationState] = useState<"idle" | "checking" | "valid" | "invalid">("idle");
  const validateFn = useServerFn(validateCheckin);
  const validateReqId = useRef(0);

  useEffect(() => {
    if (!openDay) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpenDay(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openDay]);

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

  const WARNINGS = [
    "Hey… the task won't complete itself 👀",
    "Day 0 is calling. Don't pick up. 📵",
    "Your future self is watching. Fill this in. 👁️",
    "The coach knows when you're faking it. 😑",
    "Empty field = empty progress. Come on. 💪",
    "You didn't come this far to leave this blank. ✍️",
    "This is the work. Do the work. 🔥",
    "Skip this and your streak cries tonight. 😢",
    "Not even one sentence? Really? 🤨",
    "The only bad answer is no answer. Go.",
  ];

  const AI_WARNINGS = [
    "Your coach has a PhD in detecting nonsense. Try again. 🎓",
    "That answer and your journey have nothing in common. 👀",
    "The AI read that and physically cringed. Be real. 😬",
    "Keyboard smashing is not a reflection. Come on. ⌨️",
    "Your future self deserves a real answer. Give them one. 🔮",
    `The coach knows what day ${currentDayNumber} of this journey actually feels like. That's not it. 💀`,
    "Detected: zero effort. Required: at least some effort. 📊",
    "A tronco a day keeps progress away. Write something real. 🪵",
    "Even your subconscious knows that wasn't genuine. Try again. 🧠",
  ];

  const runValidation = async () => {
    const trimmed = note.trim();
    if (!trimmed || !today) {
      setValidationState("idle");
      return;
    }
    const reqId = ++validateReqId.current;
    setValidationState("checking");
    setValidationError(null);
    try {
      const res = await validateFn({ data: { slug, dayNumber: today.day_number, text: trimmed } });
      if (reqId !== validateReqId.current) return;
      if (res.valid) {
        setValidationState("valid");
        setValidationError(null);
      } else {
        setValidationState("invalid");
        setValidationError(AI_WARNINGS[Math.floor(Math.random() * AI_WARNINGS.length)]);
      }
    } catch {
      if (reqId !== validateReqId.current) return;
      setValidationState("idle"); // fail-open
    }
  };

  const complete = useMutation({
    mutationFn: (dayId: string) => completeFn({ data: { dayId, note: note.trim() || undefined } }),
    onSuccess: async (r: any) => {
      setNote(""); setOpenDay(null); setValidationError(null); setValidationState("idle");
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
        className="rounded-[2rem] p-8 relative overflow-hidden depth-card"
        style={{ background: trackHueGradient(slug), boxShadow: `0 30px 70px -20px color-mix(in oklab, var(${trackHueVar(slug)}) 55%, transparent)` }}>
        <div aria-hidden className="absolute -right-20 -top-20 h-72 w-72 rounded-full opacity-50 blur-3xl"
          style={{ background: `radial-gradient(circle, oklch(1 0 0 / 0.4), transparent 60%)` }}/>
        <div aria-hidden className="absolute -left-10 -bottom-20 h-60 w-60 rounded-full opacity-35 blur-3xl"
          style={{ background: `radial-gradient(circle, oklch(0 0 0 / 0.6), transparent 65%)` }}/>

        <div className="relative">
          <p className="text-[11px] uppercase tracking-[0.3em] text-white font-mono">{catalog.category}</p>
          <h1 className="font-display text-4xl md:text-5xl tracking-[-0.03em] mt-2 text-white">{catalog.name}</h1>
          {hasIdentity && (
            <p className="mt-3 text-sm text-white">You are someone who <span className="font-semibold">{identityVerb}s</span>.</p>
          )}

          {/* Massive day counter */}
          <div className="mt-8 flex items-end gap-5">
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-white font-mono">Day</p>
              <p className="font-display text-[7rem] leading-[0.8] tracking-[-0.06em] text-white num">{currentDayNumber}</p>
              <p className="text-xs text-white font-mono num mt-1">of {journey.total_days}</p>
            </div>
            <div className="flex-1 pb-2">
              <div className="flex items-baseline gap-2 mb-2">
                <Flame className="h-5 w-5 flame text-[color:var(--highlight)]"/>
                <span className="font-display text-3xl num text-white leading-none">{userTrack.current_streak}</span>
                <span className="text-xs text-white uppercase tracking-widest">streak</span>
              </div>
              <div className="h-2 w-full rounded-full bg-black overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }}
                  transition={{ type: "spring", stiffness: 60, damping: 18 }}
                  className="h-full rounded-full bg-white"
                  style={{ boxShadow: "0 0 12px oklch(1 0 0 / 0.6)" }}/>
              </div>
              <p className="text-[10px] uppercase tracking-[0.25em] text-white font-mono mt-1.5 num">{progress}% complete</p>
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
          className="mt-6 depth-card rounded-[2rem] p-8 relative overflow-hidden">
          <p className="text-[10px] uppercase tracking-[0.3em] font-mono" style={{ color: `var(${trackHueVar(slug)})` }}>Mission · Day {today.day_number}</p>
          <h2 className="font-display text-3xl mt-2 leading-tight tracking-tight">{today.title}</h2>
          <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{today.description}</p>

          <div className="mt-5 grid gap-3">
            <DayPanel label="Today's task" hue="--hue-violet">{today.task}</DayPanel>
            <DayPanel label="Reflection" hue="--hue-pink">{today.reflection}</DayPanel>
            <DayPanel label="Science" hue="--hue-mint">{today.science}</DayPanel>
          </div>

          {!today.completed_at ? (
            <div className="mt-5">
              <div className="relative">
                <textarea
                  value={note}
                  onChange={e => {
                    setNote(e.target.value);
                    setValidationError(null);
                    if (validationState !== "checking") setValidationState("idle");
                  }}
                  onBlur={runValidation}
                  placeholder={today.checkin_prompt}
                  className={`w-full rounded-2xl bg-input border p-4 pr-10 text-sm outline-none focus:ring-2 focus:ring-ring min-h-[88px] transition ${
                    validationState === "invalid"
                      ? "border-[color:var(--hue-red)] ring-1 ring-[color:var(--hue-red)]"
                      : validationState === "valid"
                      ? "border-[color:var(--hue-green)] ring-1 ring-[color:var(--hue-green)]"
                      : "border-border"
                  }`} />
                <div className="absolute right-3 top-3 flex items-center justify-center h-6 w-6">
                  {validationState === "checking" && (
                    <span className="h-2.5 w-2.5 rounded-full bg-[color:var(--primary)] pulse-dot" aria-label="Validating" />
                  )}
                  {validationState === "valid" && (
                    <span className="checkmark-pop inline-flex h-6 w-6 items-center justify-center rounded-full bg-[color:var(--hue-green)] text-white">
                      <Check className="h-3.5 w-3.5" />
                    </span>
                  )}
                </div>
              </div>
              {validationError && (
                <p className="mt-2 text-sm font-medium text-[color:var(--hue-red)] shake">{validationError}</p>
              )}
              <button
                onClick={() => {
                  const trimmed = note.trim();
                  if (!trimmed) {
                    const msg = WARNINGS[Math.floor(Math.random() * WARNINGS.length)];
                    setValidationError(msg);
                    setValidationState("invalid");
                    return;
                  }
                  if (validationState === "invalid") {
                    // already showing AI message; re-roll a new one to nudge
                    setValidationError(AI_WARNINGS[Math.floor(Math.random() * AI_WARNINGS.length)]);
                    return;
                  }
                  if (validationState === "checking") return;
                  complete.mutate(today.id);
                }}
                disabled={complete.isPending || validationState === "checking"}
                className={`btn-chunk mt-4 rounded-full text-white px-7 py-3.5 text-sm font-bold disabled:opacity-50 inline-flex items-center gap-2 ${complete.isPending ? "breathe" : ""}`}
                style={{ background: trackHueGradient(slug), boxShadow: `0 16px 36px -10px color-mix(in oklab, var(${trackHueVar(slug)}) 65%, transparent)` }}>
                <Check className="h-4 w-4"/> {complete.isPending ? "Listening…" : `Complete day ${today.day_number}`}
              </button>
            </div>
          ) : (
            <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-[color:var(--tertiary)]/15 px-4 py-2 text-sm font-semibold text-[color:var(--tertiary)]">
              <Check className="h-4 w-4"/> Day complete
            </div>
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
                  className={`relative w-full text-left rounded-xl px-3 py-2 transition flex items-center gap-3 ${isToday ? "bg-primary ring-1 ring-primary/40" : "hover:bg-accent/50"} ${isLocked ? "opacity-50 cursor-default" : ""}`}>
                  <span className={`absolute -left-[18px] top-1/2 -translate-y-1/2 h-3 w-3 rounded-full ${d?.completed_at ? "bg-primary" : isToday ? "bg-primary ring-4 ring-primary/20" : "bg-border"}`}/>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-[11px] uppercase tracking-widest ${isToday ? "text-white/80" : "text-muted-foreground"}`}>Day {dayNum}</span>
                      {isMilestone && <Trophy className={`h-3 w-3 ${isToday ? "text-white" : "text-primary"}`}/>}
                      {isLocked && <Lock className={`h-3 w-3 ${isToday ? "text-white/80" : "text-muted-foreground"}`}/>}
                    </div>
                    <p className={`text-sm font-medium truncate ${isToday ? "text-white" : ""}`}>{d?.title ?? "Coming soon"}</p>
                  </div>
                  {d?.completed_at && <Check className={`h-4 w-4 shrink-0 ${isToday ? "text-white" : "text-primary"}`}/>}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* AI coach chat */}
      <section className="mt-6 depth-card rounded-3xl p-5 flex flex-col h-[500px]">
        <h2 className="text-[11px] uppercase tracking-[0.3em] font-mono mb-3" style={{ color: `var(${trackHueVar(slug)})` }}>AI Coach</h2>
        <div className="flex-1 overflow-y-auto space-y-3 pr-2">
          {(chat?.messages ?? []).length === 0 && (
            <p className="text-sm text-muted-foreground">Your coach knows your journey, your motivation, and your obstacle. Ask anything.</p>
          )}
          {(chat?.messages ?? []).map((m: any) => (
            <div key={m.id} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
              {m.role === "user" ? (
                <div className="max-w-[82%] rounded-2xl rounded-br-md px-4 py-2.5 text-sm whitespace-pre-wrap text-white" style={{ background: "var(--grad-electric)" }}>{m.content}</div>
              ) : (
                <div className="ai-border max-w-[82%]">
                  <div className="rounded-[1.2rem] px-4 py-2.5 text-sm whitespace-pre-wrap bg-card text-foreground">{m.content}</div>
                </div>
              )}
            </div>
          ))}
          {sendMsg.isPending && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-[color:var(--primary)] pulse-dot"/>
              <span>Coach is thinking…</span>
            </div>
          )}
          <div ref={endRef}/>
        </div>
        <form onSubmit={(e)=>{e.preventDefault(); if(input.trim()) sendMsg.mutate(input.trim());}} className="mt-3 flex gap-2">
          <input value={input} onChange={(e)=>setInput(e.target.value)} placeholder="Message your coach…"
            className="flex-1 rounded-full bg-input border border-border px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" />
          <button type="submit" disabled={!input.trim() || sendMsg.isPending}
            className="btn-chunk h-10 w-10 rounded-full text-white flex items-center justify-center disabled:opacity-50"
            style={{ background: "var(--grad-electric)", boxShadow: "var(--shadow-violet)" }}>
            <Send className="h-4 w-4"/>
          </button>
        </form>
      </section>

      {/* Day detail modal */}
      {openDay && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4 overscroll-contain"
          onClick={() => setOpenDay(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="bg-card border border-border rounded-t-3xl sm:rounded-3xl w-full sm:max-w-lg p-6 max-h-[85vh] overflow-y-auto shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 sticky top-0 bg-card -mx-6 px-6 -mt-6 pt-6 pb-3 z-10">
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground">Day {openDay.day_number}</p>
                <h3 className="text-xl font-bold mt-1">{openDay.title}</h3>
              </div>
              <button
                onClick={() => setOpenDay(null)}
                aria-label="Close"
                className="shrink-0 inline-flex h-9 w-9 items-center justify-center rounded-full bg-accent hover:bg-accent/70 text-foreground"
              >
                <X className="h-4 w-4"/>
              </button>
            </div>
            <p className="text-sm text-muted-foreground mt-3">{openDay.description}</p>
            <div className="mt-4 space-y-3">
              <div className="rounded-xl bg-accent/50 p-3"><p className="text-[11px] uppercase tracking-widest text-muted-foreground mb-1">Task</p><p className="text-sm">{openDay.task}</p></div>
              <div className="rounded-xl bg-accent/50 p-3"><p className="text-[11px] uppercase tracking-widest text-muted-foreground mb-1">Reflection</p><p className="text-sm">{openDay.reflection}</p></div>
              <div className="rounded-xl bg-accent/50 p-3"><p className="text-[11px] uppercase tracking-widest text-muted-foreground mb-1">Science</p><p className="text-sm">{openDay.science}</p></div>
              {openDay.user_note && (
                <div className="rounded-xl bg-primary p-3"><p className="text-[11px] uppercase tracking-widest text-primary mb-1">Your note</p><p className="text-sm whitespace-pre-wrap">{openDay.user_note}</p></div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Milestone modal */}
      {milestone && (
        <div className="fixed inset-0 z-50 bg-background  flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 18 }}
            className="depth-card rounded-[2rem] w-full max-w-md p-8 text-center relative overflow-hidden">
            <div className="absolute -top-20 -right-20 h-72 w-72 rounded-full opacity-50 blur-3xl" style={{ background: "var(--grad-electric)" }}/>
            <div className="absolute -bottom-20 -left-20 h-60 w-60 rounded-full opacity-40 blur-3xl" style={{ background: "var(--grad-sunset)" }}/>
            {/* particle burst */}
            {Array.from({ length: 20 }).map((_, i) => {
              const angle = (i / 20) * Math.PI * 2;
              return (
                <motion.span key={i}
                  initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                  animate={{ x: Math.cos(angle)*180, y: Math.sin(angle)*180, opacity: 0, scale: 0.4 }}
                  transition={{ duration: 1.2, delay: 0.1, ease: [0.2,0.9,0.2,1] }}
                  className="absolute left-1/2 top-1/2 h-2 w-2 rounded-full"
                  style={{ background: i % 3 === 0 ? "var(--highlight)" : i % 3 === 1 ? "var(--secondary)" : "var(--tertiary)" }}/>
              );
            })}
            <div className="relative">
              <div className="mx-auto h-24 w-24 rounded-full flex items-center justify-center" style={{ background: "var(--grad-sunset)", boxShadow: "var(--shadow-yellow)" }}>
                <Trophy className="h-12 w-12 text-white"/>
              </div>
              <p className="text-[11px] uppercase tracking-[0.3em] font-mono text-[color:var(--highlight)] mt-5">Milestone unlocked</p>
              <h2 className="font-display text-5xl tracking-[-0.04em] mt-1 text-sunset num">Day {milestone.day}</h2>
              <p className="text-sm mt-4 whitespace-pre-wrap">{milestone.message}</p>
              {milestone.science && (
                <div className="mt-5 rounded-2xl bg-accent/40 p-3 text-left">
                  <p className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground font-mono mb-1">What's happening</p>
                  <p className="text-sm">{milestone.science}</p>
                </div>
              )}
              <div className="mt-6 flex gap-2">
                <button onClick={()=>setMilestone(null)} className="btn-chunk flex-1 rounded-full text-white px-5 py-3 text-sm font-bold" style={{ background: "var(--grad-electric)", boxShadow: "var(--shadow-violet)" }}>Continue</button>
                <button onClick={()=>{
                  const text = `Day ${milestone.day} on ${catalog.name} — ${milestone.message}`;
                  if (navigator.share) navigator.share({ text }).catch(()=>{});
                  else { navigator.clipboard.writeText(text); toast.success("Copied"); }
                }} className="btn-chunk flex-1 rounded-full border border-border px-5 py-3 text-sm font-bold hover:bg-accent">Share</button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function DayPanel({ label, hue, children }: { label: string; hue: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl p-4 relative overflow-hidden border border-white/5 bg-card">
      <div aria-hidden className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl" style={{ background: `var(${hue})`, boxShadow: `0 0 12px var(${hue})` }}/>
      <p className="text-[10px] uppercase tracking-[0.3em] font-mono mb-1.5" style={{ color: `var(${hue})` }}>{label}</p>
      <p className="text-sm leading-relaxed text-foreground">{children}</p>
    </div>
  );
}