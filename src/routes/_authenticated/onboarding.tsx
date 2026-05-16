import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { suggestTrack, activateTracks } from "@/lib/elevate.functions";
import { trackHueGradient, trackHueVar } from "@/lib/categories";

export const Route = createFileRoute("/_authenticated/onboarding")({ component: Onboarding });

function Onboarding() {
  const suggest = useServerFn(suggestTrack);
  const act = useServerFn(activateTracks);
  const qc = useQueryClient();
  const nav = useNavigate();
  const [step, setStep] = useState<"q" | "thinking" | "reveal">("q");
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState<any>(null);

  const ask = useMutation({
    mutationFn: () => suggest({ data: { answer } }),
    onMutate: () => setStep("thinking"),
    onSuccess: (r) => { setResult(r); setStep("reveal"); },
    onError: (e: any) => { toast.error(e.message); setStep("q"); },
  });

  const commit = useMutation({
    mutationFn: () => act({ data: { trackIds: [result.track.id] } }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["userTracks"] });
      nav({ to: "/track/$slug", params: { slug: result.track.slug } });
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="relative min-h-screen flex items-center justify-center px-6 overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10
        bg-[radial-gradient(60%_60%_at_50%_30%,oklch(0.62_0.215_275_/_0.45),transparent_70%),radial-gradient(45%_55%_at_85%_80%,oklch(0.70_0.215_340_/_0.30),transparent_70%)]" />

      <AnimatePresence mode="wait">
        {step === "q" && (
          <motion.div key="q" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.6, ease: [0.2,0.8,0.2,1] }}
            className="max-w-2xl w-full text-center">
            <p className="text-[10px] uppercase tracking-[0.35em] text-muted-foreground mb-8">One question</p>
            <h1 className="font-display text-[clamp(2rem,6vw,4.5rem)] leading-[1.02] tracking-[-0.04em] font-semibold">
              What is the one thing that,<br/>
              <span className="text-electric text-yellow-400">if you changed it</span>,<br/>
              would change everything?
            </h1>
            <form onSubmit={(e) => { e.preventDefault(); if (answer.trim().length >= 3) ask.mutate(); }} className="mt-12">
              <textarea
                autoFocus value={answer} onChange={(e)=>setAnswer(e.target.value.slice(0, 500))}
                placeholder="Take your time. Be honest."
                className="w-full bg-transparent border-0 border-b-2 border-border focus:border-[color:var(--primary)] outline-none
                  text-center font-display text-2xl placeholder:text-muted-foreground
                  py-4 px-2 resize-none min-h-[120px] transition-colors"
              />
              <button type="submit" disabled={answer.trim().length < 3}
                className="btn-chunk mt-8 inline-flex items-center gap-2 rounded-full grad-electric text-white
                  px-8 py-4 text-sm font-bold shadow-[var(--shadow-violet)] disabled:opacity-30">
                Continue <ArrowRight className="h-4 w-4" />
              </button>
              <p className="mt-6 text-xs text-muted-foreground">
                Or <Link to="/tracks" className="underline underline-offset-4 hover:text-foreground">browse all 50 paths</Link>
              </p>
            </form>
          </motion.div>
        )}

        {step === "thinking" && (
          <motion.div key="t" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="text-center">
            <div className="mx-auto h-24 w-24 rounded-full grad-electric breathe flex items-center justify-center" style={{ boxShadow: "var(--shadow-violet)" }}>
              <Sparkles className="h-9 w-9 text-white" />
            </div>
            <p className="mt-8 font-display text-xl text-muted-foreground">Listening to what you said…</p>
          </motion.div>
        )}

        {step === "reveal" && result?.track && (
          <motion.div key="r" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.2,0.8,0.2,1] }}
            className="max-w-xl w-full text-center">
            <p className="text-[11px] uppercase tracking-[0.35em] font-mono mb-6" style={{ color: `var(${trackHueVar(result.track.slug || result.track.name)})` }}>Your first path</p>
            <motion.div
              initial={{ rotateY: 180, opacity: 0 }} animate={{ rotateY: 0, opacity: 1 }}
              transition={{ duration: 0.9, ease: [0.2,0.9,0.2,1] }}
              className="mx-auto h-20 w-20 rounded-3xl flex items-center justify-center text-white font-display text-2xl mb-6"
              style={{ background: trackHueGradient(result.track.slug || result.track.name), boxShadow: `0 20px 40px -10px color-mix(in oklab, var(${trackHueVar(result.track.slug || result.track.name)}) 60%, transparent)` }}>
              {result.track.name.slice(0,2)}
            </motion.div>
            <h1 className="font-display text-4xl md:text-5xl tracking-[-0.03em]">{result.track.name}</h1>
            <p className="mt-3 text-[11px] uppercase tracking-[0.3em] font-mono text-muted-foreground">{result.track.category}</p>
            <p className="mt-8 text-xl leading-relaxed text-foreground">"{result.reason}"</p>
            {result.identity && (
                <p className="mt-6 text-sm text-electric text-yellow-400 font-semibold">{result.identity}</p>
            )}
            <div className="mt-10 flex flex-col items-center gap-4">
              <button onClick={()=>commit.mutate()} disabled={commit.isPending}
                className="btn-chunk inline-flex items-center gap-2 rounded-full grad-electric text-white
                  px-9 py-4 text-sm font-bold shadow-[var(--shadow-violet)] disabled:opacity-50">
                {commit.isPending ? "Committing…" : "I'm in. Begin."}
              </button>
              <button onClick={()=>{ setStep("q"); setResult(null); }} className="text-xs text-muted-foreground hover:text-foreground">
                Ask me again
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
