import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";
import { generateWeeklyInsight } from "@/lib/elevate.functions";

export const Route = createFileRoute("/_authenticated/insights")({ component: Insights });

function Insights() {
  const fn = useServerFn(generateWeeklyInsight);
  const [content, setContent] = useState<string>("");
  const m = useMutation({
    mutationFn: () => fn(),
    onSuccess: (d) => setContent(d.content),
    onError: (e: any) => toast.error(e.message),
  });
  return (
    <div className="container mx-auto px-6 py-8 max-w-3xl">
      <h1 className="text-3xl font-bold tracking-tight">Weekly Insight</h1>
      <p className="text-muted-foreground mt-1">An AI-generated reflection on your last 7 days.</p>
      <button onClick={()=>m.mutate()} disabled={m.isPending} className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-5 py-2.5 text-sm font-semibold disabled:opacity-50">
        <Sparkles className="h-4 w-4"/> {m.isPending ? "Analyzing…" : "Generate this week's report"}
      </button>
      {content && (
        <article className="mt-8 glass rounded-2xl p-6 whitespace-pre-wrap text-sm leading-relaxed">{content}</article>
      )}
    </div>
  );
}
