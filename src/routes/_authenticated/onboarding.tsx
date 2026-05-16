import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { suggestTrack, activateTracks } from "@/lib/elevate.functions";
import { CATEGORY_CLASS } from "@/lib/categories";

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
        bg-[radial-gradient(60%_60%_at_50%_30%,oklch(0.50_0.18_40_/_0.4),transparent_70%)]" />

      <AnimatePresence mode="wait">
        {step === "q" && (
          <motion.div key="q" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.6, ease: [0.2,0.8,0.2,1] }}
            className="max-w-2xl w-full text-center">
            <p className="text-[10px] uppercase tracking-[0.35em] text-muted-foreground mb-8">One question</p>
            <h1 className="font-display text-[clamp(2rem,6vw,4rem)] leading-[1.05] tracking-[-0.03em] font-light">
              What is the one thing that,<br/>
              <span className="italic text-gradient">if you changed it</span>,<br/>
              would change everything?
            </h1>
            <form onSubmit={(e) => { e.preventDefault(); if (answer.trim().length >= 3) ask.mutate(); }} className="mt-12">
              <textarea
                autoFocus value={answer} onChange={(e)=>setAnswer(e.target.value.slice(0, 500))}
                placeholder="Take your time. Be honest."
                className="w-full bg-transparent border-0 border-b border-border focus:border-primary outline-none
                  text-center font-display text-2xl italic placeholder:text-muted-foreground/40
                  py-4 px-2 resize-none min-h-[120px] transition-colors"
              />
              <button type="submit" disabled={answer.trim().length < 3}
                className="mt-8 inline-flex items-center gap-2 rounded-full grad-warm text-background
                  px-7 py-3.5 text-sm font-medium shadow-[var(--shadow-glow)] disabled:opacity-30 transition">
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
            <div className="mx-auto h-20 w-20 rounded-full grad-warm breathe flex items-center justify-center">
              <Sparkles className="h-8 w-8 text-background" />
            </div>
            <p className="mt-8 font-display italic text-xl text-muted-foreground">Listening to what you said…</p>
          </motion.div>
        )}

        {step === "reveal" && result?.track && (
          <motion.div key="r" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.2,0.8,0.2,1] }}
            className="max-w-xl w-full text-center">
            <p className="text-[10px] uppercase tracking-[0.35em] text-primary mb-6">Your first path</p>
            <div className={`mx-auto h-16 w-16 rounded-2xl ${CATEGORY_CLASS[result.track.category]} flex items-center justify-center
              text-background font-display text-xl shadow-[var(--shadow-glow)] mb-6`}>
              {result.track.name.slice(0,2)}
            </div>
            <h1 className="font-display text-4xl md:text-5xl tracking-tight">{result.track.name}</h1>
            <p className="mt-3 text-xs uppercase tracking-[0.3em] text-muted-foreground">{result.track.category}</p>
            <p className="mt-8 font-display italic text-xl leading-relaxed text-foreground/90">"{result.reason}"</p>
            {result.identity && (
              <p className="mt-6 text-sm text-primary">{result.identity}</p>
            )}
            <div className="mt-10 flex flex-col items-center gap-4">
              <button onClick={()=>commit.mutate()} disabled={commit.isPending}
                className="inline-flex items-center gap-2 rounded-full grad-warm text-background
                  px-8 py-3.5 text-sm font-medium shadow-[var(--shadow-glow)] disabled:opacity-50">
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
